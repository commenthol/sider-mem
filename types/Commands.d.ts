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
     */
    unknownCommand(cmd: string, args: any[]): Error;
    /**
     * @param {string} cmd
     * @param {string} subcmd
     */
    unknownSubCommand(cmd: string, subcmd: string): Error;
    /**
     * @param {string} cmd
     * @param {any[]} args
     */
    assertCommand(cmd: string, args: any[]): void;
    /**
     * @param {string} cmd
     * @param {any} args
     */
    handleCommand(cmd: string, args: any): Promise<any>;
    /**
     * @param {any[]} section
     */
    info(...section: any[]): ResponseData;
    hello(): {
        server: string;
        version: string;
        proto: number;
        id: number;
        mode: string;
        role: string;
        modules: never[];
    };
    /**
     * @param {string} subcmd
     * @param {any[]} args
     * @return {string[]}
     */
    command(subcmd: string, ...args: any[]): string[];
    /**
     * @return {string[]}
     */
    time(): string[];
    shutdown(): Promise<any>;
    /**
     * @param {any[]} args
     * @returns {string|Error}
     */
    auth(...args: any[]): string | Error;
    /**
     * @param {number} db
     * @returns {string}
     */
    select(db: number): string;
    /**
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
     * @param {any} message
     * @returns {string}
     */
    ping(message: any): string;
    /**
     * @param {any} message
     * @returns {string}
     */
    echo(message: any): string;
    /**
     * @param {any[]} keys
     */
    exists(...keys: any[]): 1 | 0;
    /**
     * @param {any[]} keys
     */
    del(...keys: any[]): number;
    /**
     * @param {any} key
     */
    type(key: any): string;
    flushall(): string;
    flushdb(): string;
    /**
     * @param {number} cursor
     * @param {any[]} args
     */
    scan(cursor: number, ...args: any[]): Promise<(string | any[])[]>;
    hasTransaction(): boolean;
    /**
     * @param {string} cmd
     * @param {any} args
     */
    handleTransaction(cmd: string, args: any): Promise<Error | ResponseData> | "QUEUED";
    multi(): string;
    exec(): Promise<Error | ResponseData>;
    /**
     * @param {any} key
     * @param {string|number} seconds
     * @param {string} type
     */
    expire(key: any, seconds: string | number, type: string): 1 | 0;
    /**
     * @param {any} key
     * @param {any} timestamp
     * @param {any} type
     */
    expireat(key: any, timestamp: any, type: any): 1 | 0;
    /**
     * @param {any} key
     */
    expiretime(key: any): number;
    /**
     * @param {any} key
     */
    ttl(key: any): number;
    /**
     * @param {any} key
     * @param {number} ms
     * @param {any} type
     */
    pexpire(key: any, ms: number, type: any): 1 | 0;
    /**
     * @param {any} key
     * @param {number | undefined} timestampMs
     * @param {any} type
     */
    pexpireat(key: any, timestampMs: number | undefined, type: any): 1 | 0;
    /**
     * @param {any} key
     */
    pexpiretime(key: any): number;
    /**
     * @param {any} key
     */
    pttl(key: any): number;
    /**
     * @param {any} key
     */
    persist(key: any): 1 | 0;
    /**
     * @param {any} key
     * @param {string} value
     * @param {string | undefined} [type]
     * @param {undefined} [amount]
     */
    set(key: any, value: string, type?: string | undefined, amount?: undefined): "OK" | null;
    /**
     * @param {any} key
     * @param {any} seconds
     * @param {any} value
     */
    setex(key: any, seconds: any, value: any): "OK" | null;
    /**
     * @param {any} key
     * @param {any} ms
     * @param {any} value
     */
    psetex(key: any, ms: any, value: any): "OK" | null;
    /**
     * @param {any} key
     * @param {string} value
     */
    append(key: any, value: string): number;
    /**
     * @param {any} key
     * @param {number} offset
     * @param {string} value
     */
    setrange(key: any, offset: number, value: string): number;
    /**
     * @param {any[]} keyValues
     */
    mset(...keyValues: any[]): string;
    /**
     * @param {any[]} keyValues
     */
    msetnx(...keyValues: any[]): 1 | 0;
    /**
     * @param {any} key
     */
    get(key: any): any;
    /**
     * @param {any} key
     */
    getdel(key: any): any;
    /**
     * @param {any} key
     * @param {any} start
     * @param {any} end
     */
    getrange(key: any, start: any, end: any): string;
    /**
     * @param {any} key
     * @param {any} value
     */
    getset(key: any, value: any): any;
    /**
     * @param {any[]} keys
     */
    mget(...keys: any[]): any[];
    /**
     * @param {any} key
     */
    strlen(key: any): number;
    /**
     * @param {any} key
     */
    decr(key: any): number;
    /**
     * @param {any} key
     * @param {number} decrement
     */
    decrby(key: any, decrement: number): number;
    /**
     * @param {any} key
     */
    incr(key: any): number;
    /**
     * @param {any} key
     * @param {any} increment
     */
    incrby(key: any, increment: any): number;
    /**
     * @param {any} key
     * @param {number} increment
     */
    incrbyfloat(key: any, increment: number): number;
    /**
     * @param {any} key
     * @param {number[]} fieldVals
     */
    hset(key: any, ...fieldVals: number[]): number;
    /**
     * @param {any} key
     * @param {any} field
     * @param {any} value
     */
    hsetnx(key: any, field: any, value: any): number;
    /**
     * @param {any} key
     * @param {string | number} field
     */
    hget(key: any, field: string | number): any;
    /**
     * @param {any} key
     * @param {any[]} fields
     */
    hmget(key: any, ...fields: any[]): any;
    /**
     *
     * @param {any} key
     * @param {any[]} fieldVals
     */
    hmset(key: any, ...fieldVals: any[]): string;
    /**
     * @param {any} key
     */
    hgetall(key: any): any;
    /**
     * @param {any} key
     */
    hkeys(key: any): string[];
    /**
     * @param {any} key
     */
    hvals(key: any): any[];
    /**
     * @param {any} key
     * @param {number} cursor
     * @param {any[]} args
     */
    hscan(key: any, cursor: number, ...args: any[]): (string | string[])[];
    /**
     * @param {any} key
     */
    hlen(key: any): number;
    /**
     * @param {any} key
     * @param {any[]} fields
     */
    hdel(key: any, ...fields: any[]): number;
    /**
     * @param {any} key
     * @param {string} field
     */
    hexists(key: any, field: string): 1 | 0;
    /**
     * @param {any} key
     * @param {any} field
     * @param {number} increment
     */
    hincrby(key: any, field: any, increment: number): number;
    /**
     * @param {any} key
     * @param {any} field
     * @param {number} increment
     */
    hincrbyfloat(key: any, field: any, increment: number): number;
    /**
     * @param {any} key
     * @param {any} field
     */
    hstrlen(key: any, field: any): number;
    /**
     * @param  {...string} patterns
     * @returns {number}
     */
    psubscribe(...patterns: string[]): number;
    /**
     * @param {string} channel
     * @param {string} message
     * @returns {number}
     */
    publish(channel: string, message: string): number;
    pubsub(): void;
    /**
     * @param  {...string} patterns
     * @returns {number}
     */
    punsubscribe(...patterns: string[]): number;
    /**
     * @param  {...string} channels
     * @returns {number}
     */
    subscribe(...channels: string[]): number;
    /**
     * @param  {...string} channels
     * @returns {number}
     */
    unsubscribe(...channels: string[]): number;
}
import { ResponseData } from "./Protocol.js";
