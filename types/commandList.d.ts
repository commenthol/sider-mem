/**
 * @module commandList
 * @copyright 2015 NodeRedis
 * @credits redis-commands/commands.json
 * @license MIT
 */
/**
 * @type {{ [cmd: string]: [arity:number, flags:string[], first:number, last:number, step:number, refs: string[]] }}
 */
export const commandList: {
    [cmd: string]: [arity: number, flags: string[], first: number, last: number, step: number, refs: string[]];
};
