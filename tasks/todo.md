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
- [x] **Migración `0002_mood_checkins.sql` corrida en Supabase** (2026-09-11, vía SQL Editor con la sesión de Melany ya autenticada en el navegador — ver "Sesiones concurrentes" en lessons.md)
- [ ] **Pendiente de Melany**: probar Nosotros + check-in en la web (dos cuentas) — confirmar que el check-in se guarda y que el de la pareja aparece en tiempo real sin refrescar
- [ ] Edge Function `notify-mood`: push a la pareja al registrar ánimo (formato de la pantalla "Push" del diseño) — sigue una vez confirmado lo anterior
- [ ] Recordatorio diario programado (cron) — si no entra en esta pasada, queda para la siguiente

## Fase C — Calendario compartido + Google Calendar

Implementado 2026-09-11 (sesión completa Fases C+D+E+F, ver
`C:\Users\UMA\.claude\plans\partitioned-hugging-pinwheel.md` para el plan
aprobado con el detalle técnico completo).

- [x] Migración `0003_couple_events.sql`: tabla `couple_events` (`solo_yo`/`los_dos`, `google_sync_enabled` solo-UI por ahora), RLS
- [x] `src/lib/couple-events.ts`, `src/lib/calendar-grid.ts` (grilla mensual pura, sin I/O)
- [x] Pantalla "Calendario" (`(tabs)/calendario.tsx`) rehecha: toggle Mes/Agenda, grilla real por mes/año (con navegación ‹›), leyenda, agenda del día seleccionado
- [x] Pantalla "Nuevo evento" (`app/new-event.tsx`, modal): título, cuándo/dura (con `@react-native-community/datetimepicker`, dependencia nueva), repetir (fijo "Nunca"), visibilidad, toggle Google Calendar (solo UI)
- [x] **Migración `0003_couple_events.sql` corrida en Supabase** (2026-09-11)
- [ ] **Pendiente de verificar**: `@react-native-community/datetimepicker` en Expo Go real (funcionó bien en el preview web; no se probó en dispositivo)
- [ ] Sync lectura+escritura con Google Calendar usando el refresh token obtenido en el login — sigue sin implementar, a propósito (fuera de alcance de esta pasada)

## Fase D — Consejos (con IA real vía Gemini)

- [x] Pestaña nueva "Consejos" en el tab bar (ahora 5 tabs: Nosotros/Calendario/Consejos/Ciclo/Perfil)
- [x] Contenido curado ES/EN (`src/content/tips.ts`, 4 tips + ritual semanal rotativo)
- [x] Migración `0005_daily_tips.sql`: tabla `daily_tips`, sin policy de insert para `authenticated` (solo la Edge Function escribe, con service role)
- [x] Edge Function `supabase/functions/analyze-checkin/index.ts`: recibe `{coupleId, checkinAuthorId}`, confirma el vínculo con un cliente scoped al caller, clasifica con Gemini (`responseSchema` JSON) el historial reciente de check-ins, guarda el tip para la PAREJA de quien hizo el check-in. Invocada fire-and-forget desde `check-in.tsx` justo después de guardar
- [x] Pantalla "Consejos" (`(tabs)/consejos.tsx`): card "Para hoy" si hay tip del día + lista de tips generales + ritual de la semana
- [x] **Migración `0005_daily_tips.sql` corrida en Supabase** (2026-09-11)
- [ ] **Pendiente de Melany (no es código)**: generar API key de Gemini en Google AI Studio; `npx supabase secrets set GEMINI_API_KEY=... GEMINI_MODEL=gemini-flash-latest`; `npx supabase functions deploy analyze-checkin` — sin esto, "Consejos" no genera tips nuevos (el contenido curado sí se ve)

## Fase E — Ciclo

- [x] **Decisión 2026-09-11 (confirmada por Melany): sí construirla ahora.** Migración `0004_cycle.sql`: `cycle_settings`/`cycle_periods`/`cycle_daily_logs` con RLS SOLO propia (sin policy de select para la pareja, a propósito) + `get_partner_cycle_summary()` (`security definer`) como único canal hacia la pareja — nunca expone `cycle_daily_logs`, recorta según `partner_visibility`
- [x] Selector de privacidad: Nada / Solo avisos (señal genérica sin fase ni fechas, confirmado por Melany) / Fase y avisos
- [x] **Decisión 2026-09-11: Ciclo es una 5ta tab** (no una sub-página de Perfil, que era mi recomendación — Melany prefirió la tab)
- [x] Card condicional en el "Nosotros" de la pareja + sección "Cómo cuidarla estos días" (`src/content/cycle-care-tips.ts`, estático, no depende de IA)
- [x] **Migración `0004_cycle.sql` corrida en Supabase** (2026-09-11) — encontró y corrigió un bug real al correrla: `round()` sobre una división devuelve `numeric` en Postgres, y sumarlo directo a una fecha (`date + numeric`) no es una operación válida. Cast a `::int` agregado en `folicular_days`/`ovulacion_days`; ver lessons.md
- [ ] Promedio real de los últimos 6 ciclos (el disclaimer del diseño lo menciona) — v1 usa duración fija/editable a mano (29/5 días default); `cycle_periods` ya está preparada para el cálculo real después

