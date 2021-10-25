/* eslint no-console:off */

const cluster = require('cluster')
const http = require('http')
const numCPUs = Math.min(4, require('os').cpus().length)
const process = require('process')
const { app } = require('./app.js')

// const { Server } = require('sider-mem')
const { Server } = require('../src')

const main = async () => {
  const { PORT: port = 6379, HOST: host, TTL: ttl = 300 } = process.env

  if (cluster.isMaster || cluster.isPrimary) {
    console.log('Primary %s is running; %s', process.pid, numCPUs)

    const server = new Server()
    await server.listen({ port, host })

    // Fork workers.
    for (let i = 0; i < numCPUs; i++) {
      cluster.fork()
    }

    cluster.on('exit', (worker, code, signal) => {
      console.log('worker %s died', worker.process.pid)
    })
  } else {
    // Workers can share any TCP connection
    http.createServer(app({ port, host, ttl })).listen(3000)

    console.log('Worker %s started', process.pid)
  }
}

main()
