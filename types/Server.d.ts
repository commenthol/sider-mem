/// <reference types="node" />
export type Socket = import('node:net').Socket;
export class Server {
    /**
     * @param {{
     *  username?: string,
     *  password?: string,
     *  log?: function,
     *  gracefulTimeout?: number,
     *  maxBufferLength?: number,
     *  HashMap?: MapConstructor,
     *  nextHouseKeepingSec?: number,
     *  dbDir?: string
     * }} options
     */
    constructor(options: {
        username?: string | undefined;
        password?: string | undefined;
        log?: Function | undefined;
        gracefulTimeout?: number | undefined;
        maxBufferLength?: number | undefined;
        HashMap?: MapConstructor | undefined;
        nextHouseKeepingSec?: number | undefined;
        dbDir?: string | undefined;
    });
    _config: {
        version: string;
        name: string;
        mode: string;
        role: string;
    };
    _opts: {
        maxBufferLength: number | undefined;
        gracefulTimeout: number;
        port: undefined;
    };
    _cache: Cache;
    _pubsub: PubSub;
    _store: Persistence;
    _sockets: Set<any>;
    _isShutdown: boolean;
    _needsAuth: boolean;
    /**
     *
     * @param {{ username?: string, password?: string }} auth
     * @returns
     */
    _verifyAuth: (auth: {
        username?: string | undefined;
        password?: string | undefined;
    }) => boolean;
    /**
     * @private
     * @param {any[]} req
     * @param {Commands} commands
     * @param {Client} client
     * @returns {Promise<string>}
     */
    private _handleRequest;
    /**
     * @private
     * @param {Socket} socket
     * @returns
     */
    private _connect;
    /**
     * @param {{
     *  socket?: Socket,
     *  host?: string | undefined;
     *  port?: string;
     * }} options
     */
    listen(options: {
        socket?: net.Socket | undefined;
        host?: string | undefined;
        port?: string | undefined;
    }): Promise<any>;
    _server: net.Server | undefined;
    close(): Promise<any>;
}
import { Cache } from "./Cache.js";
import { PubSub } from "./PubSub.js";
import { Persistence } from "./Persistence.js";
import net = require("net");
/**
 * @typedef {import('node:net').Socket} Socket
 */
/**
 * @type {{
 *   error: (...args: any[]) => void,
 *   warn: (...args: any[]) => void,
 *   info: (...args: any[]) => void,
 *   debug: (...args: any[]) => void
 * }}
 */
declare let log: {
    error: (...args: any[]) => void;
    warn: (...args: any[]) => void;
    info: (...args: any[]) => void;
    debug: (...args: any[]) => void;
};
export {};
