const logger = require('../config/logger');
const config = require('../config/env');
const { ok } = require('../utils/response');
const { isDbReady } = require('../config/db');
const { AppError } = require('../errors/AppError');

class SystemController {
  async health(_req, res) {
    const dbReady = isDbReady();
    const payload = {
      status: dbReady ? 'ok' : 'degraded',
      environment: config.nodeEnv,
      database: dbReady ? 'connected' : 'disconnected',
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString()
    };
    return ok(res, payload, dbReady ? 200 : 503);
  }

  async loggerTest(_req, res) {
    if (!config.allowInternalEndpoints) {
      throw new AppError('Endpoint interno deshabilitado', 403, 'INTERNAL_ENDPOINT_DISABLED');
    }
    logger.debug('ShipNow logger debug test');
    logger.info('ShipNow logger info test');
    logger.warn('ShipNow logger warn test');
    logger.error('ShipNow logger error test');
    return ok(res, { message: 'Eventos de prueba enviados al logger' });
  }
}

module.exports = new SystemController();
