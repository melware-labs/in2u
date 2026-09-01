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
- [x] Agregadas las Redirect URLs que faltaban en Supabase (Authentication → URL Configuration): sin esto, Supabase no sabía adónde volver después del login de Google y caía al Site URL por defecto (`localhost:3000`, inexistente) → error "ERR_CONNECTION_FAILED" en el celular. Fix: `in2u://*` y `exp://*` agregadas a Redirect URLs, Site URL cambiado a `in2u://`.
- [x] Agregados como usuarios de prueba en Google Cloud (ver más abajo) — necesario mientras la pantalla de consentimiento esté en modo "Prueba"
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

### Bugs encontrados y corregidos al bajar de SDK 57 a SDK 54

- `NativeTabs.Trigger.Label`/`.Icon` (subcomponentes) no existen en la versión de `expo-router` de SDK 54 — ahí `Label`/`Icon` son componentes sueltos, hijos directos de `NativeTabs.Trigger`. Fix en `app-tabs.tsx`.
- `DarkTheme`/`DefaultTheme`/`ThemeProvider` no se re-exportan desde `expo-router` en esta versión — vienen de `@react-navigation/native`.
- `useColorScheme()` de React Native no tiene el valor `'unspecified'` en el tipo de esta versión — se sacó esa comparación.
- `StyleSheet.absoluteFill` no se puede spread-ear (es un registered style ID, no un objeto) — bug preexistente del template, no relacionado al downgrade; el fix correcto es `StyleSheet.absoluteFillObject`.
- `app.json` tenía plugins (`expo-font`, `expo-image`, etc.) que `expo install --fix` agregó de más en SDK 56/57 y no tienen config plugin válido en SDK 54 — se sacaron (no hacían falta).

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

**"Nico" en el diseño y en las notas de acá es el nombre placeholder del
mockup** — la pareja real de Melany se llama **Raúl** (`raulveneriruiz@gmail.com`).
En la app el nombre nunca está hardcodeado, sale del `display_name` del
perfil, así que esto no afecta el código.

## Fase B — Sistema de diseño Nocturne + Nosotros + Check-in

- [x] `theme.ts`: tokens de Nocturne (bg/surface/text, rampas neutral y accent 100-900, radios, espaciados)
- [x] Fuente Inter (`@expo-google-fonts/inter`), cargada en `_layout.tsx` antes de ocultar el splash
- [x] Migración escrita: tabla `mood_checkins` (1 check-in por día vía columna generada + unique, RLS con patrón de `couples`) + policy nueva en `profiles` para leer el perfil de la pareja (`0002_mood_checkins.sql`)
- [x] Pantalla "Nosotros" (`(tabs)/index.tsx`) rehecha con el diseño: card de ánimo de la pareja, card de check-in propio, grilla semanal, próximo evento (placeholder hasta Fase C)
- [x] Pantalla de check-in (`app/check-in.tsx`, modal): 6 moods + nota opcional
- [x] `use-mood-realtime.ts`: suscripción Realtime a `mood_checkins` por `couple_id`
- [x] Verificado: `tsc` limpio en todo el proyecto; preview web confirma que el tema Nocturne + Inter renderiza bien en el login (Nosotros/Check-in necesitan sesión real, no se ven sin login)
- [x] Agregados como usuarios de prueba en Google Cloud (pantalla de consentimiento en estado "Prueba" — solo estos dos pueden loguearse hasta que se publique/verifique): `melanymartinezpineda@gmail.com`, `raulveneriruiz@gmail.com`
- [ ] **Pendiente de Melany**: correr `0002_mood_checkins.sql` en el SQL Editor de Supabase
- [ ] **Pendiente de Melany**: probar Nosotros + check-in en Expo Go (dos cuentas) — confirmar que el check-in se guarda y que el de la pareja aparece en tiempo real sin refrescar
- [ ] Edge Function `notify-mood`: push a la pareja al registrar ánimo (formato de la pantalla "Push" del diseño) — sigue una vez confirmado lo anterior
- [ ] Recordatorio diario programado (cron) — si no entra en esta pasada, queda para la siguiente

## Fase C — Calendario compartido + Google Calendar

- [ ] Migración: tabla `couple_events` (con visibilidad `solo yo` / `los dos`, como en el diseño de "Nuevo evento")
- [ ] Pantalla "Calendario": toggle Mes/Agenda, grilla mensual con color por persona, agenda del día
- [ ] Pantalla "Nuevo evento" (modal): cuándo/dura, visibilidad, toggle "escribir también en Google Calendar"
- [ ] Sync lectura+escritura con Google Calendar usando el refresh token obtenido en el login

## Fase D — Consejos (nueva, del diseño — actualizada con IA)

