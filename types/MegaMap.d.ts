export = Map;
declare class Map {
    get size(): any;
    keys(): Generator<any, any, unknown>;
    values(): Generator<any, any, unknown>;
    entries(): Generator<any[], any[], unknown>;
    [Symbol.iterator](): Generator<any[], any[], unknown>;
}
