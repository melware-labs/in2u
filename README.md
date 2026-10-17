# in2u

App mÃ³vil (iOS + Android, Expo/React Native) para parejas: calendario compartido
sincronizado con Google Calendar y check-in diario de Ã¡nimo que le llega a tu
pareja en tiempo real.

El plan completo de arquitectura y fases estÃ¡ en `tasks/todo.md`.

## Stack

- **App**: Expo (React Native) + TypeScript + expo-router
- **Backend**: [Supabase](https://supabase.com) (Postgres + Auth + Realtime + Edge Functions)
- **Login**: Google OAuth (vÃ­a Supabase Auth) â tambiÃ©n da acceso a Google Calendar
- **Notificaciones**: Expo Notifications (push)

## Setup â cuentas que hay que crear una sola vez

Esto lo tienes que hacer tÃº manualmente (login y creaciÃ³n de cuentas/proyectos
en servicios de terceros no se puede automatizar). Una vez hecho, es un paso
Ãºnico por entorno.

### 1. Crear el proyecto de Supabase

1. Entra a [supabase.com](https://supabase.com) y crea un proyecto nuevo (el
   plan free alcanza de sobra para esto).
2. En **Project Settings â API**, copiÃ¡ el `Project URL` y la `anon public key`.
3. CopiÃ¡ `.env.example` a `.env` y pegÃ¡ esos dos valores.
4. En el **SQL Editor** de Supabase, corrÃ© el contenido de
   `supabase/migrations/0001_profiles_and_couples.sql` (y las que se vayan
   agregando en fases siguientes, en orden).

### 2. Habilitar login con Google

1. En [Google Cloud Console](https://console.cloud.google.com/), crea un
   proyecto (o reusÃ¡ uno) y andÃ¡ a **APIs & Services â Credentials**.
2. CreÃ¡ un **OAuth client ID** de tipo **Web application**.
3. En **Authorized redirect URIs** agregÃ¡ la URL de callback que te muestra
   Supabase en **Authentication â Providers â Google** (algo como
   `https://<tu-proyecto>.supabase.co/auth/v1/callback`).
4. CopiÃ¡ el **Client ID** y **Client Secret** que te da Google y pÃ©galos en
   **Authentication â Providers â Google** dentro de Supabase. ActivÃ¡ el
   provider.
5. En **Authentication â URL Configuration** de Supabase, agregÃ¡ `in2u://` a
   la lista de **Redirect URLs** (es el esquema custom de la app, definido en
   `app.json`).
6. Si vas a usar la API de Google Calendar (Fase C), en Google Cloud ademÃ¡s
   activÃ¡ la **Google Calendar API** en **APIs & Services â Library**.

El Client ID/Secret de Google viven Ãºnicamente en el panel de Supabase â la
app nunca los necesita directamente.

## Correr el proyecto

```bash
npm install
npm run web       # navegador, para iterar rÃ¡pido en layout/textos
npx expo start     # QR para abrir en Expo Go (celular real) â necesario para probar el login con Google
```

## Estructura

```
src/
  app/                     # rutas (expo-router)
    (auth)/login.tsx        # login con Google
    onboarding.tsx          # crear/unirse a una pareja con cÃ³digo
    (tabs)/                 # Nosotros (mood), Calendario, Perfil
  contexts/auth-context.tsx # sesiÃ³n + pareja vinculada
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
pairing, B: Ã¡nimo en tiempo real, C: calendario + Google Calendar, D: Outlook,
E: demo web para el portfolio).

## Backend web (Spring Boot + Docker) â en construcciÃ³n

La app pasa a ser una web responsive. El backend vive en `backend/`.

```bash
cp .env.example .env        # opcional: Google, Gemini
docker compose up --build   # web + API en http://localhost:8080 (WEB_PORT cambia el puerto)
```

- Probar sin Google: `DEV_LOGIN=true` habilita `POST /api/dev/login` (solo local).
- Consejos con IA gratis: ponÃ© `GEMINI_API_KEY` (https://aistudio.google.com/apikey). Sin key, se usan reglas segÃºn el Ã¡nimo.
- Tests: `cd backend && TESTCONTAINERS_RYUK_DISABLED=true mvn test` (necesita Docker).

### Frontend web (`web/`)

```bash
cd web && npm install
npm run dev     # http://localhost:5173 (proxy a la API en :8080)
npm test        # vitest
npm run build   # typecheck + build de producciÃ³n en web/dist
```

Con el backend corriendo con `DEV_LOGIN=true`, la pantalla de login en desarrollo permite entrar con cualquier email (Ãºtil para probar con dos "personas" en dos navegadores).

### Deploy (Vercel + backend con Docker)

1. Backend en un host con Docker (Render, Fly, Railway...) con `COOKIE_SECURE=true`, `FRONTEND_URL=https://<tu-app>.vercel.app`, `GOOGLE_CLIENT_ID/SECRET`, `GEMINI_API_KEY` y una base Postgres.
2. En `web/vercel.json` reemplazÃ¡ `https://TU-BACKEND.example.com` por la URL del backend.
3. Vercel: importar el repo con *Root Directory* `web`.
4. En Google Cloud agregÃ¡ el redirect `https://<tu-app>.vercel.app/login/oauth2/code/google`.

Atajo en Render: *New > Blueprint* con este repo lee `render.yaml` y pide solo los valores secretos.
`DB_URL` en formato JDBC: `jdbc:postgresql://HOST/BASE?sslmode=require` (host, base, usuario y clave salen de Neon).
