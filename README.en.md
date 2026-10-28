<div align="center">

<img src="web/public/logo.svg" alt="in2u logo: two speech bubbles with a heart" width="110" />

# in2u

**More connection.** A web app for couples who want to communicate better.

[![CI](https://github.com/melware-labs/in2u/actions/workflows/ci.yml/badge.svg)](https://github.com/melware-labs/in2u/actions/workflows/ci.yml)
[![MIT License](https://img.shields.io/badge/license-MIT-AB2222.svg)](LICENSE)

[**Open the app →**](https://in2u.vercel.app) · [Español](README.md)

</div>

<p align="center">
  <img src="docs/capturas/inicio.webp" alt="Home" width="24%" />
  <img src="docs/capturas/chat.webp" alt="Chat" width="24%" />
  <img src="docs/capturas/ciclo.webp" alt="Cycle" width="24%" />
  <img src="docs/capturas/inicio-noche.webp" alt="Home in dark mode" width="24%" />
</p>

## Why

Many couples don't talk about how they feel until tiredness or stress has
already turned into an argument. **in2u** makes sharing it easy and everyday:
each partner checks in with their mood, the other sees it instantly and gets a
concrete tip on how to support them.

## Features

- **Daily mood check-in** with an optional note, shared in real time.
- **Mood-based advice** generated with Gemini, with an in-house rule engine as fallback.
- **Shared calendar** with private or shared events.
- **Menstrual cycle tracking** where the person logging it decides what their partner sees.
- **Private real-time chat**, **photo album** and a **"How well do you know me?"** game.
- **Web push notifications**, days-together counter, Spanish and English, light/dark/auto mode.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Vitest, Service Worker |
| Backend | Java 21, Spring Boot 4 (MVC, Security, OAuth2 Client, Data JPA), Spring Session JDBC |
| Data | PostgreSQL 16 with Flyway migrations |
| Integrations | Google OAuth 2.0, Google Gemini, Web Push (VAPID) |
| Quality | JUnit, Testcontainers, GitHub Actions |
| Infrastructure | Docker, Docker Compose, Vercel, Render, Neon |

## Engineering highlights

- **Single origin**: Vercel proxies `/api` and OAuth routes to the backend, so the
  session cookie is first-party and no CORS is needed.
- **Modular monolith**: one package per domain (`couple`, `mood`, `cycle`, `chat`…).
- **Real time without extra infrastructure**: Server-Sent Events for mood and chat.
- **Privacy by design**: only mood scores are sent to Gemini; cycle visibility is
  enforced on the server.
- **Resilient**: the app always has advice, even when the AI is unavailable.
- **Integration tests against real PostgreSQL** with Testcontainers.

See the [architecture notes](docs/arquitectura.md) (in Spanish) for diagrams.

## Run it locally

```bash
git clone https://github.com/melware-labs/in2u.git
cd in2u
DEV_LOGIN=true docker compose up --build
```

Open **http://localhost:8080** and sign in with any email (development login).

## Author

Designed and built by **Melany** at [Melware Labs](https://github.com/melware-labs).
Released under the [MIT License](LICENSE).
