const debug = require('debug-level').log

let logFn = debug

const setLogFn = (log) => { logFn = log }

const logger = (namespace) => logFn('sider-mem' + (namespace ? ':' + namespace : ''))

module.exports = {
  logger,
  setLogFn
}
