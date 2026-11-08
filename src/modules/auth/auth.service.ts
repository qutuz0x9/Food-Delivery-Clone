import type { PasswordHasher } from "../../common/password-hasher.js";
import { parseUtcTimestamp } from "../../common/timestamps.js";
import type { TransactionRunner } from "../../prisma/db.js";
import type { CustomersService } from "../customers/index.js";
import { toCustomerResponse } from "./auth.mapper.js";
import {
  AccountNotActiveError,
  EmailAlreadyExistsError,
  InvalidCredentialsError,
  InvalidRefreshTokenError,
  NotACustomerError,
  PhoneNumberInUseError,
} from "./auth.errors.js";
import type {
  AuthRepository,
  NewRefreshToken,
  NewUser,
} from "./auth.repository.js";
import {
  REVOKED_REASONS,
  ROLE_NAMES,
  type IssuedRefreshToken,
  type LoginCustomerResult,
  type RefreshCustomerResult,
  type RegisterCustomerResult,
  type RequestContext,
} from "./auth.types.js";
import type {
  LoginCustomerInput,
  RegisterCustomerInput,
} from "./auth.validation.js";
import type { AccessTokenClaims, TokenService } from "./token.service.js";

export class AuthService {
  private readonly db: TransactionRunner;
  private readonly authRepository: AuthRepository;
  private readonly customers: CustomersService;
  private readonly hasher: PasswordHasher;
  private readonly tokens: TokenService;

  constructor(
    db: TransactionRunner,
    authRepository: AuthRepository,
    customers: CustomersService,
    hasher: PasswordHasher,
    tokens: TokenService,
  ) {
    this.db = db;
    this.authRepository = authRepository;
    this.customers = customers;
    this.hasher = hasher;
    this.tokens = tokens;
  }

  async registerCustomer(
    input: RegisterCustomerInput,
    context: RequestContext,
  ): Promise<RegisterCustomerResult> {
    const normalizedEmail = input.email.toLowerCase();
    const emailUser =
      await this.authRepository.findUserByNormalizedEmail(normalizedEmail);
    if (emailUser) throw new EmailAlreadyExistsError();
    const phoneUser = await this.authRepository.findUserByPhoneNumber(
      input.phoneNumber,
    );
    if (phoneUser) throw new PhoneNumberInUseError();

    const roleId = await this.authRepository.findRoleIdByName(
      ROLE_NAMES.customer,
    );
    if (!roleId)
      throw new Error(
        `Role "${ROLE_NAMES.customer}" is missing from identity.roles: run the seed`,
      );
    const hashPass = await this.hasher.hash(input.password);
    const issuedRefreshToken = this.tokens.createRefreshToken();
    const result = await this.db.transaction(async (tx) => {
      const newUser: NewUser = {
        email: input.email,
        normalizedEmail: normalizedEmail,
        passwordHash: hashPass,
        phoneNumber: input.phoneNumber,
      };
      const user = await this.authRepository.createUser(newUser, tx);
      await this.authRepository.assignRole(user.id, roleId, tx);
      const customer = await this.customers.createProfile(
        {
          userId: user.id,
          firstName: input.firstName,
          lastName: input.lastName,
        },
        tx,
      );
      const newRefreshToken: NewRefreshToken = {
        userId: user.id,
        tokenHash: issuedRefreshToken.tokenHash,
        ipAddress: context.ipAddress,
        expiresAt: issuedRefreshToken.expiresAt,
      };
      await this.authRepository.createRefreshToken(newRefreshToken, tx);
      return {
        user,
        customer,
      };
    });
    const accessTokenClaims: AccessTokenClaims = {
      userId: result.user.id,
      role: ROLE_NAMES.customer,
    };
    const accessToken = this.tokens.signAccessToken(accessTokenClaims);

    const RegisterCustomerResult: RegisterCustomerResult = {
      customer: toCustomerResponse(result.user, result.customer),
      refreshToken: issuedRefreshToken,
      accessToken: accessToken,
    };

    return RegisterCustomerResult;
  }

