## Voice Translator

Modern Next.js 15 application that streams microphone audio to OpenAI’s Realtime APIs, persists translation history in Neon Postgres (serverless on Vercel), and surfaces live transcripts + translations in a simple UI.

## Requirements

- Node.js 18.18+ (tested on 22.12)
- npm 10+
- OpenAI API access with Realtime + GPT-4o-mini models enabled
- Neon Postgres database (Vercel integration recommended) for session storage

## Environment Variables

Copy `env.example` to `.env.local` and populate the values:

```bash
cp env.example .env.local
```

| Variable | Description |
| --- | --- |
| `OPENAI_API_KEY` | OpenAI API key with realtime + responses rights |
| `DATABASE_URL` | Neon Postgres connection string (with `sslmode=require`) |

These variables must be configured in Vercel → Project Settings → Environment Variables for Production, Preview, and Development.

## Local Development

Install dependencies and run the dev server:

```bash
npm install
npm run dev
```

Visit `http://localhost:3000`, select source/target languages, allow microphone access, and start recording.

Run the usual project checks before pushing:

```bash
npm run lint
npm run build
```

## Database Setup

1. Provision a Neon Postgres database (you can create it directly from Vercel → Storage → Postgres or at [https://neon.tech](https://neon.tech)).
2. Copy the connection string (`postgres://...`) and place it in `.env.local` as `DATABASE_URL`.
3. Run the schema to create the sessions table:

```bash
psql "$DATABASE_URL" -f docs/neon-schema.sql
```

## Deployment (Vercel)

1. **Create / link project**  
   - Push code to GitHub/GitLab/Bitbucket.  
   - Import the repository from the Vercel dashboard (framework auto-detects as Next.js).

2. **Provision Neon Postgres**  
   - Dashboard → Storage → Postgres → “Create Database”.  
   - Copy the connection string (`DATABASE_URL`) and run the schema above.

3. **Add environment variables**  
   - `OPENAI_API_KEY`, `DATABASE_URL` (all environments).

4. **Deploy**  
   - Trigger a production deploy from Vercel dashboard or run `vercel --prod`.
   - Verify the deployment URL loads, microphone permissions work, and `/api` routes respond.

## Troubleshooting

- Re-run `npm run build` locally to reproduce build issues before deploying.
- Inspect function logs via Vercel dashboard for API errors (KV/OPENAI misconfig).
- Ensure the browser has granted microphone access; otherwise speech events never reach OpenAI.
