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

## Diseño: "in2u couples app design" en Claude Design

El 2026-09-01 Melany armó un diseño completo (9 pantallas) en Claude Design
usando su sistema "Nocturne" (dark, acento violeta `#9184d9`, tipografía
Inter). Proyecto: `e86ba3ac-2aba-49f7-a4c6-7010c0fd13fb`, archivo
`in2u - Ánimo y Calendario.dc.html` (leído vía `DesignSync` MCP, requiere
`/design-login` corrido una vez en sesión interactiva). Sumó dos features
nuevas no planeadas — "Consejos" (tips de pareja) y "Ciclo" (tracker
menstrual con niveles de privacidad hacia Nico) — y mostró la app
internacionalizada (ES/EN según idioma del sistema). El roadmap de acá abajo
quedó reordenado para reflejar eso; el detalle completo de la Fase B está en
el plan (`C:\Users\UMA\.claude\plans\agile-plotting-ritchie.md`, aprobado).

## Fase B — Sistema de diseño Nocturne + Nosotros + Check-in

- [ ] `theme.ts`: tokens de Nocturne (bg/surface/text, rampas neutral y accent 100-900, radios, espaciados)
- [ ] Fuente Inter (`@expo-google-fonts/inter`), cargada en `_layout.tsx` antes de ocultar el splash
- [ ] Migración: tabla `mood_checkins` (1 check-in por día vía índice único, RLS con patrón de `couples`)
- [ ] Pantalla "Nosotros" (`(tabs)/index.tsx`) rehecha con el diseño: card de ánimo de la pareja, card de check-in propio, grilla semanal, próximo evento (placeholder hasta Fase C)
- [ ] Pantalla de check-in (`app/check-in.tsx`, modal): 6 moods + nota opcional
- [ ] `use-mood-realtime.ts`: suscripción Realtime a `mood_checkins` por `couple_id`
- [ ] Edge Function `notify-mood`: push a la pareja al registrar ánimo (formato de la pantalla "Push" del diseño)
- [ ] Recordatorio diario programado (cron) — si no entra en esta pasada, queda para la siguiente

## Fase C — Calendario compartido + Google Calendar

- [ ] Migración: tabla `couple_events` (con visibilidad `solo yo` / `los dos`, como en el diseño de "Nuevo evento")
- [ ] Pantalla "Calendario": toggle Mes/Agenda, grilla mensual con color por persona, agenda del día
- [ ] Pantalla "Nuevo evento" (modal): cuándo/dura, visibilidad, toggle "escribir también en Google Calendar"
- [ ] Sync lectura+escritura con Google Calendar usando el refresh token obtenido en el login

## Fase D — Consejos (nueva, del diseño)

- [ ] Pestaña nueva "Consejos" en el tab bar (pasa de 3 a 4 tabs)
- [ ] Contenido curado estático al principio (sin IA ni backend nuevo), selección simple según patrón de ánimo reciente de la pareja

## Fase E — Ciclo (nueva, del diseño — sensible, requiere confirmación aparte antes de construirla)

- [ ] Tabla propia con RLS estricta (solo lectura propia)
- [ ] Selector de cuánto ve la pareja: Nada / Solo avisos / Fase y avisos
- [ ] Card condicional en el "Nosotros" de Nico, solo si Melany compartió

## Fase F — Internacionalización ES/EN (nueva, del diseño)

- [ ] Diccionario propio liviano (sin librería de i18n pesada, son 2 idiomas)
- [ ] Se aplica desde la Fase D en adelante; A/B/C (ya en español) se traducen en una pasada corta al final

## Fase G — Outlook (fast-follow)

- [ ] Repetir el patrón de Fase C con Microsoft Graph API (registro de app en Azure AD)

## Fase H — Demo web para el portfolio

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
