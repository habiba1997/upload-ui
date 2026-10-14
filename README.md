# E-commerce Upload UI

Admin frontend for browsing book/document collections and uploading PDFs to the AI e-commerce document service. It uses Keycloak single sign-on and calls the companion vector/document API.

**Technologies:** React 18, TypeScript, Vite, Tailwind CSS, Supabase client, and Keycloak JS.

## Run locally

1. Install Node.js 18+ and run `npm install`.
2. Copy `.env.example` to `.env.local`. Set the local Keycloak URL, realm, public client ID, and backend URLs for your setup. Do not put a client secret in a browser app.
3. Start the [E-commerce backend](https://github.com/habiba1997/E-commerce) and configure Keycloak. The document API defaults to port 8085; the collection query endpoint also uses the vector API.
4. Run `npm run dev` and open the URL printed by Vite (usually http://localhost:5173).

`npm run build` creates the production bundle; `npm run typecheck` checks TypeScript. This app is part of the same system as [Chat-nextjs-ui](https://github.com/habiba1997/Chat-nextjs-ui), but is maintained as its own frontend repository. Local `.env` values and generated `dist/` output are excluded.