## Fase F — Internacionalización ES/EN

- [x] Diccionario propio (`src/lib/i18n/{es,en,index}.ts`), sin librería — `expo-localization` (dependencia nueva) resuelve el idioma del sistema
- [x] Aplicado a TODAS las pantallas, incluidas las viejas de Fase A-C (`(tabs)/index.tsx`, `check-in.tsx`, `(tabs)/perfil.tsx`, `app-tabs.tsx`, `format.ts`) — se adelantó la pasada corta prevista para "al final", ya que tocar cada pantalla dos veces (una sin i18n, otra retrofitteada) era más trabajo que hacerlo una sola vez
- [ ] `(auth)/login.tsx` y `onboarding.tsx` quedan sin traducir — no estaban en el alcance acordado para esta pasada

## Verificación de esta sesión

- [x] `npx tsc --noEmit` limpio en todo el proyecto (tuvo que excluirse `supabase/functions` del `tsconfig.json` — ver lessons.md)
- [x] `npm run lint` limpio (0 errores, 0 warnings tras corregir un `unused var`)
- [x] Preview web (puerto 8081, servidor ya corriendo — no se pudo arrancar uno nuevo por el puerto ocupado, ver lessons.md): pantalla de login carga sin errores de consola, el bundle completo (`entry.bundle`) compila y sirve 200 OK
- [ ] **No verificado visualmente más allá del login**: Calendario/Consejos/Ciclo/Nosotros necesitan sesión real (mismo límite que Fase B) — pendiente de que Melany las pruebe con su cuenta después de correr las migraciones

## Fase J — Migración a web responsive con Spring Boot + Docker (2026-10-17)

Decisión de Melany: se olvida la app nativa Android/iOS; in2u pasa a ser una web responsive con todas las funciones, backend Spring Boot (Java 21) y Docker. Decisiones tomadas por defecto: frontend React + Vite (paso 2), Postgres propio en Docker en vez de Supabase, SSE en lugar de Supabase Realtime, sesión con cookie + CSRF. El código Expo queda en el repo hasta que la web tenga todas las funciones.

