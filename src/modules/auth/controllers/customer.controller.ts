import type { CookieOptions, Request, Response } from "express";
import type { AuthService } from "../auth.service.js";
import type { IssuedRefreshToken } from "../auth.types.js";
import type { LoginCustomerInput, RegisterCustomerInput } from "../auth.validation.js";

export const REFRESH_TOKEN_COOKIE = "refreshToken";

export interface RefreshCookieConfig {
  readonly secure: boolean;
  readonly path: string;
}

export class CustomerAuthController {
  private readonly authService: AuthService;
  private readonly cookie: RefreshCookieConfig;

  constructor(authService: AuthService, cookie: RefreshCookieConfig) {
    this.authService = authService;
    this.cookie = cookie;
  }

  register = async (req: Request<Record<string, string>, unknown, RegisterCustomerInput>, res: Response): Promise<void> => {
    const result = await this.authService.registerCustomer(req.body, { ipAddress: req.ip ?? null });

    this.setRefreshTokenCookie(res, result.refreshToken);
    res.status(201).json({
      success: true,
      message: "Customer account created successfully",
      data: { customer: result.customer, accessToken: result.accessToken },
    });
  };

  login = async (req: Request<Record<string, string>, unknown, LoginCustomerInput>, res: Response): Promise<void> => {
    const result = await this.authService.loginCustomer(req.body, { ipAddress: req.ip ?? null });

    this.setRefreshTokenCookie(res, result.refreshToken);
    res.status(200).json({
      success: true,
      message: "Logged in successfully",
      data: { customer: result.customer, accessToken: result.accessToken },
    });
  };

  refresh = async (req: Request, res: Response): Promise<void> => {
    const cookie: unknown = req.cookies?.[REFRESH_TOKEN_COOKIE];
    const result = await this.authService.refreshCustomer(typeof cookie === "string" ? cookie : undefined, {
      ipAddress: req.ip ?? null,
    });

    this.setRefreshTokenCookie(res, result.refreshToken);
    res.status(200).json({
      success: true,
      message: "Access token refreshed successfully",
      data: { accessToken: result.accessToken },
    });
  };

  logout = async (req: Request, res: Response): Promise<void> => {
    const cookie: unknown = req.cookies?.[REFRESH_TOKEN_COOKIE];
    await this.authService.logoutCustomer(typeof cookie === "string" ? cookie : undefined);

    // Same options as when it was set: browsers match a cookie by name and path.
    res.clearCookie(REFRESH_TOKEN_COOKIE, this.refreshCookieOptions());
    res.status(200).json({ success: true, message: "Logged out successfully", data: null });
  };

  private setRefreshTokenCookie(res: Response, refreshToken: IssuedRefreshToken): void {
    res.cookie(REFRESH_TOKEN_COOKIE, refreshToken.token, {
      ...this.refreshCookieOptions(),
      maxAge: refreshToken.expiresAt.getTime() - Date.now(),
    });
  }

  private refreshCookieOptions(): CookieOptions {
    return { httpOnly: true, secure: this.cookie.secure, sameSite: "strict", path: this.cookie.path };
  }
}
