class ApiError extends Error {
  statusCode: number;
  isOperational: boolean;
  errors: any[];

  constructor(
    statusCode: number,
    message = "Something went wrong",
    errors: any[] = [],
    stack = ""
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.errors = errors;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export { ApiError };