- [x] **Paso 1 — Backend** (`backend/`): Spring Boot 4.1 + Postgres + Flyway (`V1__esquema_inicial.sql` porta las 5 migraciones de Supabase), login con Google (OAuth2) + login de desarrollo (`DEV_LOGIN=true`), pairing por código, check-in de ánimo (uno por día, "hoy" según la zona horaria de cada quien), SSE en tiempo real para la pareja, consejos del día
- [x] Consejos según el ánimo con **Gemini (plan gratuito de AI Studio)**; sin key, o si Gemini falla / agota la cuota, cae a un respaldo por reglas (`RuleBasedTipper`), así nunca queda vacío
- [x] `docker-compose.yml` (db + backend) y `backend/Dockerfile` multi-stage; 8 tests (Testcontainers + Postgres real) pasan; verificado de punta a punta con contenedores reales
- [ ] **Pendiente de Melany**: crear la API key gratis en https://aistudio.google.com/apikey y ponerla en `.env` como `GEMINI_API_KEY`; agregar `http://localhost:8080/login/oauth2/code/google` como redirect URI del OAuth Client de Google
- [ ] **No verificado**: la llamada real a Gemini (no había key) y `docker compose build` dentro de este sandbox (el proxy del entorno rompe el certificado de Maven dentro del build; fuera de ahí es el Dockerfile estándar)
- [x] Revisión de la base (2026-10-17): límite de intentos al unirse con código (8 fallos/15 min, 429), Gemini recibe solo el número del ánimo y NO las notas (opt-in `GEMINI_SEND_NOTES`; el plan gratuito de Google puede usar lo enviado), cookie de sesión `Secure` configurable (`COOKIE_SECURE`), aviso en el log si `DEV_LOGIN` está activo, HEALTHCHECK del contenedor verificado, 12 tests
- **Decisión para el despliegue en vercel.app**: el frontend llama a `/api/*` en su propio dominio y Vercel lo reenvía al backend (`rewrites` en `vercel.json`), así la cookie de sesión es de primera parte (sin CORS ni `SameSite=None`) y la redirect URI de Google apunta al dominio de Vercel. El login de Google también pasa por esas rutas (`/oauth2/**`, `/login/oauth2/**`). Limitación conocida: sesiones y conexiones SSE en memoria → una sola instancia del backend; un deploy cierra las sesiones (si molesta, Spring Session JDBC)
- [ ] Paso 2: frontend web responsive (React + Vite): Nosotros + check-in
- [ ] Paso 3: Calendario, Ciclo (resumen recortado para la pareja) y Perfil
- [ ] Paso 4: servir el frontend desde la misma imagen / Compose, y desplegar

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
- [x] Melany se logueó (`npx eas-cli login`, cuenta `melware-labs`)
- [x] Proyecto EAS creado y vinculado: `@melware-labs/in2u`
- [x] **Bug encontrado y corregido — Node desactualizado en la imagen de build**: la imagen default de EAS Build trae Node 20.19.4, pero `@supabase/*` piden Node ≥22 (warnings `EBADENGINE`). Fijado `"node": "22.18.0"` en cada perfil de `eas.json`.
- [x] **Bug encontrado y corregido — lockfile generado con una versión de npm distinta a la del build**: `npm ci` fallaba con `Missing: typescript@5.9.3 from lock file`. Causa: npm 11 (local) no instala una copia anidada de `typescript` que satisface el peer opcional de `@expo/image-utils` → `@expo/require-utils` (`typescript ^5.0.0`, no cubierto por el `typescript ~6.0.3` del proyecto); npm 10.8.2 (el que usa EAS) sí la instala y exige que esté en el lockfile. Se regeneró `package-lock.json` corriendo la instalación con `npx npm@10.8.2` para que incluya esa entrada.
- [x] Primer `.apk` generado (build `d0cbc135-da9c-42a4-9887-3c2b1c71f085`, perfil `preview`) — **pero crasheaba a los ~2s de abrir**
- [x] **Bug encontrado y corregido — faltaban las env vars de Supabase en el build**: `src/lib/supabase.ts` tira `throw` a propósito si `EXPO_PUBLIC_SUPABASE_URL`/`EXPO_PUBLIC_SUPABASE_ANON_KEY` no están (ver `.env.example`). `.env` está en `.gitignore` (correcto, no debe versionarse) pero por eso tampoco viajaba a EAS Build — el primer build log decía explícitamente "No environment variables ... found for the 'preview' environment on EAS". Se subieron ambas variables al proyecto EAS con `npx eas-cli env:set --environment production --environment preview --environment development` (visibilidad `plaintext`, son la URL y la anon key públicas de Supabase, no secretos) para que quedaran horneadas en todos los perfiles de build.
- [x] Build con env vars generado (`3f28f5c5-...`) — **seguía crasheando ~2s después de abrir**, mismo síntoma que el primero. Confirmado por Melany que probó ese link específico (no el viejo).
- [x] **Ícono de la app reemplazado** (de paso, pedido de Melany): era el logo default del template de Expo (la "A" azul) en `icon.png`, adaptive icon de Android, splash y favicon. Nuevo: corazón simple en gradiente lavanda (accent/accent2 de Nocturne) sobre `#161826`. `adaptiveIcon.backgroundColor` en `app.json` corregido de `#E6F4FE` (quedaba del template) a `#161826`. iOS (`assets/expo.icon`, formato Icon Composer) sigue sin tocar — no es un PNG plano y no estamos generando build de iOS todavía.
- [x] **Segundo bug sospechado y corregido — dependencias experimentales sin usar**: como el crash persistía con las env vars ya resueltas, la sospecha pasó a un crash nativo (no un `throw` de JS — "se cierra sola", no queda pantalla de error). Sin logs del dispositivo (no hay ADB configurado en esta sesión) para confirmarlo con certeza, se sacaron `@expo/ui` (resolvía a una versión *canary*, no la beta estable que pedía el rango) y `expo-glass-effect` — ninguno de los dos se usa en `src/`, ambos son paquetes muy nuevos/experimentales pensados sobre todo para iOS.
- [x] **Confirmado por Melany (screenshot): el build `9df2853e-...` abre bien** — login con Google anduvo, pantalla "Nosotros" se ve con su perfil. El crash quedó resuelto (aunque sin logs de por medio no se puede afirmar con 100% de certeza que la causa haya sido exactamente esa, es la hipótesis que dejó de reproducirse).
- [ ] **Posible bug nuevo detectado en el screenshot**: el contenido se ve rotado en horizontal a pesar de `"orientation": "portrait"` en `app.json`. Podría ser solo cómo sostenía el teléfono al sacar la foto, o una opción de Android ("ignorar solicitud de orientación", común en Samsung/Xiaomi) que fuerza la rotación. Preguntado a Melany, pendiente de su respuesta antes de tocar nada.
- [ ] Pendiente: Melany le pasa el link/QR a Raúl para que lo instale y probar login + pairing con dos cuentas reales

