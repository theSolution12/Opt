import { Request, Response, NextFunction } from "express";

export const requestLifecycle = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const start = performance.now();

  console.log(`[IN ] ${req.method} ${req.originalUrl}`);

  res.on("finish", () => {
    console.log(
      `[OUT] ${req.method} ${req.originalUrl} ` +
        `status=${res.statusCode} duration=${(
          performance.now() - start
        ).toFixed(2)}ms`,
    );
  });

  res.on("close", () => {
    if (!res.writableEnded) {
      console.error(
        `[ABORTED] ${req.method} ${req.originalUrl} ` +
          `duration=${(performance.now() - start).toFixed(2)}ms`,
      );
    }
  });

  next();
};
