switch (process.env.NODE_ENV) {
  case 'dev':
    module.exports = require('./dev');
    break;
  case 'test':
    module.exports = require('./test');
    break;
  case 'prod':
    module.exports = require('./prod');
    break;
  default:
    console.error("Unrecognized NODE_ENV: " + process.env.NODE_ENV);
    process.exit(1);
}
