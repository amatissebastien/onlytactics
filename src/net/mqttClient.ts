import mqtt, { type IClientOptions, type MqttClient } from 'mqtt'
import { presenceTopic } from './topics'
import { identity } from './identity'
import { appEnv } from '@/config/env'

type Handler<T> = (payload: T) => void

const toBuffer = (value: unknown) => JSON.stringify(value)

const fromBuffer = <T>(raw: Uint8Array | string) => {
  try {
    const text =
      typeof raw === 'string' ? raw : new TextDecoder().decode(raw as Uint8Array)
    return JSON.parse(text) as T
  } catch (error) {
    console.error('Failed to parse MQTT payload', error)
    return undefined
  }
}

export class GameMqttClient {
  private client?: MqttClient

  private handlers = new Map<string, Set<(payload: unknown) => void>>()

  private connectionPromise?: Promise<void>

  connect() {
    if (this.client) return this.connectionPromise ?? Promise.resolve()

    const willPayload = {
      clientId: identity.clientId,
      status: 'offline' as const,
    }

    const options: IClientOptions = {
      clientId: identity.clientId,
      reconnectPeriod: 2000,
      keepalive: 30,
      clean: true,
      connectTimeout: 6000,
      protocolVersion: 4,
      will: {
        topic: presenceTopic(identity.clientId),
        payload: toBuffer(willPayload),
        retain: true,
        qos: 1,
      },
    }

    this.client = mqtt.connect(appEnv.mqttUrl, options)
    this.connectionPromise = new Promise((resolve, reject) => {
      this.client?.once('connect', () => {
        this.publish(presenceTopic(identity.clientId), {
          clientId: identity.clientId,
          status: 'online' as const,
        }, { retain: true })
        resolve()
      })
      this.client?.once('error', (err) => reject(err))
    })

    this.client.on('message', (topic, payload) => {
      const handlers = this.handlers.get(topic)
      if (!handlers?.size) return
      const parsed = fromBuffer(payload)
      if (parsed === undefined) return
      handlers.forEach((handler) => handler(parsed))
    })

    return this.connectionPromise
  }

  publish(topic: string, payload: unknown, options?: { retain?: boolean }) {
    if (!this.client) return
    this.client.publish(topic, toBuffer(payload), {
      qos: 1,
      retain: options?.retain ?? false,
    })
  }

  subscribe<T>(topic: string, handler: Handler<T>) {
    if (!this.client) throw new Error('MQTT client not connected')

    if (!this.handlers.has(topic)) {
      this.handlers.set(topic, new Set())
      this.client.subscribe(topic, { qos: 1 })
    }
    const set = this.handlers.get(topic)!
    const wrapped = (payload: unknown) => handler(payload as T)
    set.add(wrapped)
    return () => {
      const bucket = this.handlers.get(topic)
      if (!bucket) return
      bucket.delete(wrapped)
      if (bucket.size === 0) {
        this.client?.unsubscribe(topic)
        this.handlers.delete(topic)
      }
    }
  }

  disconnect() {
    this.publish(presenceTopic(identity.clientId), {
      clientId: identity.clientId,
      status: 'offline' as const,
    }, { retain: true })
    this.client?.end(true)
    this.handlers.clear()
    this.client = undefined
    this.connectionPromise = undefined
  }
}

export const mqttClient = new GameMqttClient()

