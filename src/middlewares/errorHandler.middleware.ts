import { NextFunction, Request, Response } from "express";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  console.error({
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.originalUrl,
    status: err.status || err.statusCode || 500,
    message: err.message,
    stack: err.stack,
  });

  if (res.headersSent) {
    return next(err);
  }

  const status = err.status || err.statusCode || 500;

  res.status(status).json({
    error: status >= 500 ? "Internal server error" : err.message,
  });
};
