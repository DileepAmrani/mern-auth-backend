import logger from "../utils/logger.js";
import dotenv from "dotenv";
dotenv.config();
class ErrorHandler extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;

    Error.captureStackTrace(this, this.constructor);
  }
}

const errorMiddleware = (err, req, res, next) => {
  // Log the error with proper details (always log stack trace for internal debugging)
  logger.error({
    message: err.message,
    statusCode: err.statusCode || 500,
    stack: err.stack,
    path: req.originalUrl,
    method: req.method
  });

  const statusCode = err.statusCode || 500;
  
  // Create response object
  const errorResponse = {
    success: false,
    message: err.message || "Internal Server Error",
  };
  
  // Only include stack trace in development environment
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
};

export { ErrorHandler, errorMiddleware };
