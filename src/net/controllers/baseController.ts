import { GameMqttClient, mqttClient } from '@/net/mqttClient'
import type { Controller } from './types'

export abstract class BaseController implements Controller {
  protected disposers: Array<() => void> = []

  constructor(protected mqtt: GameMqttClient = mqttClient) {}

  async start() {
    await this.mqtt.connect()
    await this.onStart()
  }

  stop() {
    this.disposers.forEach((dispose) => dispose())
    this.disposers = []
    this.onStop()
  }

  protected abstract onStart(): Promise<void> | void

  protected onStop() {}

  protected track(disposer: () => void) {
    this.disposers.push(disposer)
  }
}

