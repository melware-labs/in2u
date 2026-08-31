# in2u — plan y progreso

Plan completo original: `C:\Users\UMA\.claude\plans\agile-plotting-ritchie.md`

## Fase A — Base (login + pairing)

- [x] Scaffold Expo + TypeScript (`create-expo-app`)
- [x] Repo git propio en `in2u/` (independiente del repo que resultó estar en `C:\Users\UMA`)
- [x] Cliente Supabase (`src/lib/supabase.ts`)
- [x] Login con Google delegado a Supabase Auth (`src/lib/google-auth.ts`)
- [x] Migración SQL: `profiles`, `couples`, RLS, función `join_couple` (`supabase/migrations/0001_profiles_and_couples.sql`)
- [x] Pantalla de login (`src/app/(auth)/login.tsx`)
- [x] Pantalla de pairing: crear código / unirse con código (`src/app/onboarding.tsx`)
- [x] Enrutado protegido por estado de auth (`Stack.Protected` en `src/app/_layout.tsx`)
- [x] Shell de tabs: Nosotros / Calendario / Perfil (stubs)
- [x] Verificado visualmente en preview web (`npm run web`), modo claro y oscuro, viewport de celular — pantalla de login OK
- [ ] **Pendiente de Melany**: crear el proyecto de Supabase + habilitar Google como provider (pasos en `README.md`) y correr la migración `0001`
- [ ] Probar el flujo completo (login → pairing) en Expo Go con dos cuentas de Google reales — esto no se pudo verificar todavía porque requiere las credenciales reales de arriba

### Bugs encontrados y corregidos durante la Fase A

- El cliente de Supabase rompía bajo SSR (`expo start --web` / `expo export --platform web` rendereiza en Node, sin `window`); `AsyncStorage` asumía `window.localStorage`. Fix: `src/lib/supabase.ts` ahora detecta `typeof window === 'undefined'` y deja el storage en memoria en ese caso.
- El grupo de rutas `(auth)` no tenía `_layout.tsx` propio (a diferencia de `(tabs)`), así que expo-router no lo colapsaba como grupo direccionable desde el `Stack.Protected` del layout raíz. Fix: se agregó `src/app/(auth)/_layout.tsx`.
- El botón "Continuar con Google" / "Generar código" / "Vincular" tenía `backgroundColor: '#000000'` hardcodeado; en modo oscuro el fondo de la pantalla también es negro, así que el botón quedaba invisible. Fix: el fondo del botón ahora usa `theme.text` (color invertido del tema), visible en los dos modos.

## Fase B — Ánimo en tiempo real

- [ ] Migración: tabla `mood_checkins`
- [ ] UI de check-in (5-6 estados + nota opcional, uno por día)
- [ ] Suscripción Realtime en Home para ver el ánimo del partner al instante
- [ ] Edge Function + Expo push: notificar cuando la app está en background/cerrada

## Fase C — Calendario compartido + Google Calendar

- [ ] Migración: tabla `couple_events`
- [ ] CRUD de eventos compartidos con Realtime
- [ ] Sync lectura+escritura con Google Calendar usando el refresh token obtenido en el login
- [ ] Vista combinada: eventos de la app + eventos de Google

## Fase D — Outlook (fast-follow)

- [ ] Repetir el patrón de Fase C con Microsoft Graph API (registro de app en Azure AD)

## Fase E — Demo web para el portfolio

- [ ] Exportar build web (`expo export --platform web`)
- [ ] Embeberla en un mockup de celular dentro de una página del portfolio
- [ ] Nota: el login con Google y algunas cosas nativas pueden no funcionar igual en la demo web — evaluar un modo "demo" con datos de ejemplo si hace falta

## Notas / hallazgos

- `C:\Users\UMA` (la carpeta de usuario completa) resultó ser, sorpresivamente,
  un repo git ya existente con commits reales, sin remoto. No se tocó. Ver
  aviso dado a Melany en el chat — pendiente de que decida qué hacer con eso,
  no es parte de este proyecto.
- Los íconos de las tabs (`home.png` / `explore.png`) son placeholders
  reciclados del template de Expo — falta branding propio.
