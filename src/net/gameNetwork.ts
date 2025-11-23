import { appEnv } from '@/config/env'
import type { RaceRole } from '@/types/race'
import { normalizeDeg } from '@/logic/physics'
import { HostController } from './controllers/hostController'
import { PlayerController } from './controllers/playerController'
import { SpectatorController } from './controllers/spectatorController'
import type { Controller } from './controllers/types'

export class GameNetwork {
  private controller?: Controller

  private playerController?: PlayerController

  private latestHeadingDeg = 0

  private currentRole: RaceRole = appEnv.clientRole

  private roleListeners = new Set<(role: RaceRole) => void>()

  async start() {
    await this.setRole(appEnv.clientRole)
  }

  stop() {
    this.controller?.stop()
  }

  getRole() {
    return this.currentRole
  }

  onRoleChange(listener: (role: RaceRole) => void) {
    this.roleListeners.add(listener)
    return () => this.roleListeners.delete(listener)
  }

  updateDesiredHeading(headingDeg: number) {
    this.latestHeadingDeg = normalizeDeg(headingDeg)
    this.controller?.updateLocalInput?.({ desiredHeadingDeg: this.latestHeadingDeg })
  }

  private async setRole(role: RaceRole) {
    this.controller?.stop()
    if (role === 'host') {
      this.controller = new HostController()
      this.playerController = undefined
    } else if (role === 'player') {
      this.playerController = new PlayerController(() => this.promoteToHost())
      this.controller = this.playerController
    } else {
      this.controller = new SpectatorController()
      this.playerController = undefined
    }
    await this.controller.start()
    this.controller.updateLocalInput?.({ desiredHeadingDeg: this.latestHeadingDeg })
    this.setCurrentRole(role)
  }

  private async promoteToHost() {
    await this.setRole('host')
  }

  private setCurrentRole(role: RaceRole) {
    this.currentRole = role
    this.roleListeners.forEach((listener) => listener(role))
  }
}

