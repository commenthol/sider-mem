const {
  createArrayResp
} = require('./Protocol.js')
const {
  isMatch
} = require('./utils.js')

/** @typedef {import('./Client.js').Client} Client */

class PubSub {
  constructor () {
    this.channels = new Map()
    this.clients = new Map()
  }

  /**
   * @param {Client} client
   * @param {string[]} channels
   * @returns {number}
   */
  subscribe (client, channels) {
    let cnt = 0
    const clientChannels = this.clients.get(client) || new Set()
    channels.forEach(channel => {
      const clients = this.channels.get(channel) || new Set()
      if (clients.size !== clients.add(client).size) {
        cnt++
      }
      this.channels.set(channel, clients)
      this.clients.set(client, clientChannels.add(channel))
    })
    return cnt
  }

  /**
   * @param {Client} client
   * @param {string[]} channels
   * @returns {number}
   */
  unsubscribe (client, channels) {
    let cnt = 0
    const clientChannels = this.clients.get(client) || new Set()

    if (!channels || !channels.length) {
      // unsubscribe from all channels
      channels = Array.from(clientChannels)
    }

    channels.forEach(channel => {
      const clients = this.channels.get(channel)
      clientChannels.delete(channel)
      if (clients) {
        if (clients.delete(client)) {
          cnt++
        }
        if (clients.size) {
          this.channels.set(channel, clients)
        } else {
          this.channels.delete(channel)
        }
      }
    })
    return cnt
  }

  /**
   * @param {Client} client
   * @param {string[]} patterns
   * @returns {number}
   */
  pSubscribe (client, patterns) {
    const channels = this.getChannels(patterns)
    return this.subscribe(client, channels)
  }

  /**
   * @param {Client} client
   * @param {string[]} patterns
   * @returns {number}
   */
  pUnsubscribe (client, patterns) {
    const channels = this.getChannels(patterns)
    return this.unsubscribe(client, channels)
  }

  /**
   * @param {string[]} patterns
   * @returns {string[]}
   */
  getChannels (patterns) {
    const channels = Array.from(this.channels.keys())
    if (!patterns) {
      return channels
    }
    const matchers = patterns.map(pattern => isMatch(pattern))
    return channels.filter(channel => matchers.some(channel))
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
      const clients = this.channels.get(channel)
      return !clients ? [channel, 0] : [channel, clients.size]
    })
  }

  /**
   * @param {string} channel
   * @param {string} message
   * @returns {number}
   */
  publish (channel, message) {
    const clients = this.channels.get(channel)
    let cnt = 0
    if (!clients || !clients.size) {
      return cnt
    }
    const msg = createArrayResp(['message', channel, message])
    clients.forEach(client => {
      client.socket.write(msg)
      cnt++
    })
    return cnt
  }
}

module.exports = { PubSub }
