import aedes from 'aedes'
import { createServer as createTcpServer } from 'node:net'
import { createServer as createHttpServer } from 'node:http'
import websocketStream from 'websocket-stream'

const MQTT_PORT = Number(process.env.DEV_BROKER_TCP_PORT ?? 1883)
const WS_PORT = Number(process.env.DEV_BROKER_WS_PORT ?? 9001)

const shouldDisable = String(process.env.DEV_BROKER_DISABLED ?? '').toLowerCase()
if (shouldDisable === '1' || shouldDisable === 'true') {
  console.log('[broker] DEV_BROKER_DISABLED set; skipping local broker startup.')
  process.exit(0)
}

const broker = aedes({
  id: 'sgame-dev-broker',
})

const tcpServer = createTcpServer(broker.handle)
tcpServer.listen(MQTT_PORT, () => {
  console.log(`[broker] MQTT TCP listening on mqtt://localhost:${MQTT_PORT}`)
})

const httpServer = createHttpServer()
websocketStream.createServer({ server: httpServer }, broker.handle)
httpServer.listen(WS_PORT, () => {
  console.log(`[broker] MQTT WS listening on ws://localhost:${WS_PORT}`)
})

broker.on('client', (client) => {
  console.log(`[broker] client connected ${client?.id ?? 'unknown'}`)
})

broker.on('clientDisconnect', (client) => {
  console.log(`[broker] client disconnected ${client?.id ?? 'unknown'}`)
})

const shutdown = (signal) => {
  console.log(`[broker] shutting down (${signal})`)
  httpServer.close(() => {
    tcpServer.close(() => {
      broker.close(() => {
        process.exit(0)
      })
    })
  })
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))