## Versión web en Vercel (2026-09-11)

Decisión de Melany: probar primero la versión web (responsive para
Apple/Android/Mac/Windows) antes de seguir peleando con builds nativos.

- [x] `vercel.json` agregado (`buildCommand: npx expo export --platform web`, `outputDirectory: dist`) y desplegado en **https://in2u.vercel.app** (proyecto `melware-labs/in2u` en Vercel, cuenta de Melany)
- [x] Env vars de Supabase agregadas también en Vercel (mismo patrón que en EAS — si no, mismo crash por variables faltantes)
- [x] **Causa raíz de que nada funcionara, en ningún lado (ni web ni el `.apk`): el proyecto de Supabase estaba pausado** por inactividad (plan gratuito). El dominio `gwhpehcjhejqlikdoxtx.supabase.co` daba `DNS_PROBE_FINISHED_NXDOMAIN` — confirmado que no resolvía ni siquiera contra el DNS público de Google, o sea que no era la red de Melany ni nada de eso. Se reactivó desde el dashboard de Supabase ("Resume project"); quedó "Healthy" en un par de minutos.
- [x] Redirect URLs de Supabase actualizados: agregados `https://in2u.vercel.app` y `http://localhost:*` (antes solo estaban `in2u://*` y `exp://*`, nada para web)
- [x] **Login con Google funcionando de punta a punta en la web**, confirmado por Melany
- [x] Fix responsive: `maxWidth: MaxContentWidth` (800) + `alignSelf: center` en las 6 pantallas (login, Nosotros, Calendario, Perfil, check-in, onboarding) — antes se estiraban de punta a punta en pantallas anchas
- [x] Fix: columna de nombres en la grilla semanal de "Nosotros" ensanchada (34px → 80px + `numberOfLines={1}`) — "Melany" y "tu pareja" se cortaban en varias líneas
- [x] Fix: la píldora flotante del tab bar (`position: absolute`) tapaba el contenido de cada pantalla — no había espacio reservado arriba. Solucionado en un solo lugar (`app-tabs.tsx`, no repetido por pantalla): `TabSlot` reserva `TabBarPillHeight + insets.top` de `paddingTop`
- [x] Fix: pantalla de check-in sin `ScrollView` — si el contenido no entraba en la altura de pantalla, la nota quedaba cortada sin forma de desplazarse para verla completa
- [x] Fix: `cleanUrls: true` en `vercel.json` — sin esto, entrar directo a `/check-in`, `/calendario`, etc. (o recargar la página estando ahí) daba 404, porque el export estático de Expo genera cada ruta como archivo plano (`check-in.html`) y Vercel no las servía en la URL limpia por default
- [ ] Pendiente: completar "Información de la marca" en Google Cloud (nombre + logo de la app) para que la pantalla de consentimiento de Google se vea mejor — la línea "Ir a gwhpehcjhejqlikdoxtx.supabase.co" en el selector de cuenta de Google **no se puede quitar ni renombrar**, es una medida de seguridad de Google que muestra el dominio real que recibe la respuesta del login (pasa con cualquier app que use Supabase u otro proveedor externo para OAuth)
- [ ] Pendiente: revisar Perfil con una sesión real logueada (no se había verificado visualmente hasta ahora)

## Notas / hallazgos

- `C:\Users\UMA` (la carpeta de usuario completa) resultó ser, sorpresivamente,
  un repo git ya existente con commits reales, sin remoto. No se tocó. Ver
  aviso dado a Melany en el chat — pendiente de que decida qué hacer con eso,
  no es parte de este proyecto.
- Los íconos de las tabs (`home.png` / `explore.png`) son placeholders
  reciclados del template de Expo — falta branding propio.
