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
