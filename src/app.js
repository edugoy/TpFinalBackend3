const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const apiRoutes = require('./routes');
const swaggerSpec = require('./config/swagger');
const requestLogger = require('./middlewares/requestLogger');
const notFound = require('./middlewares/notFound');
const errorHandler = require('./middlewares/errorHandler');
const config = require('./config/env');

const app = express();

app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
if (config.nodeEnv === 'development') app.use(morgan('dev'));
app.use(requestLogger);

app.get('/', (_req, res) => {
  res.json({
    success: true,
    data: {
      name: 'ShipNow API',
      version: '1.0.0',
      docs: '/api/docs',
      health: '/api/health'
    }
  });
});

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));
app.use('/api', apiRoutes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
