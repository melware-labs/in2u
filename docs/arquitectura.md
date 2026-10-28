# Arquitectura

in2u es una aplicación web de una sola página (SPA) con una API REST detrás.
La web y la API se publican por separado, pero el navegador las ve bajo un
mismo dominio.

## Componentes

```mermaid
flowchart TB
    subgraph Navegador
        SPA["SPA React<br/>(web/)"]
        SW["Service Worker<br/>(sw.js)"]
    end
    subgraph Vercel
        Static["Archivos estáticos<br/>+ rewrites"]
    end
    subgraph Render
        API["Spring Boot<br/>(backend/)"]
    end
    DB[("Neon<br/>PostgreSQL")]
    Google["Google OAuth 2.0"]
    Gemini["Google Gemini"]
    PushSvc["Servicios push<br/>del navegador"]

    SPA --> Static
    Static -->|"/api, /oauth2, /login/oauth2"| API
    API --> DB
    API --> Google
    API --> Gemini
    API --> PushSvc --> SW
```

| Pieza | Responsabilidad |
|---|---|
| `web/` | Interfaz, temas día/noche, textos en español e inglés, registro del Service Worker para push. |
| `web/vercel.json` | Reenvía la API y el OAuth a Render y sirve `index.html` para el resto de las rutas. |
| `backend/` | Autenticación, reglas de negocio, permisos de la pareja, tiempo real y notificaciones. |
| PostgreSQL | Datos de la app, sesiones (Spring Session JDBC) y fotos del álbum (`bytea`). |

## Backend: un paquete por dominio

```
app.in2u
├── user      usuario actual (CurrentUser) y perfil
├── couple    vincular con código, días juntos, límite de intentos
├── mood      check-in diario y stream SSE (MoodStream)
├── calendar  calendario compartido
├── cycle     ciclo, cálculo de fases y qué ve la pareja
├── tips      consejos: GeminiClient + RuleBasedTipper + TipCatalog
├── album     fotos
├── chat      mensajes
├── game      «¿Cuánto me conoces?»
├── push      suscripciones y envío de Web Push
├── common    manejo de errores de la API
├── security  sesión, OAuth, CSRF y login de desarrollo
└── config    propiedades (In2uProperties) y reloj
```

Cada dominio tiene sus entidades JPA, repositorios Spring Data, servicio (cuando
hay lógica) y controlador REST. Los controladores no se llaman entre sí: comparten
servicios como `CoupleService.requirePaired`, que garantiza que cada consulta
quede limitada a la pareja de quien la hace.

## Modelo de datos

```mermaid
erDiagram
    app_users ||--o| couples : "member_one / member_two"
    couples ||--o{ mood_checkins : tiene
    couples ||--o{ daily_tips : tiene
    couples ||--o{ couple_events : tiene
    couples ||--o{ chat_messages : tiene
    couples ||--o{ album_photos : tiene
    couples ||--o{ game_answers : tiene
    app_users ||--o| cycle_settings : configura
    app_users ||--o{ cycle_periods : registra
    app_users ||--o{ cycle_daily_logs : registra
    app_users ||--o{ push_subscriptions : tiene
```

El esquema vive en `backend/src/main/resources/db/migration` (Flyway, `V1`…`V5`).
Hibernate corre con `ddl-auto: validate`: nunca cambia la base por su cuenta.
Todas las claves foráneas usan `on delete cascade`, así borrar a una persona
borra sus datos.

## Inicio de sesión

```mermaid
sequenceDiagram
    participant N as Navegador
    participant V as Vercel
    participant R as Spring Boot (Render)
    participant G as Google
    N->>V: GET /oauth2/authorization/google
    V->>R: (rewrite)
    R-->>N: 302 a Google
    N->>G: Inicia sesión y acepta
    G-->>N: 302 a in2u.vercel.app/login/oauth2/code/google
    N->>V: GET /login/oauth2/code/google?code=…
    V->>R: (rewrite)
    R->>G: Cambia el código por el token
    R-->>N: Cookie de sesión + 302 a FRONTEND_URL
    N->>V: GET /api/me (con la cookie)
```

- La URI de redirección se fija con `OAUTH_REDIRECT_URI`, porque detrás del
  proxy de Vercel Spring vería el host de Render.
- La sesión se guarda en Postgres y dura 90 días.
- Las peticiones que cambian datos llevan el token CSRF de la cookie `XSRF-TOKEN`.

## Tiempo real

- **Ánimo y chat**: `GET /api/mood/stream` abre un Server-Sent Events por persona.
  Cuando la pareja guarda su ánimo o manda un mensaje, el backend emite un evento
  (`mood` o `chat`) y la web recarga solo esa parte.
- **Notificaciones push**: con la app cerrada, el backend envía Web Push firmado
  con claves VAPID; `web/public/sw.js` muestra la notificación.

## Consejos

```mermaid
flowchart LR
    A[Ánimo reciente de la pareja] --> B{¿Hay clave de Gemini?}
    B -- sí --> C[GeminiClient]
    C -- responde bien --> E[Consejo del día]
    C -- error o cuota agotada --> D[RuleBasedTipper]
    B -- no --> D
    D --> E
```

El consejo se guarda en `daily_tips`, así se pide una sola vez por día y persona.
A Gemini solo llegan los números del ánimo; las notas escritas se envían solo si
`GEMINI_SEND_NOTES=true`.

## Despliegue

| Entorno | Web | API | Base de datos |
|---|---|---|---|
| Local | nginx en Docker (`web/Dockerfile`) o `npm run dev` | `backend/Dockerfile` o `mvn spring-boot:run` | Postgres en Docker |
| Producción | Vercel (Root Directory `web`) | Render (`render.yaml`) | Neon |

Cada merge a `main` publica de nuevo la web y el backend. Los detalles están en
[publicar.md](publicar.md).
