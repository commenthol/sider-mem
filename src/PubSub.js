/**
 * @copyright 2021 commenthol <commenthol@gmail.com>
 * @license MIT
 */

const {
  createArrayResp
} = require('./Protocol.js')
const {
  isMatch
} = require('./utils.js')

const UNSUB_EVENTS = ['close', 'error', 'timeout']

/** @typedef {import('./Client.js').Client} Client */

class PubSub {
  constructor () {
    this.channelClients = new Map() // channel -> Set(Clients)
    this.clientChannels = new Map() // client -> Set(Channel)
    this.patternClients = new Map() // pattern -> Set(Clients)
    this.clientPatterns = new Map() // client -> Set(Pattern)
    this.matchers = new Map() // pattern -> matcher
  }

  /**
   * @param {Client} client
   * @param {string[]} channels
   */
  subscribe (client, channels) {
    const clientChannels = this.clientChannels.get(client) || new Set()

    // do unsubscribe in case of connection loss
    if (!clientChannels.size) {
      UNSUB_EVENTS.forEach(ev => client.on(ev, () => {
        this.unsubscribe(client)
      }))
    }

    channels.forEach(channel => {
      const clients = this.channelClients.get(channel) || new Set()
      clients.add(client)
      this.channelClients.set(channel, clients)
      this.clientChannels.set(client, clientChannels.add(channel))
      client.write(createArrayResp(['subscribe', channel, clientChannels.size]))
    })
  }

  /**
   * @param {Client} client
   * @param {string[]} [channels]
   */
  unsubscribe (client, channels) {
    const clientChannels = this.clientChannels.get(client) || new Set()

    if (!channels || !channels.length) {
      // unsubscribe from all channels
      channels = Array.from(clientChannels)
    }

    channels.forEach(channel => {
      const clients = this.channelClients.get(channel)
      clientChannels.delete(channel)
      client.write(createArrayResp(['unsubscribe', channel, clientChannels.size]))
      if (clients) {
        clients.delete(client)
        if (clients.size) {
          this.channelClients.set(channel, clients)
        } else {
          this.channelClients.delete(channel)
        }
      }
    })
  }

  /**
   * @param {string[]} patterns
   * @returns {string[]}
   */
  getChannels (patterns) {
    const channels = Array.from(this.channelClients.keys())
    if (!patterns || !patterns.length) {
      return channels
    }
    const matchers = patterns.map(pattern => isMatch(pattern))
    return channels.filter(channel => matchers.some(matcher => matcher(channel)))
  }

  /**
   * @typedef {[channel: string, subscribers: number]} Subscriber
   */

  /**
   * @param {string[]} channels
   * @returns {Subscriber[]}
   */
  getSubscribers (channels) {
    return channels.map(channel => {
      const clients = this.channelClients.get(channel)
      return !clients ? [channel, 0] : [channel, clients.size]
    })
  }

  /**
   * @param {Client} client
   * @param {string[]} patterns
   */
  pSubscribe (client, patterns) {
    const clientPatterns = this.clientPatterns.get(client) || new Set()

    // do unsubscribe in case of connection loss
    if (!clientPatterns.size) {
      UNSUB_EVENTS.forEach(ev => client.on(ev, () => {
        this.pUnsubscribe(client)
      }))
    }

    patterns.forEach(pattern => {
      const clients = this.patternClients.get(pattern) || new Set()
      clients.add(client)
      this.patternClients.set(pattern, clients)
      this.clientPatterns.set(client, clientPatterns.add(pattern))
      this.matchers.set(pattern, isMatch(pattern))
      client.write(createArrayResp(['psubscribe', pattern, clientPatterns.size]))
    })
  }

  /**
   * @param {Client} client
   * @param {string[]} [patterns]
   */
  pUnsubscribe (client, patterns) {
    const clientPatterns = this.clientPatterns.get(client) || new Set()

    if (!patterns || !patterns.length) {
      // unsubscribe from all patterns
      patterns = Array.from(clientPatterns)
    }

    patterns.forEach(pattern => {
      const clients = this.patternClients.get(pattern)
      clientPatterns.delete(pattern)
      client.write(createArrayResp(['punsubscribe', pattern, clientPatterns.size]))
      if (clients) {
        clients.delete(client)
        if (clients.size) {
          this.patternClients.set(pattern, clients)
        } else {
          this.patternClients.delete(pattern)
          this.matchers.delete(pattern)
        }
      }
    })
  }

  /**
   * @returns {number}
   */
  getNumpat () {
    return this.patternClients.size
  }

  /**
   * @param {string} channel
   * @param {string} message
   * @returns {number}
   */
  publish (channel, message) {
    const clients = this.channelClients.get(channel)
    let cnt = 0
    if (clients && clients.size) {
      const msg = createArrayResp(['message', channel, message])
      clients.forEach(client => {
        client.write(msg)
        cnt++
      })
    }
    for (const [pattern, matcher] of this.matchers.entries()) {
      if (matcher(channel)) {
        const clients = this.patternClients.get(pattern)
        if (clients.size) {
          const msg = createArrayResp(['pmessage', pattern, channel, message])
          clients.forEach(client => {
            client.write(msg)
            cnt++
          })
        }
      }
    }

    return cnt
  }
}

module.exports = { PubSub }
