const HamtMap = require('./HamtMap.js')
const MegaMap = require('./MegaMap.js')

module.exports = {
  HamtMap,
  MegaMap,
  ...require('./Commands.js'),
  ...require('./Persistence.js'),
  ...require('./Server.js'),
  ...require('./Protocol.js')
}
