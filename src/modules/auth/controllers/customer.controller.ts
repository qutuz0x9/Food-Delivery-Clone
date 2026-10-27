import type { Request, Response } from "express";
import type { AuthService } from "../auth.service.js";
import type { IssuedRefreshToken } from "../auth.types.js";
import type { LoginCustomerInput, RegisterCustomerInput } from "../auth.validation.js";

export const REFRESH_TOKEN_COOKIE = "refreshToken";

export interface RefreshCookieConfig {
  // true in production: the cookie is only sent over HTTPS.
  readonly secure: boolean;
  // Only the auth routes (refresh, logout) need the cookie, so the browser doesn't send it anywhere else.
  readonly path: string;
}

// HTTP in and out for the customer auth routes. No rules here: those live in AuthService.
export class CustomerAuthController {
  private readonly authService: AuthService;
  private readonly cookie: RefreshCookieConfig;

  constructor(authService: AuthService, cookie: RefreshCookieConfig) {
    this.authService = authService;
    this.cookie = cookie;
  }

  // POST /auth/register/customer. req.body was already parsed by validate(registerCustomerSchema).
  register = async (req: Request<Record<string, string>, unknown, RegisterCustomerInput>, res: Response): Promise<void> => {
    const result = await this.authService.registerCustomer(req.body, { ipAddress: req.ip ?? null });

    this.setRefreshTokenCookie(res, result.refreshToken);
    res.status(201).json({
      success: true,
      message: "Customer account created successfully",
      data: { customer: result.customer, accessToken: result.accessToken },
    });
  };

  // POST /auth/login/customer. req.body was already parsed by validate(loginCustomerSchema).
  login = async (req: Request<Record<string, string>, unknown, LoginCustomerInput>, res: Response): Promise<void> => {
    const result = await this.authService.loginCustomer(req.body, { ipAddress: req.ip ?? null });

    this.setRefreshTokenCookie(res, result.refreshToken);
    res.status(200).json({
      success: true,
      message: "Logged in successfully",
      data: { customer: result.customer, accessToken: result.accessToken },
    });
  };

  // HttpOnly: page scripts can't read it, so an XSS bug can't steal it. SameSite=Strict: other sites can't make
  // the browser send it.
  private setRefreshTokenCookie(res: Response, refreshToken: IssuedRefreshToken): void {
    res.cookie(REFRESH_TOKEN_COOKIE, refreshToken.token, {
      httpOnly: true,
      secure: this.cookie.secure,
      sameSite: "strict",
      path: this.cookie.path,
      maxAge: refreshToken.expiresAt.getTime() - Date.now(),
    });
  }
}
