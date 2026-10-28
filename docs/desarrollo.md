# Desarrollo

## Todo junto con Docker

```bash
cp .env.example .env              # opcional: Google, Gemini, etc.
DEV_LOGIN=true docker compose up --build
```

- Abre http://localhost:8080. Nginx sirve la web y reenvía `/api` al backend.
- `WEB_PORT=3000` cambia el puerto si el 8080 está ocupado.
- `DEV_LOGIN=true` habilita `POST /api/dev/login` y muestra "Entrar sin Google"
  en la pantalla de entrada. **Nunca** lo actives en producción.
- Los datos de Postgres quedan en el volumen `pgdata`. Para empezar de cero:
  `docker compose down -v`.

## Por separado (para programar)

Backend (necesita Java 21, Maven y un Postgres en `localhost:5432`):

```bash
cd backend
DEV_LOGIN=true mvn spring-boot:run      # API en http://localhost:8080
TESTCONTAINERS_RYUK_DISABLED=true mvn test   # tests (necesita Docker)
```

Web:

```bash
cd web
npm install
npm run dev      # http://localhost:5173, con proxy a la API en :8080
npm test         # vitest
npm run build    # typecheck + build de producción en web/dist
```

## Integración continua

Cada pull request corre en GitHub Actions (`.github/workflows/ci.yml`): tests
y build de la web, `mvn verify` del backend (con Testcontainers) y el build de
las imágenes Docker. Si algo falla, el PR lo muestra en rojo antes de fusionar.

## Estructura

```
backend/                     API Spring Boot
  src/main/java/app/in2u/
    user/                    usuario actual y perfil
    couple/                  /api/me, vincular pareja con código, días juntos
    mood/                    ánimo diario + stream en tiempo real (SSE)
    events/                  calendario compartido
    cycle/                   ciclo, fases y qué ve la pareja
    tips/                    consejos: Gemini + reglas (TipCatalog, RuleBasedTipper)
    album/                   fotos (bytea en Postgres)
    chat/                    mensajes (SSE)
    game/                    "¿Cuánto me conoces?"
    push/                    notificaciones Web Push (VAPID)
    common/                  manejo de errores de la API
    config/                  seguridad, OAuth, login de desarrollo
  src/main/resources/
    application.yml          configuración (lee las variables de entorno)
    db/migration/            migraciones Flyway (V1, V2, V3...)
web/                         Web React + Vite
  src/screens/               pantallas (Inicio, Calendario, Ciclo, Álbum, Chat, Juego, Consejos, Perfil...)
  src/i18n.ts                textos en español e inglés
  src/theme.ts               color y modo día/noche
  src/push.ts                suscripción a notificaciones push
  public/                    logo, íconos, emojis, sw.js y privacidad.html
  vercel.json                reenvío de /api y OAuth a Render
docs/                        documentación y capturas
.github/workflows/ci.yml     tests y builds en cada PR
docker-compose.yml           db + backend + web para correr en local
render.yaml                  blueprint del backend en Render
```

## API

Todas las rutas están bajo `/api` y requieren sesión (cookie), salvo el login.

| Ruta | Para qué |
|---|---|
| `GET /api/me`, `PUT /api/me/profile`, `PUT /api/me/timezone` | usuario, perfil y zona horaria |
| `POST /api/couple`, `POST /api/couple/join` | crear código / unirse |
| `/api/mood` (`today`, `week`, `stream`) | ánimo diario y tiempo real |
| `/api/events` | calendario |
| `/api/cycle` (`settings`, `periods`, `symptoms`, `partner`) | ciclo |
| `/api/tips` (`today`, `catalog`) | consejos |
| `/api/album` | fotos (`/{id}/image` devuelve la imagen) |
| `/api/chat` (`stream`) | chat |
| `/api/game` (`answers`) | juego |
| `/api/push` (`public-key`, `subscribe`, `unsubscribe`) | notificaciones push |
| `POST /api/dev/login` | solo con `DEV_LOGIN=true` |

`GET /actuator/health` es el chequeo de salud que usan Docker y Render.

## Variables de entorno

Solo nombres; los valores reales van en `.env` (local) o en el panel de Render.
Nunca los subas a GitHub.

| Variable | Uso |
|---|---|
| `DB_URL`, `DB_USER`, `DB_PASSWORD` | conexión a Postgres (`jdbc:postgresql://HOST/BASE?sslmode=require` en Neon) |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | login con Google |
| `OAUTH_REDIRECT_URI` | en producción, `https://in2u.vercel.app/login/oauth2/code/google` |
| `FRONTEND_URL` | adónde vuelve el navegador tras el login |
| `COOKIE_SECURE` | `true` con https (producción), `false` en local |
| `GEMINI_API_KEY` | consejos con IA (gratis en https://aistudio.google.com/apikey). Sin clave se usan reglas |
| `GEMINI_MODEL` | modelo de Gemini (por defecto `gemini-flash-latest`) |
| `GEMINI_SEND_NOTES` | `false` por defecto: a Gemini solo se envía el número del ánimo, no las notas |
| `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | claves para firmar las notificaciones push |
| `DEV_LOGIN` | login sin Google, solo local |
| `WEB_PORT` | puerto local de `docker compose` (8080 por defecto) |
