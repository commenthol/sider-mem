export type Client = import('./Client.js').Client;
/** @typedef {import('./Client.js').Client} Client */
export class PubSub {
    channelClients: Map<any, any>;
    clientChannels: Map<any, any>;
    patternClients: Map<any, any>;
    clientPatterns: Map<any, any>;
    matchers: Map<any, any>;
    /**
     * @param {Client} client
     * @param {string[]} channels
     */
    subscribe(client: Client, channels: string[]): void;
    /**
     * @param {Client} client
     * @param {string[]} [channels]
     */
    unsubscribe(client: Client, channels?: string[] | undefined): void;
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
     * @param {Client} client
     * @param {string[]} patterns
     */
    pSubscribe(client: Client, patterns: string[]): void;
    /**
     * @param {Client} client
     * @param {string[]} [patterns]
     */
    pUnsubscribe(client: Client, patterns?: string[] | undefined): void;
    /**
     * @returns {number}
     */
    getNumpat(): number;
    /**
     * @param {string} channel
     * @param {string} message
     * @returns {number}
     */
    publish(channel: string, message: string): number;
}
