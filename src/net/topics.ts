import { appEnv } from '@/config/env'

const base = `sgame/${appEnv.raceId}`

export const hostTopic = `${base}/host`
export const stateTopic = `${base}/state`
export const eventsTopic = `${base}/events`
export const chatTopic = `${base}/chat`

export const presenceTopic = (clientId: string) => `${base}/presence/${clientId}`
export const inputsTopic = (boatId: string) => `${base}/inputs/${boatId}`
export const inputsWildcard = `${base}/inputs/+`
export const presenceWildcard = `${base}/presence/+`

