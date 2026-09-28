const mongoose = require('mongoose');
const multer = require('multer');
const logger = require('../config/logger');
const { AppError, ValidationError } = require('../errors/AppError');

function normalizeError(err) {
  if (err instanceof AppError) return err;

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return new ValidationError('El archivo supera el tamaño máximo permitido');
    }
    return new ValidationError(`Error de carga de archivo: ${err.message}`);
  }

  if (err instanceof mongoose.Error.ValidationError) {
    const details = Object.values(err.errors).map((item) => item.message);
    return new ValidationError('Datos inválidos', details);
  }

  if (err instanceof mongoose.Error.CastError) {
    return new ValidationError('Identificador inválido');
  }

  if (err && err.code === 11000) {
    return new ValidationError('Ya existe un registro con un valor único utilizado', err.keyValue);
  }

  return new AppError('Error interno del servidor', 500, 'INTERNAL_ERROR');
}

module.exports = function errorHandler(err, req, res, _next) {
  const normalized = normalizeError(err);

  logger.error('Error procesando solicitud', {
    method: req.method,
    path: req.originalUrl,
    statusCode: normalized.statusCode,
    code: normalized.code,
    message: err.message,
    stack: err.stack
  });

  const payload = {
    success: false,
    error: {
      code: normalized.code,
      message: normalized.message
    }
  };

  if (normalized.details !== undefined) payload.error.details = normalized.details;

  res.status(normalized.statusCode).json(payload);
};
