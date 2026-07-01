import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/db.js';
import { loginSchema } from '../validators/index.js';
import { logAudit } from '../utils/audit.js';

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const validated = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: validated.email }
    });

    if (!user) {
      res.status(401).json({
        status: 'error',
        message: 'Invalid email or password.'
      });
      return;
    }

    const isMatch = await bcrypt.compare(validated.password, user.password);
    if (!isMatch) {
      res.status(401).json({
        status: 'error',
        message: 'Invalid email or password.'
      });
      return;
    }

    // Sign Access Token
    const jwtSecret = process.env.JWT_SECRET || 'sap_procurement_fallback_secret_key';
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        department: user.department,
        name: user.name
      },
      jwtSecret,
      { expiresIn: '24h' }
    );

    // Save login audit log
    await logAudit(
      user.id,
      user.name,
      'User Authentication',
      'Security',
      `User ${user.name} logged in successfully via API session.`,
      req.ip
    );

    res.status(200).json({
      status: 'success',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          department: user.department,
          approvalLimit: user.approvalLimit
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

export const getMe = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ status: 'error', message: 'Not authenticated.' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user) {
      res.status(404).json({ status: 'error', message: 'User session not found.' });
      return;
    }

    res.status(200).json({
      status: 'success',
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department,
        approvalLimit: user.approvalLimit
      }
    });
  } catch (err) {
    next(err);
  }
};
export const logout = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (req.user) {
      await logAudit(
        req.user.id,
        req.user.name,
        'User Sign Out',
        'Security',
        `User ${req.user.name} logged out from the system.`,
        req.ip
      );
    }
    res.status(200).json({ status: 'success', message: 'Logged out successfully.' });
  } catch (err) {
    next(err);
  }
};
