import { PasswordHasher } from "../../common/password-hasher.js";
import type { TransactionRunner } from "../../prisma/db.js";
import type { CustomersService } from "../customers/index.js";
import { toCustomerResponse } from "./auth.mapper.js";
import {
  EmailAlreadyExistsError,
  PhoneNumberInUseError,
} from "./auth.errors.js";
import type {
  AuthRepository,
  NewRefreshToken,
  NewUser,
} from "./auth.repository.js";
import {
  ROLE_NAMES,
  type CustomerResponse,
  type IssuedRefreshToken,
  type RegisterCustomerResult,
  type RequestContext,
} from "./auth.types.js";
import type { RegisterCustomerInput } from "./auth.validation.js";
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
    const normalizedEmail = input.email.toLocaleLowerCase();
    // 2. If the email is taken, throw EmailAlreadyExistsError.
    const emailUser =
      await this.authRepository.findUserByNormalizedEmail(normalizedEmail);
    if (emailUser) throw EmailAlreadyExistsError;
    // 3. If the phone number is taken, throw PhoneNumberInUseError.
    const phoneUser = await this.authRepository.findUserByPhoneNumber(
      input.phoneNumber,
    );
    if (phoneUser) throw PhoneNumberInUseError;

    // 4. Find the Customer role id; if missing, throw a plain Error (becomes a 500).
    const roleId = await this.authRepository.findRoleIdByName(
      ROLE_NAMES.customer,
    );
    if (!roleId) throw Error("Internel Server Error");
    // 5. Hash the password and create the refresh token (before the transaction).
    const hashPass = await this.hasher.hash(input.password);
    // 6. In one transaction (pass tx to each call): user, role, profile, token hash.
    const result = await this.db.transaction(async (tx) => {
      //1) Create User In Database
      const newUser: NewUser = {
        email: input.email,
        normalizedEmail: normalizedEmail,
        passwordHash: hashPass,
        phoneNumber: input.phoneNumber,
      };
      const user = await this.authRepository.createUser(newUser);
      //2) Assing Customer Role In Database (User_Roles (UserId, RoleId))
      await this.authRepository.assignRole(user.id, roleId);
      //3) Create Customer Profile
      const customer = await this.customers.createProfile({
        userId: user.id,
        firstName: input.firstName,
        lastName: input.lastName,
      });
      //4) Create Refresh Token
      const issuedRefreshToken = this.tokens.createRefreshToken();
      const newRefreshToken: NewRefreshToken = {
        userId: user.id,
        tokenHash: issuedRefreshToken.tokenHash,
        ipAddress: context.ipAddress,
        expiresAt: issuedRefreshToken.expiresAt,
      };
      await this.authRepository.createRefreshToken(newRefreshToken);
      //5) Return Data
      return {
        user: user,
        customer: customer,
        issuedRefreshToken: issuedRefreshToken,
      };
    });
    // 7. After the transaction, sign the access token (user id + Customer role).
    const accessTokenClaims: AccessTokenClaims = {
      userId: result.user.id,
      role: ROLE_NAMES.customer,
    };
    const accessToken = this.tokens.signAccessToken(accessTokenClaims);
    //8. Return the mapped customer, the access token and the refresh token.
    const customerResponse: CustomerResponse = {
      id: result.customer.id,
      email: result.user.email,
      firstName: result.customer.firstName,
      lastName: result.customer.lastName,
      phoneNumber: result.user.phoneNumber,
    };
    const refreshToken: IssuedRefreshToken = result.issuedRefreshToken;
    const RegisterCustomerResult: RegisterCustomerResult = {
      customer: customerResponse,
      refreshToken: refreshToken,
      accessToken: accessToken,
    };

    return RegisterCustomerResult;
  }
}
