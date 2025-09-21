import {
  type Request,
  type Response,
  type NextFunction,
  type RequestHandler,
} from "express";

const asyncHandler = (fn: RequestHandler): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export { asyncHandler };
