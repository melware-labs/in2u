# Lecciones — in2u

Registro de correcciones del usuario y patrones a seguir, para revisar al
empezar cada sesión nueva sobre este proyecto.

## Supabase (plan gratuito) se pausa solo por inactividad

- **Si el login (o cualquier llamada a Supabase) falla en TODAS las
  plataformas a la vez** (web, `.apk`, todo) **con un error de red/DNS**
  (`DNS_PROBE_FINISHED_NXDOMAIN` o similar) en vez de un error de la app,
  sospechar primero del proyecto de Supabase pausado, no de configuración.
  Confirmar con `nslookup <ref>.supabase.co 8.8.8.8` — si ni el DNS público
  de Google lo resuelve, no es la red del usuario ni nada de eso, el
  proyecto está caído/pausado. Se arregla desde el dashboard de Supabase →
  overview del proyecto → botón "Resume project" (tarda 1-2 minutos).
  Perdimos mucho tiempo antes de esto sospechando de Redirect URLs, DNS de
  la facultad, y otras cosas — este chequeo debería ser el primero, no el
  último, cuando "nada anda" de golpe.
- **Antes de tocar cualquier config de Auth en el dashboard de Supabase,
  confirmar que el proyecto esté "Healthy"** — si está pausado, las
  páginas de configuración (URL Configuration, etc.) se quedan con
  skeleton loaders infinitos sin avisar por qué.

## Automatizar formularios web con Claude en Chrome (setup de Supabase/Google Cloud)

- **Autofill de Chrome puede rellenar campos sensibles con basura sin avisar**
  (pasó dos veces con los campos "Client ID"/"Client Secret" de Google en
  Supabase: apareció "in2u" y una key corta que no eran valores reales).
  Antes de guardar cualquier formulario con credenciales, verificar el
  `.value` real del campo por JS (no confiar en lo que se ve en pantalla) y
  limpiar con el setter nativo de `HTMLInputElement` + `dispatchEvent` si hace
  falta.
- **Los secrets que se muestran "una sola vez" (Google OAuth Client Secret)
  hay que capturarlos en el mismo momento**, sin ningún click de por medio
  que pueda cerrar el diálogo antes de tiempo. El botón de "descargar JSON"
  es más confiable que copiar de pantalla: descarga un archivo real que se
  puede leer del disco con precisión, sin transcribir a mano ni arriesgarse a
  que un click perdido cierre el diálogo. Borrar el archivo descargado después
  de usarlo (queda el secret en texto plano en Descargas si no).
- **Tooltips/overlays flotantes (ej. "Configura Gemini Cloud Assist" en
  Google Cloud Console) se reposicionan o reaparecen entre screenshots** y
  arruinan clicks por coordenadas. Mejor usar `find`/refs en vez de
  coordenadas fijas cuando el layout es inestable, o remover el overlay por
  JS con cuidado de no ocultar un contenedor compartido con la UI real (eso
  puede dejar la página en blanco si React pierde el nodo que maneja).
- **`tabs_context_mcp` con `createIfEmpty: true` abre una pestaña nueva en
  blanco**, no se engancha a una pestaña ya abierta por el usuario en su
  Chrome real — hay que navegar explícitamente a la URL necesaria.
- **Una pestaña de Claude en Chrome puede quedar con el layout roto**
  (viewport reportado 0x0, `screenshot` tirando error de parámetros,
  elementos posicionados en coordenadas negativas, clicks — reales o por JS —
  que no disparan el handler de Angular Material aunque el botón esté
  habilitado). Pasó en Google Cloud Console con `www.gstatic.com` bloqueado.
  Antes de pelear con esa pestaña, abrir una pestaña nueva (`tabs_create_mcp`)
  y renavegar: en una pestaña fresca el layout suele venir bien y los clicks
  normales funcionan.

## EAS Build (generar el `.apk`)

- **El `eas.json` de un proyecto Expo nuevo no trae `android.package`
  ni perfiles con `buildType: apk`** — sin `android.package` el primer
  `eas build` pide crearlo interactivo (rompe en sesión no interactiva); sin
  `buildType: apk` en el perfil, genera un `.aab` que no se puede instalar a
  mano. Ambos hay que agregarlos a mano la primera vez.
- **La imagen default de EAS Build puede traer un Node más viejo que el que
  piden las dependencias** (pasó: contenedor con Node 20.19, pero
  `@supabase/*` piden `>=22`, warnings `EBADENGINE` en "Install dependencies").
  Fijar `"node": "X.Y.Z"` en cada perfil de `eas.json` que se vaya a usar.
