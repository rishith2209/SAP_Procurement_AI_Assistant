import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export interface AppError extends Error {
  statusCode?: number;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void => {
  console.error('Centralized Server Error:', err);

  // 1. Zod validation parsing error
  if (err instanceof ZodError) {
    res.status(400).json({
      status: 'error',
      message: 'Validation failed. Input parameters schema mismatch.',
      errors: err.errors.map(e => ({
        path: e.path.join('.'),
        message: e.message
      }))
    });
    return;
  }

  // 2. Custom exceptions
  const statusCode = err.statusCode || 500;
  const message = err.message || 'An internal server error occurred.';

  res.status(statusCode).json({
    status: 'error',
    message: statusCode === 500 ? 'Internal Server Exception' : message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};
