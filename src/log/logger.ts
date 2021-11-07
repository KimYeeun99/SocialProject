import winston from 'winston';
import rotate from 'winston-daily-rotate-file';
import path from 'path';
const logDir = path.join(__dirname, "..", "..", "logFile");


const format = winston.format.combine(
    winston.format.timestamp({ format : "YYYY-MM-DD HH:mm:ss |"}),
    winston.format.printf(
        (info) => `${info.timestamp} [${info.level}] : ${info.message}`
    )
)

const logger = winston.createLogger({
    format,
    transports: [
        new rotate({
          level: 'info',
          datePattern: 'YYYY-MM-DD',
          dirname: logDir,
          filename: `%DATE%.log`,
          maxFiles: 30,
          zippedArchive: true, 
        }),
        new rotate({
          level: 'error',
          datePattern: 'YYYY-MM-DD',
          dirname: logDir + '/error',
          filename: `%DATE%.error.log`,
          maxFiles: 30,
          zippedArchive: true,
        }),
      ],
})

export {logger}