  async loginCustomer(
    input: LoginCustomerInput,
    context: RequestContext,
  ): Promise<LoginCustomerResult> {
    const normalizedEmail = input.email.toLowerCase();
    const user =
      await this.authRepository.findUserByNormalizedEmail(normalizedEmail);
    // Verified even without a user, so the response time doesn't reveal which emails exist.
    const passVerify: boolean = await this.hasher.verify(
      input.password,
      user?.passwordHash ?? null,
    );
    if (!user) throw new InvalidCredentialsError();
    if (!passVerify) throw new InvalidCredentialsError();
    const userStatus = user.accountStatus;
    if (userStatus !== "active") throw new AccountNotActiveError(userStatus);
    const customer = await this.customers.findProfileByUserId(user.id);
    if (!customer) throw new NotACustomerError();
    const issuedRefreshToken: IssuedRefreshToken =
      this.tokens.createRefreshToken();
    const newRefreshToken: NewRefreshToken = {
      userId: user.id,
      tokenHash: issuedRefreshToken.tokenHash,
      expiresAt: issuedRefreshToken.expiresAt,
      ipAddress: context.ipAddress,
    };
    await this.authRepository.createRefreshToken(newRefreshToken);
    const accessTokenClaims: AccessTokenClaims = {
      userId: user.id,
      role: ROLE_NAMES.customer,
    };
    const accessToken = this.tokens.signAccessToken(accessTokenClaims);
    const loginCustomerResult: LoginCustomerResult = {
      customer: toCustomerResponse(user, customer),
      refreshToken: issuedRefreshToken,
      accessToken: accessToken,
    };

    return loginCustomerResult;
  }

  async refreshCustomer(
    refreshToken: string | undefined,
    context: RequestContext,
  ): Promise<RefreshCustomerResult> {
    if (!refreshToken) throw new InvalidRefreshTokenError("missing");
    const stored = await this.authRepository.findRefreshTokenByHash(
      this.tokens.hashRefreshToken(refreshToken),
    );
    if (!stored) throw new InvalidRefreshTokenError();
    // Checked before expiry, so a replayed expired token still revokes its chain.
    if (stored.revokedAt !== null) {
      await this.authRepository.revokeTokenChain(
        stored.id,
        REVOKED_REASONS.reuseDetected,
      );
      throw new InvalidRefreshTokenError();
    }
    if (parseUtcTimestamp(stored.expiresAt) <= new Date())
      throw new InvalidRefreshTokenError();
    const user = await this.authRepository.findUserById(stored.userId);
    if (!user) throw new InvalidRefreshTokenError();
    if (user.accountStatus !== "active")
      throw new AccountNotActiveError(user.accountStatus);
    const customer = await this.customers.findProfileByUserId(user.id);
    if (!customer) throw new NotACustomerError();
    const issuedRefreshToken: IssuedRefreshToken =
      this.tokens.createRefreshToken();
    const rotated = await this.db.transaction(async (tx) => {
      const revoked = await this.authRepository.revokeRefreshTokenIfActive(
        stored.id,
        {
          reason: REVOKED_REASONS.rotated,
          replacedByToken: issuedRefreshToken.id,
        },
        tx,
      );
      if (!revoked) return false;
      const newRefreshToken: NewRefreshToken = {
        id: issuedRefreshToken.id,
        userId: stored.userId,
        tokenHash: issuedRefreshToken.tokenHash,
        expiresAt: issuedRefreshToken.expiresAt,
        ipAddress: context.ipAddress,
      };
      await this.authRepository.createRefreshToken(newRefreshToken, tx);
      return true;
    });
    // Outside the transaction, so the revocation commits even though this request fails.
    if (!rotated) {
      await this.authRepository.revokeTokenChain(
        stored.id,
        REVOKED_REASONS.reuseDetected,
      );
      throw new InvalidRefreshTokenError();
    }
    const accessTokenClaims: AccessTokenClaims = {
      userId: user.id,
      role: ROLE_NAMES.customer,
    };
    const refreshCustomerResult: RefreshCustomerResult = {
      accessToken: this.tokens.signAccessToken(accessTokenClaims),
      refreshToken: issuedRefreshToken,
    };
    return refreshCustomerResult;
  }

  async logoutCustomer(refreshToken: string | undefined): Promise<void> {
    if (!refreshToken) return;
    const stored = await this.authRepository.findRefreshTokenByHash(
      this.tokens.hashRefreshToken(refreshToken),
    );
    if (!stored) return;
    await this.authRepository.revokeTokenChain(
      stored.id,
      REVOKED_REASONS.logout,
    );
  }
}
