export const NIL: string;
export function createSimpleStringResp(str: any): string;
export function createErrorResp(err: any): string;
export function createIntegerResp(num: any): string;
export function createBulkStringResp(args: any): string;
export function createArrayResp(args: any): string;
export function createObjectResp(obj: any): string;
export function createSimpleArrayResp(args: any): string;
export class ResponseData {
    constructor(data: any, fn: any);
    data: any;
    fn: any;
    toString(): any;
}
export function writeResponse(data: any): any;
export class RequestParser extends EventEmitter {
    constructor(options: any);
    options: any;
    buffer: any;
    offset: number;
    parse(buffer: any): void;
}
export namespace RequestParser {
    export { DEFAULT_OPTIONS };
}
import EventEmitter = require("events");
declare namespace DEFAULT_OPTIONS {
    let maxBufferLength: number;
}
export {};
