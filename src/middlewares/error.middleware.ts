import { type Request, type Response, type NextFunction } from "express";
import httpStatus from "http-status";
import { ApiError } from "../utils/ApiError.js";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let { statusCode, message } = err;
  if (!(err instanceof ApiError)) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    message = "Internal Server Error";
  }

  const response = {
    code: statusCode,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  };

  console.error(err);

  res.status(statusCode).json(response);
};
