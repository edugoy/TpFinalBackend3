class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = undefined) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Recurso') {
    super(`${resource} no encontrado`, 404, 'NOT_FOUND');
  }
}

class ValidationError extends AppError {
  constructor(message = 'Datos inválidos', details) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

class InvalidStateError extends AppError {
  constructor(message = 'Estado inválido') {
    super(message, 409, 'INVALID_STATE');
  }
}

class FileRequiredError extends AppError {
  constructor(message = 'Archivo requerido') {
    super(message, 400, 'FILE_REQUIRED');
  }
}

class InvalidFileTypeError extends AppError {
  constructor(message = 'Tipo de archivo inválido') {
    super(message, 415, 'INVALID_FILE_TYPE');
  }
}

class InvalidMockCountError extends AppError {
  constructor(message = 'Cantidad de mocks inválida') {
    super(message, 400, 'INVALID_MOCK_COUNT');
  }
}

module.exports = {
  AppError,
  NotFoundError,
  ValidationError,
  InvalidStateError,
  FileRequiredError,
  InvalidFileTypeError,
  InvalidMockCountError
};
