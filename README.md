# sider-mem

> An in-memory datastore in node for [Redis™][redis][^redis] compatible clients

Supports:
- [auth][]entication
- expiry ([expire][], [ttl][], [pexpire][], [pttl][], ...)
- strings ([set][], [mset][], [get][], [mget][], ...)
- hashes ([hset][], [hmset][], [hget][], [hgetall][], ...)
- list ([lindex][], [llen][], [lpop][], [lpush] [], ...)
- publish/ subscribe ([publish][], [subscribe][], [psubscribe][], ...)
- persistence

Does not (yet) support:
- transactions (rollback on error)
- sets
- streams
- partitioning
- replication

## installation

    npm i sider-mem

start the server

    npx sider-mem --port 6379 --user alice --password somepassword


## usage

```js
const { Server } = require('sider-mem')

// start the server
const server = new Server({username: 'alice', password: 'somepassword'})
await server.listen({ port: 6379 })

// ...

// disconnect
await server.close()
```

connect with client

```js
const redis = require('redis')

const client = redis.createClient({user: 'alice', password: 'somepassword'})

client.ping((err, data) => console.log(data)) // PONG
```

See [example](./examples) for use with a clustered app.
Start with `npm run example` and browse to http://localhost:3000


## API

### new Server()

| Option              | default       | Description                                                  |
| ------------------- | ------------- | ------------------------------------------------------------ |
| username            | "default"     | Enables authentication                                       |
| password            | -             |                                                              |
| log                 | _debug-level_ | Changes logger; e.g. to use console logging `() => console` |
| gracefulTimeout     | 100           | (ms) Server timeout on shutdown                              |
| nextHouseKeepingSec | 30            | (s) Housekeeping interval for cleanup of expired keys        |
| dbDir               | -             | Persistence: database directory for append only files        |
| HashMap             | [Map][Map]    | Use a different hash-map implementation than [ES6 Map][Map]. See `src/HampMap.js` and `src/MegaMap.js` for possible implementations |

### server.listen()

| Option   | default   | Description |
| -------- | --------- | ----------- |
| port     | 6379      | Listening Port |
| host     | 127.0.0.1 | Set to `0.0.0.0` to accept incoming connections from any host |


## commands

<details>
  <summary><b>Supported commands ⏬</b>
  </summary>

- [append][]
- [auth][]
- [client][]
- [command][]
- [decr][]
- [decrby][]
- [del][]
- [echo][]
- [exec][]
- [exists][]
- [expire][]
- [expireat][]
- [expiretime][]
- [flushall][]
- [flushdb][]
- [get][]
- [getdel][]
- [getex][]
- [getrange][]
- [getset][]
- [hdel][]
- [hello][]
- [hexists][]
- [hget][]
- [hgetall][]
- [hincrby][]
- [hincrbyfloat][]
- [hkeys][]
- [hlen][]
- [hmget][]
- [hmset][]
- [hscan][]
- [hset][]
- [hsetnx][]
- [hstrlen][]
- [hvals][]
- [incr][]
- [incrby][]
- [incrbyfloat][]
- [info][]
- [lindex][]
- [llen][]
- [lpop][]
- [lpos][]
- [lpush][]
- [lpushx][]
- [lrange][]
- [lrem][]
- [lset][]
- [ltrim][]
- [mget][]
- [mset][]
- [msetnx][]
- [multi][]
- [persist][]
- [pexpire][]
- [pexpireat][]
- [pexpiretime][]
- [ping][]
- [psetex][]
- [psubscribe][]
- [pttl][]
- [publish][]
- [pubsub][]
- [punsubscribe][]
- [quit][]
- [rpop][]
- [rpush][]
- [rpushx][]
- [scan][]
- [select][]
- [set][]
- [setex][]
- [setnx][]
- [setrange][]
- [shutdown][]
- [strlen][]
- [subscribe][]
- [substr][]
- [ttl][]
- [type][]
- [unsubscribe][]

</details>

<br>
<br>

# license

[MIT][]

<!-- references -->

[^redis]: Redis is a trademark of Redis Ltd. Any rights therein are reserved to Redis Ltd. Any use by this documentation is for referential purposes only and does not indicate any sponsorship, endorsement or affiliation between Redis and the author(s).

