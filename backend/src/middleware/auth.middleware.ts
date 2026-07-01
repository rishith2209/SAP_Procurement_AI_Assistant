import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  department: string;
  name: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export const authenticateToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({
      status: 'error',
      message: 'Access denied. Security session token missing.'
    });
    return;
  }

  const jwtSecret = process.env.JWT_SECRET || 'sap_procurement_fallback_secret_key';

  jwt.verify(token, jwtSecret, (err, decoded) => {
    if (err) {
      res.status(403).json({
        status: 'error',
        message: 'Forbidden. Session token expired or invalid.'
      });
      return;
    }
    
    req.user = decoded as AuthUser;
    next();
  });
};
