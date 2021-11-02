const OK = 'OK'

const DAY_SECONDS = 24 * 60 * 60

const USERNAME_DEFAULT = 'default'

const ERR_NOT_INTEGER = 'ERR value is not an integer or out of range'
const ERR_SYNTAX = 'ERR syntax error'
const ERR_TYPE = 'WRONGTYPE Operation against a key holding the wrong kind of value'
const ERR_VALUE_FLOAT = 'ERR value is not a valid float'
const ERR_HASH_FLOAT = 'ERR hash value is not a float'
const ERR_HASH_INTEGER = 'ERR hash value is not an integer'
const ERR_WRONGPASS = 'WRONGPASS invalid username-password pair or user is disabled.'
const ERR_NOAUTH = 'NOAUTH Authentication required.'
const ERR_EXECABORT = 'EXECABORT Transaction discarded because of previous errors.'
const ERR_CLIENT_NAMES = 'ERR Client names cannot contain spaces, newlines or special characters.'
const ERR_CURSOR = 'ERR invalid cursor'
const ERR_DB_INDEX = 'ERR DB index is out of range'

const NX = 'NX'
const XX = 'XX'
const GT = 'GT'
const LT = 'LT'

const KEY_NOT_EXISTS = -2
const KEY_NO_EXPIRY = -1

const TRUE = 1
const FALSE = 0

const TYPE_NONE = 0
const TYPE_STRING = 1
const TYPE_HASH = 2
const TYPE_LIST = 3
const TYPE_SET = 4
const TYPE_ZSET = 5
const TYPE_STREAM = 6

const TYPE_MAP = {
  none: TYPE_NONE,
  string: TYPE_STRING,
  hash: TYPE_HASH,
  list: TYPE_LIST,
  set: TYPE_SET,
  zset: TYPE_ZSET,
  stream: TYPE_STREAM
}
Object.assign(TYPE_MAP, Object.entries(TYPE_MAP).reduce((o, [k, v]) => { o[v] = k; return o }, {}))

module.exports = {
  OK,
  DAY_SECONDS,
  USERNAME_DEFAULT,
  ERR_CLIENT_NAMES,
  ERR_CURSOR,
  ERR_DB_INDEX,
  ERR_EXECABORT,
  ERR_HASH_FLOAT,
  ERR_HASH_INTEGER,
  ERR_NOAUTH,
  ERR_NOT_INTEGER,
  ERR_SYNTAX,
  ERR_TYPE,
  ERR_VALUE_FLOAT,
  ERR_WRONGPASS,
  NX,
  XX,
  GT,
  LT,
  KEY_NOT_EXISTS,
  KEY_NO_EXPIRY,
  TRUE,
  FALSE,
  TYPE_NONE,
  TYPE_STRING,
  TYPE_HASH,
  TYPE_MAP
}
