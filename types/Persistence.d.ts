/// <reference types="node" />
export type Cache = import('./Cache.js').Cache;
/**
 * implements a append only filestore (AOF)
 */
export class Persistence {
    /**
     * @param {{ filename: string|undefined, cache: Cache }} param0
     */
    constructor({ filename, cache }: {
        filename: string | undefined;
        cache: Cache;
    });
    _filename: string | undefined;
    _cache: import("./Cache.js").Cache;
    _fsStream: fs.WriteStream | null;
    /**
     * @param {string} cmd
     * @param  {...any} args
     */
    write(cmd: string, ...args: any[]): void;
    load(): Promise<void>;
}
import fs = require("fs");
