import { stepRaceState } from '@/logic/physics'
import { RulesEngine } from '@/logic/rules'
import { cloneRaceState } from '@/state/factories'
import { raceStore, RaceStore } from '@/state/raceStore'
import type { RaceEvent, RaceState } from '@/types/race'
import { createSeededRandom } from '@/utils/rng'
import { appEnv } from '@/config/env'

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
  ) {
    this.windRandom = createSeededRandom(this.store.getState().meta.seed)
  }

  private windTimer = 0

  private windRandom

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
    this.applyWindOscillation(next, dt)

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

  private applyWindOscillation(state: RaceState, dt: number) {
    if (appEnv.fixedWind) {
      state.wind.directionDeg = state.baselineWindDeg
      return
    }

    this.windTimer += dt
    if (this.windTimer < 1) return
    this.windTimer = 0

    const shiftDeg = (this.windRandom() - 0.5) * 2 // -1 to 1
    const speedShift = (this.windRandom() - 0.5) * 0.3
    state.wind.directionDeg = state.baselineWindDeg + shiftDeg * 10
    state.wind.speed = Math.max(4, Math.min(18, state.wind.speed + speedShift))
  }
}

