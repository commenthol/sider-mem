/// <reference types="node" />
export type Socket = import('node:net').Socket;
export class Client {
    /**
     * @param {Socket} socket
     */
    constructor(socket: Socket);
    socket: import("net").Socket;
    start: number;
    id: number;
    /** @type {null|string} */
    name: null | string;
    addr: string;
    laddr: string;
    user: string;
    db: number;
    /** @private @type {{ [cursor: string]: Iterator<[any, any]> }} */
    private _cursor;
    _isActive: boolean;
    _isAuth: boolean;
    _hasTransaction: boolean;
    /** @private @type {[cmd: string, args: any[]][] } */
    private _transaction;
    /** @private @type { any[][] } */
    private _queue;
    set isAuthenticated(arg: boolean);
    /**
     * @type {boolean}
     */
    get isAuthenticated(): boolean;
    /**
     * @type {boolean}
     */
    get hasTransaction(): boolean;
    startTransaction(): void;
    /**
     * @param {string} cmd
     * @param {any[]} args
     */
    pushTransaction(cmd: string, args: any[]): void;
    endTransaction(): [cmd: string, args: any[]][];
    /**
     * @param {number|string} cursor
     * @param {Iterator<[any, any]>} iterator
     * @param {boolean|undefined} done
     */
    setCursor(cursor: number | string, iterator: Iterator<[any, any]>, done: boolean | undefined): void;
    /**
     * @param {number|string} cursor
     * @returns {Iterator<[any, any]>}
     */
    getCursor(cursor: number | string): Iterator<[any, any]>;
    /**
     * @param {any[]} req
     * @returns {boolean}
     */
    queueRequest(req: any[]): boolean;
    /**
     * @returns {any[]|undefined}
     */
    nextRequest(): any[] | undefined;
    on(ev: any, fn: any): void;
    write(data: any): void;
    end(): void;
    list(): {
        id: number;
        addr: string;
        laddr: string;
        name: string | null;
        db: number;
        user: string;
        age: number;
    };
}