- [ ] Pestaña nueva "Consejos" en el tab bar (pasa de 3 a 4 tabs)
- [ ] Contenido base curado (categorías de consejos, como en el diseño)
- [ ] **Decisión 2026-09-01 (confirmada por Melany): análisis con IA real vía Gemini**, no reglas de palabras clave. Edge Function en Supabase recibe la nota del check-in, la manda a la API de Gemini (tiene tier gratis, alcanza para el volumen de la app) con un prompt que la clasifica y elige qué consejo curado mostrarle a quien la lee. La API key de Gemini vive solo en la Edge Function, nunca en el cliente. **Nota de privacidad ya conversada y aceptada**: esto manda las notas del check-in (potencialmente íntimas) a un servicio externo (Google/Gemini) para procesarlas — no se quedan solo entre Supabase y la app.

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

## Fase I — Pedidos nuevos de Melany, 2026-09-01 (pendientes de planificar en detalle)

Todavía no tienen fase asignada ni diseño de datos — se planifican con
`EnterPlanMode` cuando la Fase B esté verificada de punta a punta. Anotados
acá para no perderlos:

- [ ] **Diario de citas / acontecimientos importantes con fotos adjuntas.** Necesita tabla nueva + Supabase Storage para las fotos (con su propia RLS de bucket).
- [ ] **"Conocer a la pareja" para adaptar el contenido.** Un cuestionario o perfil sobre la pareja (gustos, lenguaje del amor, lo que sea que Melany tenga en mente) que alimenta la personalización de Consejos. Falta que Melany precise qué datos concretos quiere capturar.
- [ ] **Botón "Escribirle" conectado a la app de mensajería preferida.** Melany confirmó: se pregunta al crear la cuenta (onboarding) qué app usa cada quien (WhatsApp/Telegram/SMS/etc.) y su contacto. El botón arma el deep link correspondiente (`whatsapp://send?phone=...`, `sms:...`, etc.). Es chico y toca el onboarding + la Fase B ya construida — buen candidato para ir antes que el resto de esta lista.
- [ ] **Versión web real de la app** (no solo la demo de la Fase H) — usable con login y datos reales desde el navegador, no solo una vista de muestra. Pendiente de confirmar el alcance exacto con Melany (le pregunté, todavía no contestó esa parte).

## Distribución (decidir en Fase B, no bloquea nada ahora)

Melany y su pareja usan un Android y un iPhone (uno de cada uno).

- **Android**: gratis siempre — `.apk` standalone vía EAS Build (tier free), sin pasar por Play Store, sin el fee de u$s 25.
- **iOS**: sin cuenta de Apple Developer (u$s 99/año) no hay forma razonable de instalar un build propio de forma permanente. Camino gratis: **Expo Go**. Falta confirmar en la práctica, al construir la Fase B, si las notificaciones push en background andan confiables dentro de Expo Go en iOS con el SDK actual — si no alcanza, ahí se decide si vale pagar la cuenta de Apple.

### Setup del `.apk` para Raúl (2026-09-01)

- [x] `eas.json` creado con perfil `preview` (`distribution: internal`, `android.buildType: apk`) — genera un `.apk` instalable directo, sin pasar por Play Store
- [x] `app.json`: agregado `android.package` (`com.melanymartinez.in2u`), requerido por EAS Build y antes ausente
- [x] Script `npm run build:android:apk` agregado (corre `eas-cli` vía `npx`, sin instalarlo como dependencia del proyecto — así lo pide `expo-doctor`)
- [x] `expo-doctor` verificado: limpio salvo un desfasaje de versión de `typescript`/`@types/react` preexistente, no relacionado con este cambio
- [ ] **Pendiente de Melany — no automatizable**: correr `npx eas-cli login` para autenticarse con su cuenta de Expo (o crear una en [expo.dev](https://expo.dev) si no tiene). Es login interactivo, no se puede hacer desde una sesión no interactiva.
- [ ] **Pendiente de Melany**: correr `npm run build:android:apk`. La primera vez EAS pregunta si quiere crear/vincular un proyecto EAS nuevo para `in2u` — aceptar. El build corre en la nube (gratis, tier free) y al terminar da un link para descargar el `.apk` directo al celular de Raúl (o al de ella para pasárselo).

## Notas / hallazgos

- `C:\Users\UMA` (la carpeta de usuario completa) resultó ser, sorpresivamente,
  un repo git ya existente con commits reales, sin remoto. No se tocó. Ver
  aviso dado a Melany en el chat — pendiente de que decida qué hacer con eso,
  no es parte de este proyecto.
- Los íconos de las tabs (`home.png` / `explore.png`) son placeholders
  reciclados del template de Expo — falta branding propio.
