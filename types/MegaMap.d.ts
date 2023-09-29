export = Map;
declare const Map_base: any;
declare class Map extends Map_base {
    [x: string]: any;
    get size(): any;
    keys(): Generator<any, any, unknown>;
    values(): Generator<any, any, unknown>;
    entries(): Generator<any[], any[], unknown>;
    [Symbol.iterator](): Generator<any[], any[], unknown>;
}