[MIT]: ./LICENSE

[Map]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map

[redis]: https://redis.io

[append]: https://redis.io/commands/append
[auth]: https://redis.io/commands/auth
[client]: https://redis.io/commands/client
[command]: https://redis.io/commands/command
[decr]: https://redis.io/commands/decr
[decrby]: https://redis.io/commands/decrby
[del]: https://redis.io/commands/del
[echo]: https://redis.io/commands/echo
[exec]: https://redis.io/commands/exec
[exists]: https://redis.io/commands/exists
[expire]: https://redis.io/commands/expire
[expireat]: https://redis.io/commands/expireat
[expiretime]: https://redis.io/commands/expiretime
[flushall]: https://redis.io/commands/flushall
[flushdb]: https://redis.io/commands/flushdb
[get]: https://redis.io/commands/get
[getdel]: https://redis.io/commands/getdel
[getex]: https://redis.io/commands/getex
[getrange]: https://redis.io/commands/getrange
[getset]: https://redis.io/commands/getset
[hdel]: https://redis.io/commands/hdel
[hello]: https://redis.io/commands/hello
[hexists]: https://redis.io/commands/hexists
[hget]: https://redis.io/commands/hget
[hgetall]: https://redis.io/commands/hgetall
[hincrby]: https://redis.io/commands/hincrby
[hincrbyfloat]: https://redis.io/commands/hincrbyfloat
[hkeys]: https://redis.io/commands/hkeys
[hlen]: https://redis.io/commands/hlen
[hmget]: https://redis.io/commands/hmget
[hmset]: https://redis.io/commands/hmset
[hscan]: https://redis.io/commands/hscan
[hset]: https://redis.io/commands/hset
[hsetnx]: https://redis.io/commands/hsetnx
[hstrlen]: https://redis.io/commands/hstrlen
[hvals]: https://redis.io/commands/hvals
[incr]: https://redis.io/commands/incr
[incrby]: https://redis.io/commands/incrby
[incrbyfloat]: https://redis.io/commands/incrbyfloat
[info]: https://redis.io/commands/info
[lindex]: https://redis.io/commands/lindex
[llen]: https://redis.io/commands/llen
[lpop]: https://redis.io/commands/lpop
[lpos]: https://redis.io/commands/lpos
[lpush]: https://redis.io/commands/lpush
[lpushx]: https://redis.io/commands/lpushx
[lrange]: https://redis.io/commands/lrange
[lrem]: https://redis.io/commands/lrem
[lset]: https://redis.io/commands/lset
[ltrim]: https://redis.io/commands/ltrim
[mget]: https://redis.io/commands/mget
[mset]: https://redis.io/commands/mset
[msetnx]: https://redis.io/commands/msetnx
[multi]: https://redis.io/commands/multi
[persist]: https://redis.io/commands/persist
[pexpire]: https://redis.io/commands/pexpire
[pexpireat]: https://redis.io/commands/pexpireat
[pexpiretime]: https://redis.io/commands/pexpiretime
[ping]: https://redis.io/commands/ping
[psetex]: https://redis.io/commands/psetex
[psubscribe]: https://redis.io/commands/psubscribe
[pttl]: https://redis.io/commands/pttl
[publish]: https://redis.io/commands/publish
[pubsub]: https://redis.io/commands/pubsub
[punsubscribe]: https://redis.io/commands/punsubscribe
[quit]: https://redis.io/commands/quit
[rpop]: https://redis.io/commands/rpop
[rpush]: https://redis.io/commands/rpush
[rpushx]: https://redis.io/commands/rpushx
[scan]: https://redis.io/commands/scan
[select]: https://redis.io/commands/select
[set]: https://redis.io/commands/set
[setex]: https://redis.io/commands/setex
[setnx]: https://redis.io/commands/setnx
[setrange]: https://redis.io/commands/setrange
[shutdown]: https://redis.io/commands/shutdown
[strlen]: https://redis.io/commands/strlen
[subscribe]: https://redis.io/commands/subscribe
[substr]: https://redis.io/commands/substr
[ttl]: https://redis.io/commands/ttl
[type]: https://redis.io/commands/type
[unsubscribe]: https://redis.io/commands/unsubscribe
