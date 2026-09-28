const mongoose = require('mongoose');
const config = require('./env');
const logger = require('./logger');

async function connectDb(uri = config.mongoUri) {
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);
  logger.info('MongoDB conectado');
  return mongoose.connection;
}

async function disconnectDb() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    logger.info('MongoDB desconectado');
  }
}

function isDbReady() {
  return mongoose.connection.readyState === 1;
}

module.exports = { connectDb, disconnectDb, isDbReady };
