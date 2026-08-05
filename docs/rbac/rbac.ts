import { Request, Response, NextFunction } from "express";
import { RoleCode } from "./fieldVisibility";

export interface AuthenticatedRequest extends Request {
  auth?: {
    userId: string;
    role: RoleCode;
    departmentId?: string;
    permissions?: string[];
  };
}

export function requireRole(...allowedRoles: RoleCode[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.auth || !req.auth.role) {
      res.status(401).json({ success: false, error: "Unauthorized: Missing authentication token." });
      return;
    }

    if (!allowedRoles.includes(req.auth.role) && req.auth.role !== RoleCode.R01_SUPER_ADMIN) {
      res.status(403).json({
        success: false,
        error: `Forbidden: Role '${req.auth.role}' is not authorized to access this resource.`
      });
      return;
    }

    next();
  };
}

export function requirePermission(...requiredPermissions: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.auth) {
      res.status(401).json({ success: false, error: "Unauthorized: Missing authentication token." });
      return;
    }

    if (req.auth.role === RoleCode.R01_SUPER_ADMIN) {
      next();
      return;
    }

    const userPermissions = req.auth.permissions || [];
    const hasAll = requiredPermissions.every((p) => userPermissions.includes(p));

    if (!hasAll) {
      res.status(403).json({
        success: false,
        error: "Forbidden: Insufficient permissions to perform this action."
      });
      return;
    }

    next();
  };
}
