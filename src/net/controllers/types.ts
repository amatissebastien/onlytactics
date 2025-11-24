export type ControlUpdate = {
  desiredHeadingDeg?: number
  absoluteHeadingDeg?: number
  deltaHeadingDeg?: number
  spin?: 'full'
  clientSeq?: number
}

export interface Controller {
  start(): Promise<void>
  stop(): void
  updateLocalInput?(update: ControlUpdate): void
}

