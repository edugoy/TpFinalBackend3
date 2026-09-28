const app = require('./app');
const config = require('./config/env');
const { connectDb, disconnectDb } = require('./config/db');
const logger = require('./config/logger');

let server;

async function start() {
  try {
    await connectDb();
    server = app.listen(config.port, () => {
      logger.info(`ShipNow API escuchando en puerto ${config.port}`);
    });
  } catch (error) {
    logger.error('No fue posible iniciar ShipNow API', { message: error.message, stack: error.stack });
    process.exit(1);
  }
}

async function shutdown(signal) {
  logger.info(`Señal ${signal} recibida. Cerrando ShipNow API...`);
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await disconnectDb();
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

start();
