export = Map;
declare class Map {
    h: any;
    get size(): any;
    /**
     * @param {any} key
     * @param {any} value
     */
    set(key: any, value: any): void;
    /**
     * @param {any} key
     */
    get(key: any): any;
    /**
     * @param {any} key
     */
    has(key: any): any;
    /**
     * @param {any} key
     */
    delete(key: any): boolean;
    clear(): void;
    keys(): any;
    values(): any;
    entries(): any;
    [Symbol.iterator](): any;
}