- **`npm ci` en el contenedor de EAS puede fallar con `Missing: <paquete> from
  lock file` aunque `npm ci` ande perfecto en la máquina local.** Causa real:
  npm 11 (u otra versión más nueva que la del contenedor) resuelve distinto
  las *peer dependencies opcionales* — puede omitir instalar una copia
  anidada que sí es obligatoria para la versión de npm del contenedor de EAS
  (10.8.2 al momento de escribir esto). El lockfile generado localmente
  queda "incompleto" desde el punto de vista de esa versión más vieja.
  Arreglo: regenerar el lockfile con la MISMA versión de npm que usa EAS
  (`npx npm@10.8.2 install`, ajustar la versión según lo que diga el log del
  build fallido) y commitear ese `package-lock.json`. No hackear con
  `--legacy-peer-deps` ni borrar el lockfile.
- **Si el build termina "exitoso" pero la app crashea a los pocos segundos de
  abrir, sospechar primero de env vars faltantes**, no de un bug de código.
  `.env` está (correctamente) en `.gitignore`, así que EAS Build nunca lo ve;
  si el código hace `throw` cuando falta una variable pública
  (`EXPO_PUBLIC_*`, patrón usado en `src/lib/supabase.ts`), el build sale
  perfecto pero el bundle explota apenas arranca. El log del build lo dice
  explícito: "No environment variables ... found for the '<profile>'
  environment on EAS". Arreglo: `npx eas-cli env:set --name X --value Y
  --visibility plaintext --environment production --environment preview
  --environment development --non-interactive` por cada variable pública que
  el código necesite en runtime, y volver a buildear — no hace falta tocar
  `eas.json` para esto, EAS las inyecta solo si están cargadas en ese
  "environment".

## Sesiones concurrentes sobre el mismo repo (2026-09-11)

- **El repo puede estar siendo tocado por otra sesión al mismo tiempo** (en
  este caso: una sesión aparte deployando a Vercel mientras esta armaba las
  Fases C-F). Señales: un archivo que se acababa de leer cambia de tamaño/
  contenido entre lecturas, o el hook de Edit avisa "the file had been
  modified on disk since you last read it". Regla: releer el archivo justo
  antes de editarlo, no confiar en el contenido que reportó un subagente de
  exploración en un paso anterior — puede haber quedado desactualizado
  mientras se armaba el plan. También puede haber ya un `expo start --web`
  corriendo en el puerto default (8081) desde esa otra sesión: si
  `npm run web` falla con "Port 8081 is being used by another process",
  antes de forzar otro puerto conviene primero probar si ese puerto ya
  sirve la app (`curl localhost:8081`) y usar ese servidor directamente en
  vez de arrancar uno nuevo.
- **`tsconfig.json` con `include: ["**/*.ts", "**/*.tsx", ...]` sin
  `exclude` se traga también `supabase/functions/**`** — las Edge Functions
  corren en Deno (`Deno.serve`, imports `jsr:`), así que `tsc` del proyecto
  Expo tira errores ahí (`Cannot find name 'Deno'`, módulo `jsr:` no
  resoluble) aunque el código de la función esté bien. Fix: agregar
  `"exclude": ["node_modules", "supabase/functions"]` al `tsconfig.json`
  raíz — las Edge Functions se tipan/lintean con las herramientas de
  Supabase/Deno, no con el `tsc` de la app cliente.
- **Un objeto de diccionario i18n con `as const` en el archivo "fuente"
  (`es.ts`) rompe la implementación del otro idioma** si se tipa como
  `en: Dictionary = {...}` (`Dictionary = typeof es`): `as const` angosta
  cada string a su literal exacto, así que `en.ts` con cualquier string en
  inglés falla a compilar ("Type '\"Cancel\"' is not assignable to type
  '\"Cancelar\"'"). Fix: no usar `as const` en el diccionario fuente cuando
  otro archivo va a implementar el mismo tipo con valores distintos — dejar
  que TS infiera `string` para los campos de texto plano, y las funciones
  (`(n: number) => string`) ya tipan bien solas sin necesitar el const
  assertion.
- **`npm run lint` (`expo lint`) en un proyecto que nunca corrió lint antes
  instala ESLint solo, en el momento** ("No ESLint config found... eslint
  will be installed") — la primera corrida puede fallar con
  "Cannot find module 'eslint'" a pesar de decir que lo instaló bien;
  simplemente volver a correr `npm run lint` una segunda vez lo resuelve
  (el install ya había terminado, solo hizo falta que el proceso lo viera).
