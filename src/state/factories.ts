import { appEnv } from '@/config/env'
import { createId } from '@/utils/ids'
import { seedFromString } from '@/utils/rng'
import type { BoatState, RaceMeta, RaceState, Vec2 } from '@/types/race'

const defaultBoatColors = [0xf6bd60, 0xf28482, 0x84a59d, 0x4d908e, 0xf94144]

const defaultStartLine = {
  pin: { x: -70, y: 60 },
  committee: { x: 70, y: 50 },
}

const defaultLeewardGate = {
  left: { x: -40, y: 130 },
  right: { x: 40, y: 120 },
}

const structuredCopy = <T>(value: T): T => {
  if (typeof structuredClone === 'function') {
    return structuredClone(value)
  }
  return JSON.parse(JSON.stringify(value)) as T
}

export const createRaceMeta = (raceId: string, seed?: number): RaceMeta => ({
  raceId,
  courseName: 'Practice Course',
  createdAt: Date.now(),
  seed: seed ?? seedFromString(raceId),
})

const createBoatState = (name: string, index: number): BoatState => ({
  id: createId(`boat${index + 1}`),
  name,
  color: defaultBoatColors[index % defaultBoatColors.length],
  headingDeg: 0,
  desiredHeadingDeg: 0,
  penalties: 0,
  pos: { x: -20 + index * 30, y: 40 },
  speed: 0,
  stallTimer: 0,
})

export const createInitialRaceState = (raceId: string): RaceState => {
  const boats = ['Alpha', 'Bravo'].map((name, idx) => createBoatState(name, idx))
  const baselineWind = appEnv.baselineWindDeg
  const defaultMarks: Vec2[] = [
    { x: 0, y: -240 }, // windward mark
    defaultStartLine.committee,
    defaultStartLine.pin,
    defaultLeewardGate.left,
    defaultLeewardGate.right,
  ]
  return {
    t: -120,
    meta: createRaceMeta(raceId),
    wind: {
      directionDeg: baselineWind,
      speed: 12,
    },
    baselineWindDeg: baselineWind,
    marks: structuredCopy(defaultMarks),
    startLine: structuredCopy(defaultStartLine),
    leewardGate: structuredCopy(defaultLeewardGate),
    phase: 'prestart',
    boats: boats.reduce<RaceState['boats']>((acc, boat) => {
      acc[boat.id] = boat
      return acc
    }, {}),
  }
}

export const cloneRaceState = (state: RaceState): RaceState => structuredCopy(state)

