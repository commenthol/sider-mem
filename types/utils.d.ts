/// <reference types="node" />
export type CreatePromise = {
    promise: Promise<any>;
    resolve: Function;
    reject: Function;
};
/**
 * @param {[string, string[]]} param0
 * @param {boolean} [lowerRest=false]
 * @returns {string}
 */
export function capitalize([first, ...rest]: [string, string[]], lowerRest?: boolean | undefined): string;
/**
 * @typedef {object} CreatePromise
 * @property {Promise<any>} promise
 * @property {function} resolve
 * @property {function} reject
 */
/**
 * @returns {CreatePromise}
 */
export function createPromise(): CreatePromise;
/**
 * @param {any} v
 * @returns {boolean}
 */
export function isArray(v: any): boolean;
/**
 * @param {any} v
 * @returns {boolean}
 */
export function isFunction(v: any): boolean;
/**
 * @param {any} v
 * @returns {boolean}
 */
export function isInteger(v: any): boolean;
/**
 * @param {any} v
 * @returns {boolean}
 */
export function isNil(v: any): boolean;
/**
 * @param {any} v
 * @returns {boolean}
 */
export function isNumber(v: any): boolean;
/**
 * @param {any} v
 * @returns {boolean}
 */
export function isObject(v: any): boolean;
/**
 * @param {any} v
 * @returns {boolean}
 */
export function isString(v: any): boolean;
/**
 * @param {any} value
 * @returns {string}
 */
export function getType(value: any): string;
/**
 * @param {number|undefined} ms
 * @returns {Promise<void>}
 */
export const sleep: typeof import("timers/promises").setTimeout;
/**
 * @param {string|undefined} a
 * @param {string|undefined} b
 * @returns {boolean}
 */
export function timingSafeEqual(a: string | undefined, b: string | undefined): boolean;
/**
 * @param {number} size
 * @returns {string}
 */
export function toHumanMemSize(size: number): string;
/**
 * @param {any} v
 * @returns {number}
 */
export function toNumber(v: any): number;
/**
 * @param {string} pattern
 * @returns {function} (string) => boolean
 */
export function isMatch(pattern: string): Function;
/**
 * @returns {Promise<void>}
 */
export const nextTick: () => Promise<any>;
/**
 * milliseconds to seconds conversions; ignores negative values
 * @param {number} ms
 * @returns {number}
 */
export function msToSecs(ms: number): number;
