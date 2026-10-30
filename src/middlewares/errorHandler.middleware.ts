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
    error: err.message,
    stack: err.stack,
  });

  if (res.headersSent) {
    return next(err);
  }

  res.status(err.status || err.statusCode || 500).json({
    error:
      err.status && err.status < 500 ? err.message : "Internal server error",
  });
};
