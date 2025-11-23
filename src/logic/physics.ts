import type { BoatState, PlayerInput, RaceState } from '@/types/race'
import {
  ACCELERATION_RATE,
  DEFAULT_SHEET,
  DECELERATION_RATE,
  KNOTS_TO_MS,
  MAX_SPEED_KTS,
  MAX_DOWNWIND_ANGLE_DEG,
  NO_GO_ANGLE_DEG,
  STALL_DURATION_S,
  STALL_SPEED_FACTOR,
  TURN_RATE_DEG,
} from './constants'

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value))

export const degToRad = (deg: number) => (deg * Math.PI) / 180
export const radToDeg = (rad: number) => (rad * 180) / Math.PI

export const normalizeDeg = (deg: number) => {
  let d = deg % 360
  if (d < 0) d += 360
  return d
}

export const angleDiff = (targetDeg: number, currentDeg: number) => {
  let diff = (targetDeg - currentDeg + 540) % 360
  diff = diff < 0 ? diff + 360 : diff
  return diff > 180 ? diff - 360 : diff
}

export const headingFromAwa = (windDirDeg: number, awaDeg: number) =>
  normalizeDeg(windDirDeg + awaDeg)

const apparentWindAngle = (boatHeadingDeg: number, windDirDeg: number) =>
  angleDiff(boatHeadingDeg, windDirDeg)

const polarTargetSpeed = (awaDeg: number, windSpeed: number, sheet: number) => {
  const awa = Math.abs(awaDeg)
  const normalized = clamp((awa - 30) / 150, 0, 1)
  const efficiency = Math.cos(normalized * Math.PI)
  const sheetEffect = 0.5 + 0.5 * clamp(sheet, 0, 1)
  const target = windSpeed * efficiency * sheetEffect * 1.05
  return clamp(target, 0, MAX_SPEED_KTS)
}

const smoothSpeed = (current: number, target: number, dt: number) => {
  const rate = target > current ? ACCELERATION_RATE : DECELERATION_RATE
  const mix = clamp(rate * dt, 0, 1)
  return current + (target - current) * mix
}

const clampDesiredHeading = (
  boat: BoatState,
  desiredHeadingDeg: number,
  windDirDeg: number,
) => {
  const diff = angleDiff(desiredHeadingDeg, windDirDeg)
  const absDiff = Math.abs(diff)

  if (absDiff < NO_GO_ANGLE_DEG) {
    boat.stallTimer = STALL_DURATION_S
    const sign = diff >= 0 ? 1 : -1
    const clamped = headingFromAwa(windDirDeg, sign * NO_GO_ANGLE_DEG)
    boat.desiredHeadingDeg = clamped
    return clamped
  }

  if (absDiff > MAX_DOWNWIND_ANGLE_DEG) {
    const sign = diff >= 0 ? 1 : -1
    const clamped = headingFromAwa(windDirDeg, sign * MAX_DOWNWIND_ANGLE_DEG)
    boat.desiredHeadingDeg = clamped
    return clamped
  }

  boat.desiredHeadingDeg = normalizeDeg(desiredHeadingDeg)
  return boat.desiredHeadingDeg
}

const steerTowardsDesired = (boat: BoatState, dt: number) => {
  const error = angleDiff(boat.desiredHeadingDeg, boat.headingDeg)
  const maxTurn = TURN_RATE_DEG * dt
  const applied = clamp(error, -maxTurn, maxTurn)
  boat.headingDeg = normalizeDeg(boat.headingDeg + applied)
}

const applyStallDecay = (boat: BoatState, dt: number) => {
  if (boat.stallTimer <= 0) return
  boat.stallTimer = Math.max(0, boat.stallTimer - dt)
}

export type InputMap = Record<string, PlayerInput>

export const stepRaceState = (state: RaceState, inputs: InputMap, dt: number) => {
  state.t += dt
  if (state.phase === 'prestart' && state.t >= 0) {
    state.phase = 'running'
  }

  Object.values(state.boats).forEach((boat) => {
    const input = inputs[boat.id]
    const desiredHeading =
      input?.desiredHeadingDeg ?? boat.desiredHeadingDeg ?? boat.headingDeg
    clampDesiredHeading(boat, desiredHeading, state.wind.directionDeg)
    steerTowardsDesired(boat, dt)
    applyStallDecay(boat, dt)

    const awa = apparentWindAngle(boat.headingDeg, state.wind.directionDeg)
    let targetSpeed = polarTargetSpeed(awa, state.wind.speed, DEFAULT_SHEET)
    if (boat.stallTimer > 0) {
      targetSpeed *= STALL_SPEED_FACTOR
    }
    boat.speed = smoothSpeed(boat.speed, targetSpeed, dt)

    const courseRad = degToRad(boat.headingDeg)
    const speedMs = boat.speed * KNOTS_TO_MS
    boat.pos.x += Math.sin(courseRad) * speedMs * dt
    boat.pos.y -= Math.cos(courseRad) * speedMs * dt
  })
}

export const computeRelativeBearing = (
  headingDeg: number,
  otherHeadingDeg: number,
) => {
  return angleDiff(otherHeadingDeg, headingDeg)
}

export const degreesBetween = (a: number, b: number) =>
  Math.abs(radToDeg(Math.atan2(Math.sin(degToRad(a - b)), Math.cos(degToRad(a - b)))))

export const computeVmgAngles = (windSpeed: number) => {
  let bestUpAngle = NO_GO_ANGLE_DEG
  let bestUpValue = -Infinity
  let bestDownAngle = MAX_DOWNWIND_ANGLE_DEG
  let bestDownValue = -Infinity

  for (let angle = NO_GO_ANGLE_DEG; angle <= MAX_DOWNWIND_ANGLE_DEG; angle += 1) {
    const speed = polarTargetSpeed(angle, windSpeed, DEFAULT_SHEET)
    const rad = degToRad(angle)
    const upwindVmg = speed * Math.cos(rad)
    if (angle <= 90 && upwindVmg > bestUpValue) {
      bestUpValue = upwindVmg
      bestUpAngle = angle
    }
    const downwindVmg = speed * Math.cos(Math.PI - rad)
    if (angle >= 60 && downwindVmg > bestDownValue) {
      bestDownValue = downwindVmg
      bestDownAngle = angle
    }
  }

  return {
    upwindAwa: bestUpAngle,
    downwindAwa: bestDownAngle,
  }
}

export const apparentWindAngleSigned = apparentWindAngle

