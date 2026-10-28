# Publicación

in2u está publicada gratis con tres servicios:

| Servicio | Qué tiene | Nombre |
|---|---|---|
| [Neon](https://neon.tech) | base de datos Postgres | proyecto `in2u` |
| [Render](https://render.com) | backend (Docker, desde `render.yaml`) | `in2u-backend` → https://in2u-backend.onrender.com |
| [Vercel](https://vercel.com) | web (Root Directory `web`) | proyecto `in2u-app` → https://in2u.vercel.app |

Cada vez que se fusiona un cambio en `main`, Render y Vercel se vuelven a
publicar solos. El plan gratis de Render "duerme" el backend: la primera visita
después de un rato puede tardar un par de minutos, y la web muestra
"Despertando el servidor" mientras espera (hasta 3,5 minutos).

## Montarla desde cero

1. **Neon**: crea un proyecto y anota host, base, usuario y clave. Arma
   `DB_URL` así: `jdbc:postgresql://HOST/BASE?sslmode=require`.
2. **Render**: *New > Blueprint* con este repositorio. Lee `render.yaml` y pide
   los valores secretos: `DB_URL`, `DB_USER`, `DB_PASSWORD`, `GEMINI_API_KEY`,
   `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `OAUTH_REDIRECT_URI` y `FRONTEND_URL`.
   Para las notificaciones push agrega también `VAPID_PUBLIC_KEY`,
   `VAPID_PRIVATE_KEY` y `VAPID_SUBJECT`.
   `COOKIE_SECURE=true` y `DEV_LOGIN=false` ya vienen puestos.
3. **Vercel**: *Add New > Project*, elige el repositorio y pon **Root Directory** `web`.
   Si el backend tiene otra dirección, cámbiala en `web/vercel.json`.
4. **Google Cloud** (credenciales de OAuth, tipo *Aplicación web*):
   - URI de redireccionamiento autorizado: `https://in2u.vercel.app/login/oauth2/code/google`.
   - Pantalla de consentimiento publicada (**En producción**) para que cualquiera pueda entrar.
   - Enlace a la política de privacidad: `https://in2u.vercel.app/privacidad.html`.
5. En Render completa:
   - `OAUTH_REDIRECT_URI` = `https://in2u.vercel.app/login/oauth2/code/google`
   - `FRONTEND_URL` = `https://in2u.vercel.app`

## Si el login con Google falla

- Si vuelve a `/login?error`, revisa los logs del servicio en Render.
- `OAUTH_REDIRECT_URI` en Render y la URI en Google Cloud tienen que ser
  exactamente iguales.
- Si cambias la clave de Gemini o de Google, actualízala en Render
  (*Environment*); se reinicia solo.
