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
- [x] Proyecto de Supabase creado (`gwhpehcjhejqlikdoxtx`), URL + anon key cargadas en `.env`
- [x] Migración `0001_profiles_and_couples.sql` corrida en Supabase — `profiles` y `couples` confirmadas
- [x] Google habilitado como provider en Supabase: consent screen + OAuth Client ID creados en Google Cloud (proyecto "My First Project" / `ethereal-runner-326715`), callback URL registrada, Client ID/Secret cargados y guardados en Supabase (confirmado: "Google: Enabled" en la lista de providers)
- [x] Verificado en preview web con credenciales reales de Supabase: la app carga y `signInWithOAuth` dispara correctamente
- [ ] Probar el flujo completo (login → pairing) en Expo Go con dos cuentas de Google reales — pendiente, requiere el celular de Melany (ver mensaje del chat)

### Hallazgo: popup bloqueado en el preview web (no afecta la app real)

En el preview web, el click en "Continuar con Google" a veces dispara
`Popup window was blocked by the browser or failed to open` — porque
`window.open()` (usado por `expo-web-browser` en plataforma web) se llama
después de un `await` a Supabase, rompiendo la cadena síncrona que los
navegadores exigen para permitir popups. **No afecta Android/iOS**, donde
`WebBrowser.openAuthSessionAsync` abre un browser view nativo, no un popup de
ventana. Si en la Fase E (demo web) esto molesta, la solución estándar es
abrir una ventana en blanco de forma síncrona en el click y recién ahí
setearle la URL una vez que Supabase la devuelve.

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

## Distribución (decidir en Fase B, no bloquea nada ahora)

Melany y su pareja usan un Android y un iPhone (uno de cada uno).

- **Android**: gratis siempre — `.apk` standalone vía EAS Build (tier free), sin pasar por Play Store, sin el fee de u$s 25.
- **iOS**: sin cuenta de Apple Developer (u$s 99/año) no hay forma razonable de instalar un build propio de forma permanente. Camino gratis: **Expo Go**. Falta confirmar en la práctica, al construir la Fase B, si las notificaciones push en background andan confiables dentro de Expo Go en iOS con el SDK actual — si no alcanza, ahí se decide si vale pagar la cuenta de Apple.

## Notas / hallazgos

- `C:\Users\UMA` (la carpeta de usuario completa) resultó ser, sorpresivamente,
  un repo git ya existente con commits reales, sin remoto. No se tocó. Ver
  aviso dado a Melany en el chat — pendiente de que decida qué hacer con eso,
  no es parte de este proyecto.
- Los íconos de las tabs (`home.png` / `explore.png`) son placeholders
  reciclados del template de Expo — falta branding propio.
