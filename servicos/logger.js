var winston = require('winston');
var fs = require('fs');

if (!fs.existsSync('logs')){
  fs.mkdirSync('logs');
}

var infoOptions = {
  level: 'info',
  filename: 'logs/payfast.log',
  maxsize: 1048576,
  maxFiles: 10,
  colorsize: false
}

var errorOptions = {
  level: 'error',
  filename: 'logs/payfast_error.log',
  maxsize: 1048576,
  maxFiles: 10,
  colorsize: false
}

module.exports = winston.createLogger({
  transports: [
    new winston.transports.File(infoOptions),
    new winston.transports.File(errorOptions)
  ]
})
