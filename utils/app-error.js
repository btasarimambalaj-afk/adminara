// utils/app-error.js - Standardized Application Error

const errorCodes = require('./error-codes');

class AppError extends Error {
  constructor(message, statusCode = 500, errorCode = 'INTERNAL_ERROR', isOperational = true) {
    super(message);
    
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      error: {
        code: this.errorCode,
        message: this.message,
        statusCode: this.statusCode,
        timestamp: this.timestamp
      }
    };
  }

  static badRequest(message, errorCode = 'BAD_REQUEST') {
    return new AppError(message, 400, errorCode);
  }

  static unauthorized(message = 'Unauthorized', errorCode = 'UNAUTHORIZED') {
    return new AppError(message, 401, errorCode);
  }

  static forbidden(message = 'Forbidden', errorCode = 'FORBIDDEN') {
    return new AppError(message, 403, errorCode);
  }

  static notFound(message = 'Not found', errorCode = 'NOT_FOUND') {
    return new AppError(message, 404, errorCode);
  }

  static conflict(message, errorCode = 'CONFLICT') {
    return new AppError(message, 409, errorCode);
  }

  static tooManyRequests(message = 'Too many requests', errorCode = 'RATE_LIMIT_EXCEEDED') {
    return new AppError(message, 429, errorCode);
  }

  static internal(message = 'Internal server error', errorCode = 'INTERNAL_ERROR') {
    return new AppError(message, 500, errorCode, false);
  }
}

// Error handler middleware
function errorHandler(err, req, res, next) {
  let error = err;

  // Convert non-AppError to AppError
  if (!(error instanceof AppError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal server error';
    error = new AppError(message, statusCode, 'INTERNAL_ERROR', false);
  }

  // Log error
  const logger = require('./logger');
  if (!error.isOperational) {
    logger.error('Unhandled error:', {
      message: error.message,
      stack: error.stack,
      errorCode: error.errorCode
    });
  }

  // Send response
  const response = error.toJSON();
  
  // Hide stack trace in production
  if (process.env.NODE_ENV !== 'production' && error.stack) {
    response.error.stack = error.stack;
  }

  res.status(error.statusCode).json(response);
}

module.exports = { AppError, errorHandler };
