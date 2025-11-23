import type { PlayerInput } from '@/types/race'

export type ControlUpdate = Pick<PlayerInput, 'desiredHeadingDeg'>

export interface Controller {
  start(): Promise<void>
  stop(): void
  updateLocalInput?(update: ControlUpdate): void
}

