const getLocalStorage = () =>
  typeof window === 'undefined' ? undefined : window.localStorage

export const readJson = <T>(key: string, fallback: T): T => {
  try {
    const ls = getLocalStorage()
    if (!ls) return fallback
    const raw = ls.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export const writeJson = (key: string, value: unknown) => {
  const ls = getLocalStorage()
  if (!ls) return
  ls.setItem(key, JSON.stringify(value))
}

export const removeKey = (key: string) => {
  const ls = getLocalStorage()
  if (!ls) return
  ls.removeItem(key)
}

