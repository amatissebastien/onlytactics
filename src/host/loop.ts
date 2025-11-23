import { appEnv } from '@/config/env'
import { stepRaceState } from '@/logic/physics'
import { RulesEngine } from '@/logic/rules'
import { cloneRaceState } from '@/state/factories'
import { raceStore, RaceStore } from '@/state/raceStore'
import type { RaceEvent, RaceState } from '@/types/race'

type HostLoopOptions = {
  onEvents?: (events: RaceEvent[]) => void
  onTick?: (state: RaceState, events: RaceEvent[]) => void
}

export class HostLoop {
  private timer?: number

  private lastTick = 0

  constructor(
    private store: RaceStore = raceStore,
    private rules = new RulesEngine(),
    private tickRate = appEnv.tickRateHz,
    private options: HostLoopOptions = {},
  ) {}

  start() {
    if (this.timer) return
    this.lastTick = performance.now()
    const intervalMs = 1000 / this.tickRate
    this.timer = window.setInterval(() => this.tick(), intervalMs)
  }

  stop() {
    if (!this.timer) return
    clearInterval(this.timer)
    this.timer = undefined
  }

  isRunning = () => Boolean(this.timer)

  private tick() {
    const now = performance.now()
    const dt = (now - this.lastTick) / 1000
    this.lastTick = now

    const next = cloneRaceState(this.store.getState())
    const inputs = this.store.consumeInputs()
    stepRaceState(next, inputs, dt)

    const resolutions = this.rules.evaluate(next)
    resolutions.forEach((violation) => {
      const offender = next.boats[violation.offenderId]
      if (offender) offender.penalties += 1
    })
    const events = this.rules.toEvents(next, resolutions)

    this.store.setState(next)
    this.store.appendEvents(events)
    this.options.onEvents?.(events)
    this.options.onTick?.(next, events)
  }
}

