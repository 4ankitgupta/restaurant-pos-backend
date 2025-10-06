import { type Request, type Response, type NextFunction } from "express";
import { type AnyZodObject } from "zod";
import httpStatus from "http-status";
import { ApiError } from "../utils/ApiError.js";

export const validate =
  (schema: AnyZodObject) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next();
    } catch (error: any) {
      const validationErrors = error.issues.map((err: any) => ({
        field: err.path[err.path.length - 1],
        message: err.message,
      }));
      next(
        new ApiError(
          httpStatus.BAD_REQUEST,
          "Validation failed",
          validationErrors
        )
      );
    }
  };
