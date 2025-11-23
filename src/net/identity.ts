import { createId } from '@/utils/ids'
import { readJson, writeJson } from '@/utils/storage'

const CLIENT_ID_KEY = 'sgame:clientId'
const BOAT_ID_KEY = 'sgame:boatId'

const ensureId = (key: string, fallbackGenerator: () => string) => {
  const existing = readJson<string | null>(key, null)
  if (existing) return existing
  const fresh = fallbackGenerator()
  writeJson(key, fresh)
  return fresh
}

const clientId = ensureId(CLIENT_ID_KEY, () => createId('client'))
const boatId = ensureId(BOAT_ID_KEY, () => createId('boat'))

export const identity = {
  clientId,
  boatId,
}

export const setBoatId = (nextBoatId: string) => {
  identity.boatId = nextBoatId
  writeJson(BOAT_ID_KEY, nextBoatId)
}

