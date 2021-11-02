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
    /** @type {{ [cursor: string]: Iterator<[any, any]> }} */
    _cursor: {
        [cursor: string]: Iterator<[any, any], any, undefined>;
    };
    _isActive: boolean;
    _isAuth: boolean;
    _hasTransaction: boolean;
    /** @type {[cmd: string, args: any[]][] } */
    _transaction: [cmd: string, args: any[]][];
    /** @type { any[][] } */
    _queue: any[][];
    set isAuthenticated(arg: boolean);
    get isAuthenticated(): boolean;
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
