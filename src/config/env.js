const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const toBoolean = (value, fallback = false) => {
  if (value === undefined) return fallback;
  return String(value).toLowerCase() === 'true';
};

const toPositiveNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const config = Object.freeze({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 8080,
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/shipnow',
  testMongoUri: process.env.TEST_MONGO_URI || '',
  logLevel: process.env.LOG_LEVEL || 'info',
  maxFileSizeMb: toPositiveNumber(process.env.MAX_FILE_SIZE_MB, 5),
  allowInternalEndpoints: toBoolean(process.env.ALLOW_INTERNAL_ENDPOINTS, true)
});

module.exports = config;
