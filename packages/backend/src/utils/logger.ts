import winston from 'winston';

const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss',
  }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const logger = winston.createLogger({
  level:
    process.env['LOG_LEVEL'] != null && process.env['LOG_LEVEL'] !== ''
      ? process.env['LOG_LEVEL']
      : 'info',
  format: logFormat,
  defaultMeta: {
    service: 'learning-path-builder-backend',
  },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    }),
  ],
});

// Only add file transport in production if not running on Cloud Run
// Cloud Run captures console logs automatically and filesystem is read-only
const isCloudRun = process.env['K_SERVICE'] != null || process.env['PORT'] != null;
if (process.env['NODE_ENV'] === 'production' && !isCloudRun) {
  logger.add(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
    })
  );

  logger.add(
    new winston.transports.File({
      filename: 'logs/combined.log',
    })
  );
}

export { logger };
