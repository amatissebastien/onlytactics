# Sailing Simulator Frontend

This is the browser client for the sailing race rules trainer. It includes the PixiJS scene, MQTT networking, replay tooling, and a tiny development MQTT broker to keep everything self-contained.

## Getting started

```bash
cd frontend
npm install
cp env.example .env    # adjust values if needed
npm run dev            # starts Vite + a local MQTT broker
```

`npm run dev` now launches two processes:

- `vite` – the usual React/Pixi dev server
- `broker` – a lightweight MQTT broker (TCP 1883 + WS 9001) powered by `aedes`

The app's default `VITE_MQTT_URL` already points to `ws://localhost:9001`, so the development broker is used automatically.

### Skipping or customizing the broker

Set `DEV_BROKER_DISABLED=1 npm run dev` if you want to connect to a different broker while still using the dev server.

Environment overrides while running `npm run dev`:

| Variable | Default | Description |
| --- | --- | --- |
| `DEV_BROKER_TCP_PORT` | `1883` | TCP listener for native MQTT clients |
| `DEV_BROKER_WS_PORT` | `9001` | WebSocket endpoint used by the app |

You can also run the broker standalone with `npm run broker`.

## Tactician controls

The game now models Tacticat/SailX style helm commands. You set a desired heading and the physics engine steers toward it at a fixed turn rate.

Key bindings:

- `Space` – Sail by telltales (auto-set best VMG heading on current tack)
- `Enter` – Tack or gybe to the opposite close-hauled / downwind angle; the helm locks until the turn completes
- `↑` – Head up 5° (clamped to the no-go zone; forcing it triggers a stall)
- `↓` – Bear away 5° (clamped to ~140° off the wind; no dead-downwind sailing)

There are no sheet/trim controls in v1—boat speed comes entirely from angle-to-wind and the polar model.

## Other scripts

- `npm run build` – type-check and build for production
- `npm run lint` – ESLint
- `npm run format` – Prettier
- `npm run preview` – preview the production build locally
