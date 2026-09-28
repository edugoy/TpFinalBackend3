const fs = require('fs');
const path = require('path');
const winston = require('winston');
const config = require('./env');

const logDir = path.resolve(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

const transports = [
  new winston.transports.File({ filename: path.join(logDir, 'error.log'), level: 'error' }),
  new winston.transports.File({ filename: path.join(logDir, 'combined.log') })
];

if (config.nodeEnv === 'development') {
  transports.push(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

const logger = winston.createLogger({
  level: config.logLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports,
  exitOnError: false
});

module.exports = logger;
