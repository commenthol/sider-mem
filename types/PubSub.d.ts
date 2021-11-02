export type Client = import('./Client.js').Client;
/** @typedef {import('./Client.js').Client} Client */
export class PubSub {
    channels: Map<any, any>;
    clients: Map<any, any>;
    /**
     * @param {Client} client
     * @param {string[]} channels
     * @returns {number}
     */
    subscribe(client: Client, channels: string[]): number;
    /**
     * @param {Client} client
     * @param {string[]} channels
     * @returns {number}
     */
    unsubscribe(client: Client, channels: string[]): number;
    /**
     * @param {Client} client
     * @param {string[]} patterns
     * @returns {number}
     */
    pSubscribe(client: Client, patterns: string[]): number;
    /**
     * @param {Client} client
     * @param {string[]} patterns
     * @returns {number}
     */
    pUnsubscribe(client: Client, patterns: string[]): number;
    /**
     * @param {string[]} patterns
     * @returns {string[]}
     */
    getChannels(patterns: string[]): string[];
    /**
     * @typedef {[channel: string, subscribers: number]} Subscriber
     */
    /**
     * @param {string[]} channels
     * @returns {Subscriber[]}
     */
    getSubscribers(channels: string[]): [channel: string, subscribers: number][];
    /**
     * @param {string} channel
     * @param {string} message
     * @returns {number}
     */
    publish(channel: string, message: string): number;
}
