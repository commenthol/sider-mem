export class Cache {
    /**
     * @param {{
     *  HashMap?: MapConstructor | undefined;
     *  nextHouseKeepingSec?: number | undefined;
     * }} options
     */
    constructor(options: {
        HashMap?: MapConstructor | undefined;
        nextHouseKeepingSec?: number | undefined;
    });
    map: Map<any, any>;
    expires: Map<any, any>;
    _nextHouseKeepingMs: number;
    _houseKeeping(): void;
    _loopExpired(): void;
    _expiresIterator: IterableIterator<[any, any]> | undefined;
    /**
     * @param {string} key
     * @param {any} value
     */
    set(key: string, value: any): void;
    /**
     * @param {string} key
     * @returns {boolean}
     */
    has(key: string): boolean;
    /**
     * @param {string} key
     * @param {string} expectedType
     * @returns {any}
     */
    get(key: string, expectedType: string): any;
    /**
     * @param {string} key
     * @returns {string|null}
     */
    getType(key: string): string | null;
    /**
     * @param {string} key
     * @returns {boolean}
     */
    delete(key: string): boolean;
    /**
     * @returns {number}
     */
    size(): number;
    clear(): void;
    /**
     * @returns {Iterator<any,any>}
     */
    iterator(): Iterator<any, any>;
    /**
     * @param {string} key
     * @returns {boolean}
     */
    hasExpiry(key: string): boolean;
    /**
     * @param {string} key
     * @returns {number}
     */
    getExpiry(key: string): number;
    /**
     * @param {string} key
     * @param {number} expiry
     */
    setExpiry(key: string, expiry: number): void;
    /**
     * @param {string} key
     * @returns {boolean}
     */
    deleteExpiry(key: string): boolean;
}
