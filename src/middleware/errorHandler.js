// backend/src/middleware/errorHandler.js
const { ValidationError, UniqueConstraintError, ForeignKeyConstraintError } = require('sequelize');

/**
 * Global error handling middleware
 * Standardizes error responses across the application
 */
const errorHandler = (err, req, res, next) => {
  // Log error for debugging
  console.error('ERROR:', err);
  
  // Set default status code and error message
  let statusCode = 500;
  let errorMessage = 'Internal Server Error';
  let errors = [];
  let errorType = 'server_error';
  
  // Handle different types of errors
  
  // Sequelize Validation Errors
  if (err instanceof ValidationError) {
    statusCode = 400;
    errorMessage = 'Validation failed';
    errorType = 'validation_error';
    errors = err.errors.map(e => ({
      field: e.path,
      message: e.message
    }));
  }
  
  // Sequelize Unique Constraint Errors
  else if (err instanceof UniqueConstraintError) {
    statusCode = 409; // Conflict
    errorMessage = 'Duplicate entry';
    errorType = 'conflict_error';
    errors = err.errors.map(e => ({
      field: e.path,
      message: e.message
    }));
  }
  
  // Sequelize Foreign Key Constraint Errors
  else if (err instanceof ForeignKeyConstraintError) {
    statusCode = 400;
    errorMessage = 'Invalid reference';
    errorType = 'reference_error';
    errors = [{
      field: err.fields,
      message: 'Referenced entity does not exist'
    }];
  }
  
  // JWT Errors
  else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = 401;
    errorMessage = err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token';
    errorType = 'auth_error';
  }
  
  // Custom errors (thrown with specific status codes)
  else if (err.statusCode) {
    statusCode = err.statusCode;
    errorMessage = err.message;
    errorType = err.type || 'custom_error';
    errors = err.errors || [];
  }
  
  // Handle standard Node.js errors
  else if (err.code === 'ECONNREFUSED') {
    errorMessage = 'Database connection failed';
    errorType = 'database_error';
  }
  
  // Use user-defined error message if available
  if (err.message && err.message !== 'Internal Server Error') {
    errorMessage = err.message;
  }
  
  // Create error response
  const errorResponse = {
    error: {
      type: errorType,
      message: errorMessage,
      ...(errors.length > 0 && { details: errors })
    }
  };
  
  // Add stack trace in development environment
  if (process.env.NODE_ENV === 'development' && err.stack) {
    errorResponse.error.stack = err.stack;
  }
  
  return res.status(statusCode).json(errorResponse);
};

/**
 * Custom error class for application errors
 * Allows setting a specific status code and error type
 */
class AppError extends Error {
  constructor(message, statusCode, type = 'app_error', errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.type = type;
    this.errors = errors;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 404 handler middleware
 * Handles requests to non-existent routes
 */
const notFoundHandler = (req, res, next) => {
  const error = new AppError(`Not found - ${req.originalUrl}`, 404, 'not_found');
  next(error);
};

module.exports = {
  errorHandler,
  AppError,
  notFoundHandler
};