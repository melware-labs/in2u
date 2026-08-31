# Lecciones — in2u

Registro de correcciones del usuario y patrones a seguir, para revisar al
empezar cada sesión nueva sobre este proyecto.

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
