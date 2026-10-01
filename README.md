# Polstat

Polish-first public guide to the **central state budget**. The site also displays State Treasury debt and the NBP reference rate as separate context. It uses official Ministry of Finance and NBP publications and keeps source links with every record.

## Run locally

Requires Node 24 and Python 3.12+.

```sh
npm ci
python -m pip install openpyxl==3.1.5
python scripts/refresh_data.py
npm test
npm run dev
```

The repository includes a validated data snapshot, so the UI can also be built without a new import. `npm run build` checks TypeScript and creates `dist/`.

## Data

`scripts/refresh_data.py` reads the latest operational monthly workbook for each year from 2018, the Ministry's State Treasury debt time series and the NBP rate-change XML. It rejects gaps and budget identities that fail. A small difference between a published spending total and its seven category rows is retained as `sourceDifference` rather than hidden.

- `src/data/snapshot.json`: versioned, validated records consumed by the site and chat.
- `public/data/budzet.csv`: cumulative budget values and categories, mln zł.
- `public/data/budzet-miesiecznie.csv`: monthly changes calculated within each year, mln zł.
- Other files in `public/data/`: debt and rate series.

Every figure has its period, unit, source URL, publication date when available, and status. The debt spreadsheet and NBP archive do not expose a reliable per-record publication date; those entries use `null`. A local `.context/source-cache/` speeds repeat imports and is not published.

The GitHub workflow checks sources each day. It publishes changed files only after import, tests and build pass. Vercel can deploy `main` automatically through its Git integration. A failed workflow leaves the prior Vercel deployment intact.

## Chat setup

The public figures work without the following services. To enable `/api/chat` on Vercel:

1. Create a Cloudflare Workers AI account and API token with Workers AI permission. Use model `@cf/zai-org/glm-4.7-flash` on the free allocation.
2. Create a Cloudflare Turnstile widget for the Vercel hostname.
3. Create a Supabase project and run [chat_quota.sql](supabase/chat_quota.sql) once in the SQL editor. Use a **secret** API key only in Vercel server environment variables. The table stores daily salted IP hashes and counts, never questions or raw IPs. The function permits 10 requests per visitor and 100 globally each UTC day.
4. Add the variables in `.env.example` to Vercel. `VITE_TURNSTILE_SITE_KEY` is public; all other secrets remain server-only. `RATE_LIMIT_SECRET` should be a long random string. `PUBLIC_HOSTNAME` is the Vercel hostname without `https://`.

The chat returns 503 when required configuration or an upstream service is unavailable. The static data site remains available. Cloudflare's free allocation also has its own daily limit; exhaustion returns a clear message.

## Deployment

Create a Vercel project from the GitHub repository using Vite defaults: build command `npm run build`, output directory `dist`. Vercel serves `/api/chat` as a Function and rewrites `/metodologia` to the app entry point. Enable the GitHub Actions workflow's `contents: write` permission so a passing scheduled refresh can update `main`.

No secrets belong in this repository. The site does not store chat messages.
