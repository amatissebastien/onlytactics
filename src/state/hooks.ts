import { useSyncExternalStore } from 'react'
import type { ChatMessage, RaceEvent, RaceState } from '@/types/race'
import { raceStore } from './raceStore'

export const useRaceState = (): RaceState =>
  useSyncExternalStore(raceStore.subscribe, raceStore.getState)

export const useRaceEvents = (): RaceEvent[] =>
  useSyncExternalStore(raceStore.subscribe, raceStore.getRecentEvents)

export const useChatLog = (): ChatMessage[] =>
  useSyncExternalStore(raceStore.subscribe, raceStore.getChatLog)

