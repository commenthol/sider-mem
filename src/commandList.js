const commandList = {
  // acl: [-2, ['admin', 'noscript', 'loading', 'stale'], 0, 0, 0, ['@admin', '@slow', '@dangerous']],
  append: [3, ['write', 'denyoom', 'fast'], 1, 1, 1, ['@write', '@string', '@fast']],
  // asking: [1, ['fast'], 0, 0, 0, ['@keyspace', '@fast']],
  auth: [-2, ['noscript', 'loading', 'stale', 'fast', 'no_auth'], 0, 0, 0, ['@fast', '@connection']],
  // bgrewriteaof: [1, ['admin', 'noscript'], 0, 0, 0, ['@admin', '@slow', '@dangerous']],
  // bgsave: [-1, ['admin', 'noscript'], 0, 0, 0, ['@admin', '@slow', '@dangerous']],
  // bitcount: [-2, ['readonly'], 1, 1, 1, ['@read', '@bitmap', '@slow']],
  // bitfield: [-2, ['write', 'denyoom'], 1, 1, 1, ['@write', '@bitmap', '@slow']],
  // bitfield_ro: [-2, ['readonly', 'fast'], 1, 1, 1, ['@read', '@bitmap', '@fast']],
  // bitop: [-4, ['write', 'denyoom'], 2, -1, 1, ['@write', '@bitmap', '@slow']],
  // bitpos: [-3, ['readonly'], 1, 1, 1, ['@read', '@bitmap', '@slow']],
  // blmove: [6, ['write', 'denyoom', 'noscript'], 1, 2, 1, ['@write', '@list', '@slow', '@blocking']],
  // blpop: [-3, ['write', 'noscript'], 1, -2, 1, ['@write', '@list', '@slow', '@blocking']],
  // brpop: [-3, ['write', 'noscript'], 1, -2, 1, ['@write', '@list', '@slow', '@blocking']],
  // brpoplpush: [4, ['write', 'denyoom', 'noscript'], 1, 2, 1, ['@write', '@list', '@slow', '@blocking']],
  // bzpopmax: [-3, ['write', 'noscript', 'fast'], 1, -2, 1, ['@write', '@sortedset', '@fast', '@blocking']],
  // bzpopmin: [-3, ['write', 'noscript', 'fast'], 1, -2, 1, ['@write', '@sortedset', '@fast', '@blocking']],
  client: [-2, ['admin', 'noscript', 'random', 'loading', 'stale'], 0, 0, 0, ['@admin', '@slow', '@dangerous', '@connection']],
  // cluster: [-2, ['admin', 'random', 'stale'], 0, 0, 0, ['@admin', '@slow', '@dangerous']],
  command: [-1, ['random', 'loading', 'stale'], 0, 0, 0, ['@slow', '@connection']],
  // config: [-2, ['admin', 'noscript', 'loading', 'stale'], 0, 0, 0, ['@admin', '@slow', '@dangerous']],
  // copy: [-3, ['write', 'denyoom'], 1, 2, 1, ['@keyspace', '@write', '@slow']],
  // dbsize: [1, ['readonly', 'fast'], 0, 0, 0, ['@keyspace', '@read', '@fast']],
  // debug: [-2, ['admin', 'noscript', 'loading', 'stale'], 0, 0, 0, ['@admin', '@slow', '@dangerous']],
  decr: [2, ['write', 'denyoom', 'fast'], 1, 1, 1, ['@write', '@string', '@fast']],
  decrby: [3, ['write', 'denyoom', 'fast'], 1, 1, 1, ['@write', '@string', '@fast']],
  del: [-2, ['write'], 1, -1, 1, ['@keyspace', '@write', '@slow']],
  // discard: [1, ['noscript', 'loading', 'stale', 'fast'], 0, 0, 0, ['@fast', '@transaction']],
  // dump: [2, ['readonly', 'random'], 1, 1, 1, ['@keyspace', '@read', '@slow']],
  echo: [2, ['fast'], 0, 0, 0, ['@fast', '@connection']],
  // eval: [-3, ['noscript', 'skip_monitor', 'may_replicate', 'movablekeys'], 0, 0, 0, ['@slow', '@scripting']],
  // evalsha: [-3, ['noscript', 'skip_monitor', 'may_replicate', 'movablekeys'], 0, 0, 0, ['@slow', '@scripting']],
  exec: [1, ['noscript', 'loading', 'stale', 'skip_slowlog'], 0, 0, 0, ['@slow', '@transaction']],
  exists: [-2, ['readonly', 'fast'], 1, -1, 1, ['@keyspace', '@read', '@fast']],
  expire: [3, ['write', 'fast'], 1, 1, 1, ['@keyspace', '@write', '@fast']],
  expireat: [3, ['write', 'fast'], 1, 1, 1, ['@keyspace', '@write', '@fast']],
  expiretime: [2, ['readonly', 'random', 'fast'], 1, 1, 1, ['@keyspace', '@read', '@fast']],
  // failover: [-1, ['admin', 'noscript', 'stale'], 0, 0, 0, ['@admin', '@slow', '@dangerous']],
  flushall: [-1, ['write'], 0, 0, 0, ['@keyspace', '@write', '@slow', '@dangerous']],
  flushdb: [-1, ['write'], 0, 0, 0, ['@keyspace', '@write', '@slow', '@dangerous']],
  // geoadd: [-5, ['write', 'denyoom'], 1, 1, 1, ['@write', '@geo', '@slow']],
  // geodist: [-4, ['readonly'], 1, 1, 1, ['@read', '@geo', '@slow']],
  // geohash: [-2, ['readonly'], 1, 1, 1, ['@read', '@geo', '@slow']],
  // geopos: [-2, ['readonly'], 1, 1, 1, ['@read', '@geo', '@slow']],
  // georadius: [-6, ['write', 'denyoom', 'movablekeys'], 1, 1, 1, ['@write', '@geo', '@slow']],
  // georadius_ro: [-6, ['readonly'], 1, 1, 1, ['@read', '@geo', '@slow']],
  // georadiusbymember: [-5, ['write', 'denyoom', 'movablekeys'], 1, 1, 1, ['@write', '@geo', '@slow']],
  // georadiusbymember_ro: [-5, ['readonly'], 1, 1, 1, ['@read', '@geo', '@slow']],
  // geosearch: [-7, ['readonly'], 1, 1, 1, ['@read', '@geo', '@slow']],
  // geosearchstore: [-8, ['write', 'denyoom'], 1, 2, 1, ['@write', '@geo', '@slow']],
  get: [2, ['readonly', 'fast'], 1, 1, 1, ['@read', '@string', '@fast']],
  // getbit: [3, ['readonly', 'fast'], 1, 1, 1, ['@read', '@bitmap', '@fast']],
  getdel: [2, ['write', 'fast'], 1, 1, 1, ['@write', '@string', '@fast']],
  getex: [-2, ['write', 'fast'], 1, 1, 1, ['@write', '@string', '@fast']],
  getrange: [4, ['readonly'], 1, 1, 1, ['@read', '@string', '@slow']],
  getset: [3, ['write', 'denyoom', 'fast'], 1, 1, 1, ['@write', '@string', '@fast']],
  hdel: [-3, ['write', 'fast'], 1, 1, 1, ['@write', '@hash', '@fast']],
  hello: [-1, ['noscript', 'loading', 'stale', 'fast', 'no_auth'], 0, 0, 0, ['@fast', '@connection']],
  hexists: [3, ['readonly', 'fast'], 1, 1, 1, ['@read', '@hash', '@fast']],
  hget: [3, ['readonly', 'fast'], 1, 1, 1, ['@read', '@hash', '@fast']],
  hgetall: [2, ['readonly', 'random'], 1, 1, 1, ['@read', '@hash', '@slow']],
  hincrby: [4, ['write', 'denyoom', 'fast'], 1, 1, 1, ['@write', '@hash', '@fast']],
  hincrbyfloat: [4, ['write', 'denyoom', 'fast'], 1, 1, 1, ['@write', '@hash', '@fast']],
  hkeys: [2, ['readonly', 'sort_for_script'], 1, 1, 1, ['@read', '@hash', '@slow']],
  hlen: [2, ['readonly', 'fast'], 1, 1, 1, ['@read', '@hash', '@fast']],
  hmget: [-3, ['readonly', 'fast'], 1, 1, 1, ['@read', '@hash', '@fast']],
  hmset: [-4, ['write', 'denyoom', 'fast'], 1, 1, 1, ['@write', '@hash', '@fast']],
  // 'host:': [-1, ['readonly', 'loading', 'stale'], 0, 0, 0, ['@read', '@slow']],
  // hrandfield: [-2, ['readonly', 'random'], 1, 1, 1, ['@read', '@hash', '@slow']],
  hscan: [-3, ['readonly', 'random'], 1, 1, 1, ['@read', '@hash', '@slow']],
  hset: [-4, ['write', 'denyoom', 'fast'], 1, 1, 1, ['@write', '@hash', '@fast']],
  hsetnx: [4, ['write', 'denyoom', 'fast'], 1, 1, 1, ['@write', '@hash', '@fast']],
  hstrlen: [3, ['readonly', 'fast'], 1, 1, 1, ['@read', '@hash', '@fast']],
  hvals: [2, ['readonly', 'sort_for_script'], 1, 1, 1, ['@read', '@hash', '@slow']],
  incr: [2, ['write', 'denyoom', 'fast'], 1, 1, 1, ['@write', '@string', '@fast']],
  incrby: [3, ['write', 'denyoom', 'fast'], 1, 1, 1, ['@write', '@string', '@fast']],
  incrbyfloat: [3, ['write', 'denyoom', 'fast'], 1, 1, 1, ['@write', '@string', '@fast']],
  info: [-1, ['random', 'loading', 'stale'], 0, 0, 0, ['@slow', '@dangerous']],
  // keys: [2, ['readonly', 'sort_for_script'], 0, 0, 0, ['@keyspace', '@read', '@slow', '@dangerous']],
  // lastsave: [1, ['random', 'loading', 'stale', 'fast'], 0, 0, 0, ['@admin', '@fast', '@dangerous']],
  // latency: [-2, ['admin', 'noscript', 'loading', 'stale'], 0, 0, 0, ['@admin', '@slow', '@dangerous']],
  // lindex: [3, ['readonly'], 1, 1, 1, ['@read', '@list', '@slow']],
  // linsert: [5, ['write', 'denyoom'], 1, 1, 1, ['@write', '@list', '@slow']],
  // llen: [2, ['readonly', 'fast'], 1, 1, 1, ['@read', '@list', '@fast']],
  // lmove: [5, ['write', 'denyoom'], 1, 2, 1, ['@write', '@list', '@slow']],
  // lolwut: [-1, ['readonly', 'fast'], 0, 0, 0, ['@read', '@fast']],
  // lpop: [-2, ['write', 'fast'], 1, 1, 1, ['@write', '@list', '@fast']],
  // lpos: [-3, ['readonly'], 1, 1, 1, ['@read', '@list', '@slow']],
  // lpush: [-3, ['write', 'denyoom', 'fast'], 1, 1, 1, ['@write', '@list', '@fast']],
  // lpushx: [-3, ['write', 'denyoom', 'fast'], 1, 1, 1, ['@write', '@list', '@fast']],
  // lrange: [4, ['readonly'], 1, 1, 1, ['@read', '@list', '@slow']],
  // lrem: [4, ['write'], 1, 1, 1, ['@write', '@list', '@slow']],
  // lset: [4, ['write', 'denyoom'], 1, 1, 1, ['@write', '@list', '@slow']],
  // ltrim: [4, ['write'], 1, 1, 1, ['@write', '@list', '@slow']],
  // memory: [-2, ['readonly', 'random', 'movablekeys'], 0, 0, 0, ['@read', '@slow']],
  mget: [-2, ['readonly', 'fast'], 1, -1, 1, ['@read', '@string', '@fast']],
  // migrate: [-6, ['write', 'random', 'movablekeys'], 3, 3, 1, ['@keyspace', '@write', '@slow', '@dangerous']],
  // module: [-2, ['admin', 'noscript'], 0, 0, 0, ['@admin', '@slow', '@dangerous']],
  // monitor: [1, ['admin', 'noscript', 'loading', 'stale'], 0, 0, 0, ['@admin', '@slow', '@dangerous']],
  // move: [3, ['write', 'fast'], 1, 1, 1, ['@keyspace', '@write', '@fast']],
  mset: [-3, ['write', 'denyoom'], 1, -1, 2, ['@write', '@string', '@slow']],
  msetnx: [-3, ['write', 'denyoom'], 1, -1, 2, ['@write', '@string', '@slow']],
  multi: [1, ['noscript', 'loading', 'stale', 'fast'], 0, 0, 0, ['@fast', '@transaction']],
  // object: [-2, ['readonly', 'random'], 2, 2, 1, ['@keyspace', '@read', '@slow']],
  // persist: [2, ['write', 'fast'], 1, 1, 1, ['@keyspace', '@write', '@fast']],
  pexpire: [-3, ['write', 'fast'], 1, 1, 1, ['@keyspace', '@write', '@fast']],
  pexpireat: [3, ['write', 'fast'], 1, 1, 1, ['@keyspace', '@write', '@fast']],
  pexpiretime: [2, ['readonly', 'random', 'fast'], 1, 1, 1, ['@keyspace', '@read', '@fast']],
  // pfadd: [-2, ['write', 'denyoom', 'fast'], 1, 1, 1, ['@write', '@hyperloglog', '@fast']],
  // pfcount: [-2, ['readonly', 'may_replicate'], 1, -1, 1, ['@read', '@hyperloglog', '@slow']],
  // pfdebug: [-3, ['write', 'denyoom', 'admin'], 2, 2, 1, ['@write', '@hyperloglog', '@admin', '@slow', '@dangerous']],
  // pfmerge: [-2, ['write', 'denyoom'], 1, -1, 1, ['@write', '@hyperloglog', '@slow']],
  // pfselftest: [1, ['admin'], 0, 0, 0, ['@hyperloglog', '@admin', '@slow', '@dangerous']],
  ping: [-1, ['stale', 'fast'], 0, 0, 0, ['@fast', '@connection']],
  // post: [-1, ['readonly', 'loading', 'stale'], 0, 0, 0, ['@read', '@slow']],
  psetex: [4, ['write', 'denyoom'], 1, 1, 1, ['@write', '@string', '@slow']],
  // psubscribe: [-2, ['pubsub', 'noscript', 'loading', 'stale'], 0, 0, 0, ['@pubsub', '@slow']],
  // psync: [-3, ['admin', 'noscript'], 0, 0, 0, ['@admin', '@slow', '@dangerous']],
  pttl: [2, ['readonly', 'random', 'fast'], 1, 1, 1, ['@keyspace', '@read', '@fast']],
  // publish: [3, ['pubsub', 'loading', 'stale', 'fast', 'may_replicate'], 0, 0, 0, ['@pubsub', '@fast']],
  // pubsub: [-2, ['pubsub', 'random', 'loading', 'stale'], 0, 0, 0, ['@pubsub', '@slow']],
  // punsubscribe: [-1, ['pubsub', 'noscript', 'loading', 'stale'], 0, 0, 0, ['@pubsub', '@slow']],
  quit: [1, [], 0, 0, 0, []],
  // randomkey: [1, ['readonly', 'random'], 0, 0, 0, ['@keyspace', '@read', '@slow']],
  // readonly: [1, ['fast'], 0, 0, 0, ['@keyspace', '@fast']],
  // readwrite: [1, ['fast'], 0, 0, 0, ['@keyspace', '@fast']],
  // rename: [3, ['write'], 1, 2, 1, ['@keyspace', '@write', '@slow']],
  // renamenx: [3, ['write', 'fast'], 1, 2, 1, ['@keyspace', '@write', '@fast']],
  // replconf: [-1, ['admin', 'noscript', 'loading', 'stale'], 0, 0, 0, ['@admin', '@slow', '@dangerous']],
  // replicaof: [3, ['admin', 'noscript', 'stale'], 0, 0, 0, ['@admin', '@slow', '@dangerous']],
  // reset: [1, ['noscript', 'loading', 'stale', 'fast'], 0, 0, 0, ['@fast', '@connection']],
  // restore: [-4, ['write', 'denyoom'], 1, 1, 1, ['@keyspace', '@write', '@slow', '@dangerous']],
  // 'restore-asking': [-4, ['write', 'denyoom', 'asking'], 1, 1, 1, ['@keyspace', '@write', '@slow', '@dangerous']],
  // role: [1, ['noscript', 'loading', 'stale', 'fast'], 0, 0, 0, ['@fast', '@dangerous']],
  // rpop: [-2, ['write', 'fast'], 1, 1, 1, ['@write', '@list', '@fast']],
  // rpoplpush: [3, ['write', 'denyoom'], 1, 2, 1, ['@write', '@list', '@slow']],
  // rpush: [-3, ['write', 'denyoom', 'fast'], 1, 1, 1, ['@write', '@list', '@fast']],
  // rpushx: [-3, ['write', 'denyoom', 'fast'], 1, 1, 1, ['@write', '@list', '@fast']],
  // sadd: [-3, ['write', 'denyoom', 'fast'], 1, 1, 1, ['@write', '@set', '@fast']],
  // save: [1, ['admin', 'noscript'], 0, 0, 0, ['@admin', '@slow', '@dangerous']],
  scan: [-2, ['readonly', 'random'], 0, 0, 0, ['@keyspace', '@read', '@slow']],
  // scard: [2, ['readonly', 'fast'], 1, 1, 1, ['@read', '@set', '@fast']],
  // script: [-2, ['noscript', 'may_replicate'], 0, 0, 0, ['@slow', '@scripting']],
  // sdiff: [-2, ['readonly', 'sort_for_script'], 1, -1, 1, ['@read', '@set', '@slow']],
  // sdiffstore: [-3, ['write', 'denyoom'], 1, -1, 1, ['@write', '@set', '@slow']],
  select: [2, ['loading', 'stale', 'fast'], 0, 0, 0, ['@keyspace', '@fast']],
  set: [-3, ['write', 'denyoom'], 1, 1, 1, ['@write', '@string', '@slow']],
  // setbit: [4, ['write', 'denyoom'], 1, 1, 1, ['@write', '@bitmap', '@slow']],
  setex: [4, ['write', 'denyoom'], 1, 1, 1, ['@write', '@string', '@slow']],
  setnx: [3, ['write', 'denyoom', 'fast'], 1, 1, 1, ['@write', '@string', '@fast']],
  setrange: [4, ['write', 'denyoom'], 1, 1, 1, ['@write', '@string', '@slow']],
  shutdown: [-1, ['admin', 'noscript', 'loading', 'stale'], 0, 0, 0, ['@admin', '@slow', '@dangerous']],
  // sinter: [-2, ['readonly', 'sort_for_script'], 1, -1, 1, ['@read', '@set', '@slow']],
  // sinterstore: [-3, ['write', 'denyoom'], 1, -1, 1, ['@write', '@set', '@slow']],
  // sismember: [3, ['readonly', 'fast'], 1, 1, 1, ['@read', '@set', '@fast']],
  // slaveof: [3, ['admin', 'noscript', 'stale'], 0, 0, 0, ['@admin', '@slow', '@dangerous']],
  // slowlog: [-2, ['admin', 'random', 'loading', 'stale'], 0, 0, 0, ['@admin', '@slow', '@dangerous']],
  // smembers: [2, ['readonly', 'sort_for_script'], 1, 1, 1, ['@read', '@set', '@slow']],
  // smismember: [-3, ['readonly', 'fast'], 1, 1, 1, ['@read', '@set', '@fast']],
  // smove: [4, ['write', 'fast'], 1, 2, 1, ['@write', '@set', '@fast']],
  // sort: [-2, ['write', 'denyoom', 'movablekeys'], 1, 1, 1, ['@write', '@set', '@sortedset', '@list', '@slow', '@dangerous']],
  // spop: [-2, ['write', 'random', 'fast'], 1, 1, 1, ['@write', '@set', '@fast']],
  // srandmember: [-2, ['readonly', 'random'], 1, 1, 1, ['@read', '@set', '@slow']],
  // srem: [-3, ['write', 'fast'], 1, 1, 1, ['@write', '@set', '@fast']],
  // sscan: [-3, ['readonly', 'random'], 1, 1, 1, ['@read', '@set', '@slow']],
  // stralgo: [-2, ['readonly', 'movablekeys'], 0, 0, 0, ['@read', '@string', '@slow']],
  strlen: [2, ['readonly', 'fast'], 1, 1, 1, ['@read', '@string', '@fast']],
  // subscribe: [-2, ['pubsub', 'noscript', 'loading', 'stale'], 0, 0, 0, ['@pubsub', '@slow']],
  substr: [4, ['readonly'], 1, 1, 1, ['@read', '@string', '@slow']],
  // sunion: [-2, ['readonly', 'sort_for_script'], 1, -1, 1, ['@read', '@set', '@slow']],
  // sunionstore: [-3, ['write', 'denyoom'], 1, -1, 1, ['@write', '@set', '@slow']],
  // swapdb: [3, ['write', 'fast'], 0, 0, 0, ['@keyspace', '@write', '@fast', '@dangerous']],
  // sync: [1, ['admin', 'noscript'], 0, 0, 0, ['@admin', '@slow', '@dangerous']],
  time: [1, ['random', 'loading', 'stale', 'fast'], 0, 0, 0, ['@fast']],
  // touch: [-2, ['readonly', 'fast'], 1, -1, 1, ['@keyspace', '@read', '@fast']],
  ttl: [2, ['readonly', 'random', 'fast'], 1, 1, 1, ['@keyspace', '@read', '@fast']],
  type: [2, ['readonly', 'fast'], 1, 1, 1, ['@keyspace', '@read', '@fast']]
  // unlink: [-2, ['write', 'fast'], 1, -1, 1, ['@keyspace', '@write', '@fast']],
  // unsubscribe: [-1, ['pubsub', 'noscript', 'loading', 'stale'], 0, 0, 0, ['@pubsub', '@slow']],
  // unwatch: [1, ['noscript', 'loading', 'stale', 'fast'], 0, 0, 0, ['@fast', '@transaction']],
  // wait: [3, ['noscript'], 0, 0, 0, ['@keyspace', '@slow']],
  // watch: [-2, ['noscript', 'loading', 'stale', 'fast'], 1, -1, 1, ['@fast', '@transaction']],
  // xack: [-4, ['write', 'random', 'fast'], 1, 1, 1, ['@write', '@stream', '@fast']],
  // xadd: [-5, ['write', 'denyoom', 'random', 'fast'], 1, 1, 1, ['@write', '@stream', '@fast']],
  // xautoclaim: [-6, ['write', 'random', 'fast'], 1, 1, 1, ['@write', '@stream', '@fast']],
  // xclaim: [-6, ['write', 'random', 'fast'], 1, 1, 1, ['@write', '@stream', '@fast']],
  // xdel: [-3, ['write', 'fast'], 1, 1, 1, ['@write', '@stream', '@fast']],
  // xgroup: [-2, ['write', 'denyoom'], 2, 2, 1, ['@write', '@stream', '@slow']],
  // xinfo: [-2, ['readonly', 'random'], 2, 2, 1, ['@read', '@stream', '@slow']],
  // xlen: [2, ['readonly', 'fast'], 1, 1, 1, ['@read', '@stream', '@fast']],
  // xpending: [-3, ['readonly', 'random'], 1, 1, 1, ['@read', '@stream', '@slow']],
  // xrange: [-4, ['readonly'], 1, 1, 1, ['@read', '@stream', '@slow']],
  // xread: [-4, ['readonly', 'movablekeys'], 0, 0, 0, ['@read', '@stream', '@slow', '@blocking']],
  // xreadgroup: [-7, ['write', 'movablekeys'], 0, 0, 0, ['@write', '@stream', '@slow', '@blocking']],
  // xrevrange: [-4, ['readonly'], 1, 1, 1, ['@read', '@stream', '@slow']],
  // xsetid: [3, ['write', 'denyoom', 'fast'], 1, 1, 1, ['@write', '@stream', '@fast']],
  // xtrim: [-4, ['write', 'random'], 1, 1, 1, ['@write', '@stream', '@slow']],
  // zadd: [-4, ['write', 'denyoom', 'fast'], 1, 1, 1, ['@write', '@sortedset', '@fast']],
  // zcard: [2, ['readonly', 'fast'], 1, 1, 1, ['@read', '@sortedset', '@fast']],
  // zcount: [4, ['readonly', 'fast'], 1, 1, 1, ['@read', '@sortedset', '@fast']],
  // zdiff: [-3, ['readonly', 'movablekeys'], 0, 0, 0, ['@read', '@sortedset', '@slow']],
  // zdiffstore: [-4, ['write', 'denyoom', 'movablekeys'], 1, 1, 1, ['@write', '@sortedset', '@slow']],
  // zincrby: [4, ['write', 'denyoom', 'fast'], 1, 1, 1, ['@write', '@sortedset', '@fast']],
  // zinter: [-3, ['readonly', 'movablekeys'], 0, 0, 0, ['@read', '@sortedset', '@slow']],
  // zinterstore: [-4, ['write', 'denyoom', 'movablekeys'], 1, 1, 1, ['@write', '@sortedset', '@slow']],
  // zlexcount: [4, ['readonly', 'fast'], 1, 1, 1, ['@read', '@sortedset', '@fast']],
  // zmscore: [-3, ['readonly', 'fast'], 1, 1, 1, ['@read', '@sortedset', '@fast']],
  // zpopmax: [-2, ['write', 'fast'], 1, 1, 1, ['@write', '@sortedset', '@fast']],
  // zpopmin: [-2, ['write', 'fast'], 1, 1, 1, ['@write', '@sortedset', '@fast']],
  // zrandmember: [-2, ['readonly', 'random'], 1, 1, 1, ['@read', '@sortedset', '@slow']],
  // zrange: [-4, ['readonly'], 1, 1, 1, ['@read', '@sortedset', '@slow']],
  // zrangebylex: [-4, ['readonly'], 1, 1, 1, ['@read', '@sortedset', '@slow']],
  // zrangebyscore: [-4, ['readonly'], 1, 1, 1, ['@read', '@sortedset', '@slow']],
  // zrangestore: [-5, ['write', 'denyoom'], 1, 2, 1, ['@write', '@sortedset', '@slow']],
  // zrank: [3, ['readonly', 'fast'], 1, 1, 1, ['@read', '@sortedset', '@fast']],
  // zrem: [-3, ['write', 'fast'], 1, 1, 1, ['@write', '@sortedset', '@fast']],
  // zremrangebylex: [4, ['write'], 1, 1, 1, ['@write', '@sortedset', '@slow']],
  // zremrangebyrank: [4, ['write'], 1, 1, 1, ['@write', '@sortedset', '@slow']],
  // zremrangebyscore: [4, ['write'], 1, 1, 1, ['@write', '@sortedset', '@slow']],
  // zrevrange: [-4, ['readonly'], 1, 1, 1, ['@read', '@sortedset', '@slow']],
  // zrevrangebylex: [-4, ['readonly'], 1, 1, 1, ['@read', '@sortedset', '@slow']],
  // zrevrangebyscore: [-4, ['readonly'], 1, 1, 1, ['@read', '@sortedset', '@slow']],
  // zrevrank: [3, ['readonly', 'fast'], 1, 1, 1, ['@read', '@sortedset', '@fast']],
  // zscan: [-3, ['readonly', 'random'], 1, 1, 1, ['@read', '@sortedset', '@slow']],
  // zscore: [3, ['readonly', 'fast'], 1, 1, 1, ['@read', '@sortedset', '@fast']],
  // zunion: [-3, ['readonly', 'movablekeys'], 0, 0, 0, ['@read', '@sortedset', '@slow']],
  // zunionstore: [-4, ['write', 'denyoom', 'movablekeys'], 1, 1, 1, ['@write', '@sortedset', '@slow']]
}

module.exports = { commandList }

// console.log(Object.keys(commandList).map(cmd => `- [${cmd}][]`).join('\n'))
// console.log(Object.keys(commandList).map(cmd => `[${cmd}]: https://redis.io/commands/${cmd}`).join('\n'))
