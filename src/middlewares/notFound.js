const { NotFoundError } = require('../errors/AppError');

module.exports = function notFound(req, _res, next) {
  next(new NotFoundError(`Ruta ${req.method} ${req.originalUrl}`));
};
