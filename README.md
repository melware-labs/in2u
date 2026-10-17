# in2u

**Más conexión.** Web app responsive para parejas que quieren comunicarse mejor:
cada uno cuenta cómo está, comparten calendario, fotos y mensajes, y reciben
consejos según el ánimo del otro.

Sitio público: **https://in2u.vercel.app** (cualquiera puede crear una cuenta con Google).

## Qué hace

- **Cuenta con Google**: "Crear cuenta" e "Iniciar sesión" usan Google. La app
  de OAuth está publicada, así que puede entrar cualquier persona.
- **Registro inicial**: nombre, género, fecha de nacimiento y desde cuándo son
  pareja (con listas de día, mes y año).
- **Vincular a la pareja**: uno crea un código y el otro lo ingresa.
- **Inicio**: saludo, contador de **días juntos**, carrusel "Nuestros recuerdos",
  próximo plan, pregunta del día y consejo del día.
- **Ánimo diario**: un check-in por día con nota opcional; la pareja lo ve al
  instante (tiempo real con SSE).
- **Calendario compartido**: eventos "Solo yo" o "Los dos".
- **Ciclo**: quien elige *Mujer* u *Otro* registra su ciclo y decide qué ve su
  pareja (*Nada*, *Solo avisos* o *Fase y avisos*). Quien elige *Hombre* ve
  solo lo que su pareja comparte. Es una estimación, no un método anticonceptivo.
- **Álbum**: fotos con título y descripción, guardadas en la base de datos.
- **Chat** entre los dos, en tiempo real.
- **Juego "¿Cuánto me conoces?"**.
- **Consejos**: se actualizan según el ánimo. Usan la API gratuita de Gemini y,
  si no hay clave o falla, un catálogo de consejos con reglas.
- **Perfil** (se abre tocando la foto): datos, código de pareja, color de la
  app (Carmesí, Lavanda, Menta, Celeste, Durazno) y modo Día, Noche o Automático.
- **Idiomas**: español e inglés, según el navegador.
- **Privacidad**: política en [`/privacidad.html`](https://in2u.vercel.app/privacidad.html).
  Contacto: melwarelabs@gmail.com.

## Cómo está hecha

| Parte | Tecnología | Dónde corre |
|---|---|---|
| Web (`web/`) | React + TypeScript + Vite | Vercel |
| API (`backend/`) | Java 21 + Spring Boot (Security OAuth2, JPA, Flyway) | Render (Docker) |
| Base de datos | PostgreSQL | Neon |
| Consejos con IA | Google Gemini (plan gratuito) | API de Google |

Vercel reenvía `/api`, `/oauth2` y `/login/oauth2` al backend en Render
(`web/vercel.json`), así la web y la API comparten dominio y cookie de sesión.

## Probarla en tu computadora

Necesitas [Docker](https://www.docker.com/). Desde la carpeta del proyecto:

```bash
cp .env.example .env              # opcional
DEV_LOGIN=true docker compose up --build
```

Abre **http://localhost:8080**. Con `DEV_LOGIN=true` puedes entrar sin Google,
con cualquier email (sirve para probar con dos personas en dos navegadores).
Para parar, usa `Ctrl+C`.

Más detalles (desarrollo, tests, variables de entorno): [docs/desarrollo.md](docs/desarrollo.md).

## Documentación

- [docs/desarrollo.md](docs/desarrollo.md): correr en local, tests, estructura y variables de entorno.
- [docs/publicar.md](docs/publicar.md): cómo está publicada (Neon + Render + Vercel + Google).
- [docs/diseno.md](docs/diseno.md): marca, colores, temas y tipografías.

## Código anterior

Las carpetas `src/`, `assets/`, `supabase/`, `scripts/`, `tasks/` y los archivos
`app.json`, `eas.json`, `package.json`, `tsconfig.json`, `eslint.config.js` y
`vercel.json` de la raíz son de la primera versión (app nativa con Expo y
Supabase). Ya no se usan ni se publican; la app actual vive solo en `web/` y `backend/`.
