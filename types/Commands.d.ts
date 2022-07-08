export type Server = import('./Server.js').Server;
export type Cache = import('./Cache.js').Cache;
export type Client = import('./Client.js').Client;
export type Persistence = import('./Persistence.js').Persistence;
export type PubSub = import('./PubSub.js').PubSub;
export class Commands {
    /**
     * @param {{
     *  server: Server;
     *  cache?: Cache;
     *  client: Client;
     *  pubsub?: PubSub;
     *  drain: Persistence;
     * }} options
     */
    constructor(options: {
        server: Server;
        cache?: import("./Cache.js").Cache | undefined;
        client: Client;
        pubsub?: import("./PubSub.js").PubSub | undefined;
        drain: Persistence;
    });
    _server: import("./Server.js").Server;
    _client: import("./Client.js").Client;
    _cache: import("./Cache.js").Cache;
    _pubsub: import("./PubSub.js").PubSub;
    _drain: import("./Persistence.js").Persistence;
    /**
     * @param {string} cmd
     * @param {any[]} args
     * @returns {Error}
     */
    unknownCommand(cmd: string, args: any[]): Error;
    /**
     * @param {string} cmd
     * @param {string} subcmd
     * @returns {Error}
     */
    unknownSubCommand(cmd: string, subcmd: string): Error;
    /**
     * @param {string} cmd
     * @param {any[]} args
     * @throws {Error}
     */
    assertCommand(cmd: string, args: any[]): void;
    /**
     * @param {string} cmd
     * @param {any} args
     * @returns {Promise<any>}
     */
    handleCommand(cmd: string, args: any): Promise<any>;
    /**
     * @param {any[]} section
     * @returns {ResponseData}
     */
    info(...section: any[]): ResponseData;
    /**
     * @returns {object}
     */
    hello(): object;
    /**
     * @throws {Error}
     * @param {string} subcmd
     * @param {any[]} args
     * @returns {string[]}
     */
    command(subcmd: string, ...args: any[]): string[];
    /**
     * @returns {string[]} [secs: string, microSecs: string]
     */
    time(): string[];
    /**
     * @returns {Promise<void>}
     */
    shutdown(): Promise<void>;
    /**
     * @param {any[]} args
     * @returns {string|Error}
     */
    auth(...args: any[]): string | Error;
    /**
     * @throws {Error}
     * @param {number} db
     * @returns {string}
     */
    select(db: number): string;
    /**
     * @throws {Error}
     * @param {any} subcmd
     * @param {any[]} args
     * @returns {string|string[]|null}
     */
    client(subcmd: any, ...args: any[]): string | string[] | null;
    /**
     * @returns {string}
     */
    quit(): string;
    /**
     * @param {string} message
     * @returns {string}
     */
    ping(message: string): string;
    /**
     * @param {string} message
     * @returns {string}
     */
    echo(message: string): string;
    /**
     * @param {any[]} keys
     * @returns {number}
     */
    exists(...keys: any[]): number;
    /**
     * @param {any[]} keys
     * @returns {number}
     */
    del(...keys: any[]): number;
    /**
     * @private
     * @param {string} key
     * @param {string} newkey
     * @returns {string}
     */
    private _rename;
    /**
     * @param {string} key
     * @param {string} newkey
     * @returns {string}
     */
    rename(key: string, newkey: string): string;
    /**
     * @param {string} key
     * @param {string} newkey
     * @returns {number}
     */
    renamenx(key: string, newkey: string): number;
    /**
     * @param {any} key
     * @returns {string}
     */
    type(key: any): string;
    /**
     * @returns {string} always 'OK
     */
    flushall(): string;
    /**
     * @returns {string} always 'OK
     */
    flushdb(): string;
    /**
     * @throws {Error}
     * @param {number} cursor
     * @param {any[]} args
     * @returns {Promise<[cursor: string, results: any[]]>}
     */
    scan(cursor: number, ...args: any[]): Promise<[cursor: string, results: any[]]>;
    /**
     * @returns {boolean}
     */
    hasTransaction(): boolean;
    /**
     * @param {string} cmd
     * @param {any} args
     * @returns {Promise<ResponseData|Error|string>}
     */
    handleTransaction(cmd: string, args: any): Promise<ResponseData | Error | string>;
    /**
     * @returns {string} always 'OK
     */
    multi(): string;
    /**
     * @returns {Promise<ResponseData|Error>}
     */
    exec(): Promise<ResponseData | Error>;
    /**
     * @param {any} key
     * @param {string|number} seconds
     * @param {string} type
     */
    expire(key: any, seconds: string | number, type: string): number;
    /**
     * @param {any} key
     * @param {any} timestamp
     * @param {any} type
     * @returns {number} FALSE: 0, TRUE: 1
     */
    expireat(key: any, timestamp: any, type: any): number;
    /**
     * @param {any} key
     * @returns {number}
     */
    expiretime(key: any): number;
    /**
     * @param {any} key
     * @returns {number} TTL in seconds
     */
    ttl(key: any): number;
    /**
     * @param {any} key
     * @param {number} ms
     * @param {any} type
     * @returns {number} FALSE: 0, TRUE: 1
     */
    pexpire(key: any, ms: number, type: any): number;
    /**
     * @param {any} key
     * @param {number | undefined} timestampMs
     * @param {any} type
     * @returns {number} FALSE: 0, TRUE: 1
     */
    pexpireat(key: any, timestampMs: number | undefined, type: any): number;
    /**
     * @param {any} key
     * @returns {number}
     */
    pexpiretime(key: any): number;
    /**
     * @param {any} key
     * @returns {number} TTL in milliseconds
     */
    pttl(key: any): number;
    /**
     * @param {any} key
     * @returns {number} FALSE: 0, TRUE: 1
     */
    persist(key: any): number;
    /**
     * @param {any} key
     * @param {string} value
     * @param {string | undefined} [type]
     * @param {undefined} [amount]
     * @returns {string|null} 'OK' on success; null on failure
     */
    set(key: any, value: string, type?: string | undefined, amount?: undefined): string | null;
    /**
     * @param {any} key
     * @param {any} seconds
     * @param {any} value
     * @returns {string|null} 'OK' on success; null on failure
     */
    setex(key: any, seconds: any, value: any): string | null;
    /**
     * @param {any} key
     * @param {any} ms
     * @param {any} value
     * @returns {string|null} 'OK' on success; null on failure
     */
    psetex(key: any, ms: any, value: any): string | null;
    /**
     * @param {any} key
     * @param {string} value
     * @returns {number} length of string
     */
    append(key: any, value: string): number;
    /**
     * @param {any} key
     * @param {number} offset
     * @param {string} value
     * @returns {number} length of string
     */
    setrange(key: any, offset: number, value: string): number;
    /**
     * @param {any[]} keyValues
     * @returns {string} always 'OK'
     */
    mset(...keyValues: any[]): string;
    /**
     * @param {any[]} keyValues
     * @returns {number} FALSE: 0, TRUE: 1
     */
    msetnx(...keyValues: any[]): number;
    /**
     * @param {any} key
     * @returns {string|number|null}
     */
    get(key: any): string | number | null;
    /**
     * @param {any} key
     * @returns {string|number|null}
     */
    getdel(key: any): string | number | null;
    /**
     * @param {any} key
     * @param {any} start
     * @param {any} end
     * @returns {string}
     */
    getrange(key: any, start: any, end: any): string;
    /**
     * @param {any} key
     * @param {any} value
     * @return {string|number|null}
     */
    getset(key: any, value: any): string | number | null;
    /**
     * @param {any[]} keys
     * @return {(string|number|null)[]}
     */
    mget(...keys: any[]): (string | number | null)[];
    /**
     * @param {any} key
     * @returns {number}
     */
    strlen(key: any): number;
    /**
     * @param {any} key
     * @returns {number}
     */
    decr(key: any): number;
    /**
     * @param {any} key
     * @param {number} decrement
     * @returns {number}
     */
    decrby(key: any, decrement: number): number;
    /**
     * @param {any} key
     * @returns {number}
     */
    incr(key: any): number;
    /**
     * @param {any} key
     * @param {any} increment
     * @returns {number}
     */
    incrby(key: any, increment: any): number;
    /**
     * @param {any} key
     * @param {number} increment
     * @returns {number}
     */
    incrbyfloat(key: any, increment: number): number;
    /**
     * @param {any} key
     * @param {number[]} fieldVals
     * @returns {number}
     */
    hset(key: any, ...fieldVals: number[]): number;
    /**
     * @param {any} key
     * @param {any} field
     * @param {any} value
     * @returns {number}
     */
    hsetnx(key: any, field: any, value: any): number;
    /**
     * @param {any} key
     * @param {string | number} field
     * @returns {string|number|null}
     */
    hget(key: any, field: string | number): string | number | null;
    /**
     * @param {any} key
     * @param {any[]} fields
     * @returns {(string|number|null)[]}
     */
    hmget(key: any, ...fields: any[]): (string | number | null)[];
    /**
     *
     * @param {any} key
     * @param {any[]} fieldVals
     * @returns {string} always 'OK'
     */
    hmset(key: any, ...fieldVals: any[]): string;
    /**
     * @param {any} key
     * @returns {object}
     */
    hgetall(key: any): object;
    /**
     * @param {any} key
     * @returns {string[]}
     */
    hkeys(key: any): string[];
    /**
     * @param {any} key
     * @returns {any[]}
     */
    hvals(key: any): any[];
    /**
     * @param {any} key
     * @param {number} cursor
     * @param {any[]} args
     * @returns {[string, string[]]}
     */
    hscan(key: any, cursor: number, ...args: any[]): [string, string[]];
    /**
     * @param {any} key
     * @returns {number}
     */
    hlen(key: any): number;
    /**
     * @param {any} key
     * @param {any[]} fields
     * @returns {number}
     */
    hdel(key: any, ...fields: any[]): number;
    /**
     * @param {any} key
     * @param {string} field
     * @returns {number} FALSE: 0, TRUE: 1
     */
    hexists(key: any, field: string): number;
    /**
     * @param {any} key
     * @param {any} field
     * @param {number} increment
     * @returns {number}
     */
    hincrby(key: any, field: any, increment: number): number;
    /**
     * @param {any} key
     * @param {any} field
     * @param {number} increment
     * @returns {number}
     */
    hincrbyfloat(key: any, field: any, increment: number): number;
    /**
     * @param {any} key
     * @param {any} field
     * @returns {number}
     */
    hstrlen(key: any, field: any): number;
    /**
     * @param  {...string} patterns
     */
    psubscribe(...patterns: string[]): void;
    /**
     * @param {string} channel
     * @param {string} message
     * @returns {number}
     */
    publish(channel: string, message: string): number;
    /**
     * @throws {Error}
     * @param {string} subcmd
     * @param  {...any} args
     * @returns {number|string[]|(number|string)[]|Error}
     */
    pubsub(subcmd: string, ...args: any[]): number | string[] | (number | string)[] | Error;
    /**
     * @param  {...string} patterns
     */
    punsubscribe(...patterns: string[]): void;
    /**
     * @param  {...string} channels
     */
    subscribe(...channels: string[]): void;
    /**
     * @param  {...string} channels
     */
    unsubscribe(...channels: string[]): void;
    /**
     * @param {string} key
     * @param {number} index
     * @returns {string|null}
     */
    lindex(key: string, index: number): string | null;
    /**
     * @param {string} key
     * @returns {number}
     */
    llen(key: string): number;
    /**
     * @param {string} key
     * @param {number} [count]
     * @returns {string[]|null}
     */
    lpop(key: string, count?: number | undefined): string[] | null;
    lpos(key: any, element: any, ...args: any[]): any;
    /**
     * @param {string} key
     * @param {string[]} elements
     * @returns {number}
     */
    lpush(key: string, ...elements: string[]): number;
    /**
     * @param {string} key
     * @param {string[]} elements
     * @returns {number}
     */
    lpushx(key: string, ...elements: string[]): number;
    /**
     * @param {string} key
     * @param {number} start
     * @param {number} stop
     */
    lrange(key: string, start: number, stop: number): any;
    /**
     * @param {string} key
     * @param {number} count
     * @param {*} element
     */
    lrem(key: string, count: number, element: any): number;
    /**
     * @param {string} key
     * @param {number} index
     * @param {string} element
     * @returns {string}
     */
    lset(key: string, index: number, element: string): string;
    /**
     * @param {string} key
     * @param {number} start
     * @param {number} stop
     */
    ltrim(key: string, start: number, stop: number): string;
    /**
     * @param {string} key
     * @param {number} [count]
     * @returns {string[]|null}
     */
    rpop(key: string, count?: number | undefined): string[] | null;
    /**
     * @param {string} key
     * @param {string[]} elements
     * @returns {number}
     */
    rpush(key: string, ...elements: string[]): number;
    /**
     * @param {string} key
     * @param {string[]} elements
     * @returns {number}
     */
    rpushx(key: string, ...elements: string[]): number;
}
import { ResponseData } from "./Protocol.js";
