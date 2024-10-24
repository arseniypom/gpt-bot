import { createLogger, format, transports } from 'winston';

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.printf(({ timestamp, level, message }) => `${timestamp} ${level}: ${message}`)
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'error.log', level: 'error' }),
    new transports.File({ filename: 'warnings.log', level: 'warn', handleExceptions: false }),
    new transports.File({ filename: 'info.log', level: 'info', handleExceptions: false }),
  ],
});

export default logger;
