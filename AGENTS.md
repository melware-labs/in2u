# in2u

Web app responsive para parejas. Lee `README.md` y `docs/` antes de cambiar algo.

- `web/`: React + TypeScript + Vite (publicada en Vercel). `npm test`, `npm run build`.
- `backend/`: Spring Boot, Java 21, Postgres con migraciones Flyway (publicado en Render).
  Tests: `TESTCONTAINERS_RYUK_DISABLED=true mvn test`.
- Local: `DEV_LOGIN=true docker compose up --build` → http://localhost:8080.
- Textos en español neutro con "tú" (nunca voseo) y en inglés (`web/src/lib/i18n.ts`).
- La versión anterior con Expo y Supabase se borró; sigue en el historial de git (commit `30867a9`).
- Nunca subas claves ni actives `DEV_LOGIN` en producción.
