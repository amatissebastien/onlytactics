export type ControlUpdate = {
  desiredHeadingDeg?: number
  spin?: 'full'
  clientSeq?: number
}

export interface Controller {
  start(): Promise<void>
  stop(): void
  updateLocalInput?(update: ControlUpdate): void
}

