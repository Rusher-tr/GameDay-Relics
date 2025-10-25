class APIError extends Error {
  constructor(
    statusCode,
    message = "Something went wrong",
    errors = [],
    stack = ""
  ) {
    super(message);
    this.message = message;
    this.data = null;
    this.success = false;
    // this.isOperational = true; // to differentiate between operational errors and programming errors/
    // here its Api error so its operational error
    this.statusCode = statusCode;
    this.errors = errors;
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
      // this will create a stack trace for this error and exclude the constructor call from the stack trace
    }
  }
}
export { APIError };
