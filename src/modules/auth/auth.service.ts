import type { PasswordHasher } from "../../common/password-hasher.js";
import type { TransactionRunner } from "../../prisma/db.js";
import type { CustomersService } from "../customers/index.js";
import { toCustomerResponse } from "./auth.mapper.js";
import {
  AccountNotActiveError,
  EmailAlreadyExistsError,
  InvalidCredentialsError,
  NotACustomerError,
  PhoneNumberInUseError,
} from "./auth.errors.js";
import type {
  AuthRepository,
  NewRefreshToken,
  NewUser,
} from "./auth.repository.js";
import {
  ROLE_NAMES,
  type IssuedRefreshToken,
  type LoginCustomerResult,
  type RegisterCustomerResult,
  type RequestContext,
} from "./auth.types.js";
import type {
  LoginCustomerInput,
  RegisterCustomerInput,
} from "./auth.validation.js";
import type { AccessTokenClaims, TokenService } from "./token.service.js";

// Every auth rule: who may register and log in, and which tokens they get.
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
    // LEARN-TODO (core, guided): AuthService.registerCustomer
    // 1. Normalize input.email (plan §5).
    const normalizedEmail = input.email.toLowerCase();
    // 2. If the email is taken, throw EmailAlreadyExistsError.
    const emailUser =
      await this.authRepository.findUserByNormalizedEmail(normalizedEmail);
    if (emailUser) throw new EmailAlreadyExistsError();
    // 3. If the phone number is taken, throw PhoneNumberInUseError.
    const phoneUser = await this.authRepository.findUserByPhoneNumber(
      input.phoneNumber,
    );
    if (phoneUser) throw new PhoneNumberInUseError();

    // 4. Find the Customer role id; if missing, throw a plain Error (becomes a 500).
    const roleId = await this.authRepository.findRoleIdByName(
      ROLE_NAMES.customer,
    );
    if (!roleId)
      throw new Error(
        `Role "${ROLE_NAMES.customer}" is missing from identity.roles: run the seed`,
      );
    // 5. Hash the password and create the refresh token (before the transaction).
    const hashPass = await this.hasher.hash(input.password);
    const issuedRefreshToken = this.tokens.createRefreshToken();
    // 6. In one transaction (pass tx to each call): user, role, profile, token hash.
    const result = await this.db.transaction(async (tx) => {
      //1) Create User In Database
      const newUser: NewUser = {
        email: input.email,
        normalizedEmail: normalizedEmail,
        passwordHash: hashPass,
        phoneNumber: input.phoneNumber,
      };
      const user = await this.authRepository.createUser(newUser, tx);
      //2) Assing Customer Role In Database (User_Roles (UserId, RoleId))
      await this.authRepository.assignRole(user.id, roleId, tx);
      //3) Create Customer Profile
      const customer = await this.customers.createProfile(
        {
          userId: user.id,
          firstName: input.firstName,
          lastName: input.lastName,
        },
        tx,
      );
      //4) Create Refresh Token
      const newRefreshToken: NewRefreshToken = {
        userId: user.id,
        tokenHash: issuedRefreshToken.tokenHash,
        ipAddress: context.ipAddress,
        expiresAt: issuedRefreshToken.expiresAt,
      };
      await this.authRepository.createRefreshToken(newRefreshToken, tx);
      //5) Return Data
      return {
        user,
        customer,
      };
    });
    // 7. After the transaction, sign the access token (user id + Customer role).
    const accessTokenClaims: AccessTokenClaims = {
      userId: result.user.id,
      role: ROLE_NAMES.customer,
    };
    const accessToken = this.tokens.signAccessToken(accessTokenClaims);
    //8. Return the mapped customer, the access token and the refresh token.

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
    // LEARN-TODO (core, guided): AuthService.loginCustomer
    // 1. Normalize input.email, the same way registerCustomer does.
    const normalizedEmail = input.email.toLowerCase();
    // 2. Find the user by the normalized email (this.authRepository).
    const user =
      await this.authRepository.findUserByNormalizedEmail(normalizedEmail);
    // 3. Verify the password with this.hasher, even when there is no user (plan §8).
    const passVerify: boolean = await this.hasher.verify(
      input.password,
      user?.passwordHash ?? null,
    );
    // 4.  No user throw InvalidCredentialsError. Wrong password: throw InvalidCredentialsError.
    if (!user) throw new InvalidCredentialsError();
    if (!passVerify) throw new InvalidCredentialsError();
    // 5. Account not active: throw AccountNotActiveError with its status.
    const userStatus = user.accountStatus;
    if (userStatus !== "active") throw new AccountNotActiveError(userStatus);
    // 6. Find the customer profile (this.customers); none: throw NotACustomerError.
    const customer = await this.customers.findProfileByUserId(user.id);
    if (!customer) throw new NotACustomerError();
    // 7. Create the refresh token and save its hash, with the ip address (plan §7).
    const issuedRefreshToken: IssuedRefreshToken =
      this.tokens.createRefreshToken();
    const newRefreshToken: NewRefreshToken = {
      userId: user.id,
      tokenHash: issuedRefreshToken.tokenHash,
      expiresAt: issuedRefreshToken.expiresAt,
      ipAddress: context.ipAddress,
    };
    await this.authRepository.createRefreshToken(newRefreshToken);
    // 8. Sign the access token; return the mapped customer and both tokens.
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
}
