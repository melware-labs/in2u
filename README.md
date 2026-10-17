# in2u

App móvil (iOS + Android, Expo/React Native) para parejas: calendario compartido
sincronizado con Google Calendar y check-in diario de ánimo que le llega a tu
pareja en tiempo real.

El plan completo de arquitectura y fases está en `tasks/todo.md`.

## Stack

- **App**: Expo (React Native) + TypeScript + expo-router
- **Backend**: [Supabase](https://supabase.com) (Postgres + Auth + Realtime + Edge Functions)
- **Login**: Google OAuth (vía Supabase Auth) — también da acceso a Google Calendar
- **Notificaciones**: Expo Notifications (push)

## Setup — cuentas que hay que crear una sola vez

Esto lo tenés que hacer vos manualmente (login y creación de cuentas/proyectos
en servicios de terceros no se puede automatizar). Una vez hecho, es un paso
único por entorno.

### 1. Crear el proyecto de Supabase

1. Entrá a [supabase.com](https://supabase.com) y creá un proyecto nuevo (el
   plan free alcanza de sobra para esto).
2. En **Project Settings → API**, copiá el `Project URL` y la `anon public key`.
3. Copiá `.env.example` a `.env` y pegá esos dos valores.
4. En el **SQL Editor** de Supabase, corré el contenido de
   `supabase/migrations/0001_profiles_and_couples.sql` (y las que se vayan
   agregando en fases siguientes, en orden).

### 2. Habilitar login con Google

1. En [Google Cloud Console](https://console.cloud.google.com/), creá un
   proyecto (o reusá uno) y andá a **APIs & Services → Credentials**.
2. Creá un **OAuth client ID** de tipo **Web application**.
3. En **Authorized redirect URIs** agregá la URL de callback que te muestra
   Supabase en **Authentication → Providers → Google** (algo como
   `https://<tu-proyecto>.supabase.co/auth/v1/callback`).
4. Copiá el **Client ID** y **Client Secret** que te da Google y pegalos en
   **Authentication → Providers → Google** dentro de Supabase. Activá el
   provider.
5. En **Authentication → URL Configuration** de Supabase, agregá `in2u://` a
   la lista de **Redirect URLs** (es el esquema custom de la app, definido en
   `app.json`).
6. Si vas a usar la API de Google Calendar (Fase C), en Google Cloud además
   activá la **Google Calendar API** en **APIs & Services → Library**.

El Client ID/Secret de Google viven únicamente en el panel de Supabase — la
app nunca los necesita directamente.

## Correr el proyecto

```bash
npm install
npm run web       # navegador, para iterar rápido en layout/textos
npx expo start     # QR para abrir en Expo Go (celular real) — necesario para probar el login con Google
```

## Estructura

```
src/
  app/                     # rutas (expo-router)
    (auth)/login.tsx        # login con Google
    onboarding.tsx          # crear/unirse a una pareja con código
    (tabs)/                 # Nosotros (mood), Calendario, Perfil
  contexts/auth-context.tsx # sesión + pareja vinculada
  lib/
    supabase.ts             # cliente Supabase
    google-auth.ts          # flujo de login con Google
    couples.ts               # crear / unirse a pareja
  components/                # UI reusable (ThemedText, ThemedView, tabs)
supabase/
  migrations/                # SQL versionado, una fase por archivo
```

## Fases del proyecto

Ver `tasks/todo.md` para el detalle y el estado de cada fase (A: login +
pairing, B: ánimo en tiempo real, C: calendario + Google Calendar, D: Outlook,
E: demo web para el portfolio).

## Backend web (Spring Boot + Docker) — en construcción

La app pasa a ser una web responsive. El backend vive en `backend/`.

```bash
cp .env.example .env        # opcional: Google, Gemini
docker compose up --build   # web + API en http://localhost:8080 (WEB_PORT cambia el puerto)
```

- Probar sin Google: `DEV_LOGIN=true` habilita `POST /api/dev/login` (solo local).
- Consejos con IA gratis: poné `GEMINI_API_KEY` (https://aistudio.google.com/apikey). Sin key, se usan reglas según el ánimo.
- Tests: `cd backend && TESTCONTAINERS_RYUK_DISABLED=true mvn test` (necesita Docker).

### Frontend web (`web/`)

```bash
cd web && npm install
npm run dev     # http://localhost:5173 (proxy a la API en :8080)
npm test        # vitest
npm run build   # typecheck + build de producción en web/dist
```

Con el backend corriendo con `DEV_LOGIN=true`, la pantalla de login en desarrollo permite entrar con cualquier email (útil para probar con dos "personas" en dos navegadores).

### Deploy (Vercel + backend con Docker)

1. Backend en un host con Docker (Render, Fly, Railway...) con `COOKIE_SECURE=true`, `FRONTEND_URL=https://<tu-app>.vercel.app`, `GOOGLE_CLIENT_ID/SECRET`, `GEMINI_API_KEY` y una base Postgres.
2. En `web/vercel.json` reemplazá `https://TU-BACKEND.example.com` por la URL del backend.
3. Vercel: importar el repo con *Root Directory* `web`.
4. En Google Cloud agregá el redirect `https://<tu-app>.vercel.app/login/oauth2/code/google`.

Atajo en Render: *New > Blueprint* con este repo lee `render.yaml` y pide solo los valores secretos.
`DB_URL` en formato JDBC: `jdbc:postgresql://HOST/BASE?sslmode=require` (host, base, usuario y clave salen de Neon).
