// src/v1/middlewares/token.ts

/**
 * Enhanced Authentication Middleware
 *
 * Improvements made:
 * 1. Better error handling with custom AuthError class
 * 2. Consistent error response format
 * 3. Helper functions for DRY principle
 * 4. Support for Bearer token format
 * 5. Flexible role-based access control
 * 6. Optional token verification for public endpoints
 * 7. Rate limiting capabilities
 * 8. Enhanced token signing with configurable options
 * 9. Better type safety throughout
 * 10. Proper environment variable validation
 *
 * Usage examples:
 * - verifyToken: Basic user authentication
 * - verifyAdminToken: Admin-only access
 * - verifyTokenAndRole(RoleEnum.ADMIN, RoleEnum.LANDLORD): Multiple role access
 * - verifyTokenOptional: Public endpoints with optional user context
 * - createUserRateLimit(100, 3600000): Rate limit 100 requests per hour per user
 */

import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";
import { NextFunction, Request, Response } from "express";
import { RoleEnum } from "../enums/role.enum";
import { IUser, User } from "../models/user.model";

export interface ExtendedRequest extends Request {
  user?: IUser;
  admin?: IUser;
  businessId?: string;
}

export interface PaginateRequest extends ExtendedRequest {
  query: {
    page?: string;
    limit?: string;
  };
}

// Custom error types for better error handling
class AuthError extends Error {
  constructor(message: string, public statusCode: number) {
    super(message);
    this.name = "AuthError";
  }
}

// Helper function to extract and verify JWT token
async function extractAndVerifyToken(
  authHeader: string
): Promise<
  JwtPayload & { id: string; role?: RoleEnum; for_password?: boolean }
> {
  if (!authHeader) {
    throw new AuthError("Token not provided", 401);
  }

  try {
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : authHeader;
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new AuthError("JWT secret not configured", 500);
    }

    const decoded = jwt.verify(token, secret) as JwtPayload & {
      id: string;
      role?: RoleEnum;
      for_password?: boolean;
    };
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AuthError("Token has expired", 401);
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new AuthError("Invalid token", 401);
    }
    throw new AuthError("Token verification failed", 401);
  }
}

// Helper function to find user by ID
async function findUserById(id: string): Promise<IUser> {
  const user = await User.findById(id).exec();
  if (!user) {
    throw new AuthError("User not found", 404);
  }
  return user;
}

// Helper function to send error response
function sendErrorResponse(res: Response, error: AuthError | Error): void {
  const statusCode = error instanceof AuthError ? error.statusCode : 500;
  const message = error.message || "Internal server error";

  res.status(statusCode).json({
    status: false,
    message,
    data: null,
  });
}

// Basic token verification middleware
export async function verifyToken(
  req: ExtendedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization as string;
    const decoded = await extractAndVerifyToken(authHeader);
    const user = await findUserById(decoded.id);

    req.user = user;
    next();
  } catch (error) {
    sendErrorResponse(res, error as AuthError);
  }
}

// Password reset token verification middleware
export async function verifyPasswordToken(
  req: ExtendedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization as string;
    const decoded = await extractAndVerifyToken(authHeader);

    if (!decoded.for_password) {
      throw new AuthError("Invalid token type for password reset", 403);
    }

    const user = await findUserById(decoded.id);
    req.user = user;
    next();
  } catch (error) {
    sendErrorResponse(res, error as AuthError);
  }
}

// Admin token verification middleware
export async function verifyAdminToken(
  req: ExtendedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization as string;
    const decoded = await extractAndVerifyToken(authHeader);
    const user = await findUserById(decoded.id);

    if (user.role !== RoleEnum.ADMIN) {
      throw new AuthError("Admin access required", 403);
    }

    req.admin = user;
    next();
  } catch (error) {
    sendErrorResponse(res, error as AuthError);
  }
}

// Combined token and admin role verification middleware
export async function verifyTokenAndAdmin(
  req: ExtendedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization as string;
    const decoded = await extractAndVerifyToken(authHeader);
    const user = await findUserById(decoded.id);

    if (user.role !== RoleEnum.ADMIN) {
      throw new AuthError("Admin privileges required", 403);
    }

    req.admin = user;
    next();
  } catch (error) {
    sendErrorResponse(res, error as AuthError);
  }
}

// Middleware to verify token and allow multiple roles
export function verifyTokenAndRole(...allowedRoles: RoleEnum[]) {
  return async (
    req: ExtendedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const authHeader = req.headers.authorization as string;
      const decoded = await extractAndVerifyToken(authHeader);
      const user = await findUserById(decoded.id);

      if (!allowedRoles.includes(user.role)) {
        throw new AuthError(
          `Access denied. Required roles: ${allowedRoles.join(", ")}`,
          403
        );
      }

      req.user = user;
      if (user.role === RoleEnum.ADMIN) {
        req.admin = user;
      }
      next();
    } catch (error) {
      sendErrorResponse(res, error as AuthError);
    }
  };
}

// Optional token verification (for public endpoints that can benefit from user context)
export async function verifyTokenOptional(
  req: ExtendedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization as string;
    if (authHeader) {
      const decoded = await extractAndVerifyToken(authHeader);
      const user = await findUserById(decoded.id);
      req.user = user;
    }
    next();
  } catch (error) {
    // For optional verification, we don't send error response, just continue without user
    next();
  }
}

// Enhanced token signing function with better type safety
export function signToken(
  user: IUser,
  options: {
    for_password?: boolean;
    expiresIn?: string;
  } = {}
): string {
  const { for_password = false, expiresIn = "7d" } = options;

  const payload = {
    id: user._id,
    role: user.role,
    for_password,
  };

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not set");
  }

  return jwt.sign(payload, secret, { expiresIn } as any);
}

// Utility function to decode token without verification (for debugging)
export function decodeTokenWithoutVerification(
  token: string
): JwtPayload | null {
  try {
    return jwt.decode(token) as JwtPayload;
  } catch {
    return null;
  }
}

// Middleware factory for rate limiting per user
export function createUserRateLimit(maxRequests: number, windowMs: number) {
  const userRequests = new Map<string, { count: number; resetTime: number }>();

  return async (
    req: ExtendedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // First verify the token to get user ID
      const authHeader = req.headers.authorization as string;
      const decoded = await extractAndVerifyToken(authHeader);

      const userId = decoded.id;
      const now = Date.now();
      const userLimit = userRequests.get(userId);

      if (!userLimit || now > userLimit.resetTime) {
        // Reset or initialize the limit
        userRequests.set(userId, {
          count: 1,
          resetTime: now + windowMs,
        });
        next();
      } else if (userLimit.count < maxRequests) {
        // Increment the count
        userLimit.count++;
        next();
      } else {
        // Rate limit exceeded
        res.status(429).json({
          status: false,
          message: "Rate limit exceeded. Please try again later.",
          data: null,
        });
      }
    } catch (error) {
      sendErrorResponse(res, error as AuthError);
    }
  };
}
