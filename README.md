# GovServ — Your portal to government services

The largest database of agencies and services in the US. GovServ pairs a
searchable service directory with **GovGuide**, an AI agent that matches people
to the benefits they qualify for, plus an application dashboard with deadline
tracking.

**Live city:** Chicago (city + Cook County + Illinois statewide) · **Roadmap:** Illinois → 50 states.

## Architecture

```
govserv/
├── app/
│   ├── page.tsx                  Marketing landing (hero + search, how it works,
│   │                             features, Chicago-first roadmap, FAQ, partner CTA)
│   ├── services/page.tsx         Directory: search + category/level filters + cards
│   ├── services/[id]/page.tsx    Detail: eligibility, deadlines, prerequisites,
│   │                             what-to-bring checklist, contacts, apply links
│   ├── services/[id]/ServiceClient.tsx  Save / Track / Ask-the-agent actions
│   ├── dashboard/page.tsx        Tabs: Applications · Deadlines · Saved · Tasks
│   ├── chat/page.tsx             GovGuide chat UI (threads, service cards, plans)
│   └── admin/page.tsx            Knowledge-base CMS (stats, table, add/edit form)
├── app/api/
│   ├── services/route.ts         GET  filter directory (?q, ?category, ?level, ?state)
│   ├── services/[id]/route.ts    GET  one service
│   ├── chat/route.ts             POST GovGuide agent (AI → Rostr → local engine)
│   ├── kb/route.ts               GET/POST knowledge-base CRUD (dev-writable)
│   └── cron/kb-update/route.ts   GET  weekly KB loop stub
├── lib/
│   ├── types.ts                  GovService schema + dashboard/chat types
│   ├── data.ts                   Registry loader + generic filter helpers
│   ├── govguide.ts               Local GovGuide engine (intent/keyword scoring)
│   └── store.ts                  localStorage hooks (govserv:v1, govserv:chats)
├── components/                   Navbar, Footer, ServiceCard, Markdown, FaqAccordion
├── data/
│   ├── services.json             THE REGISTRY — seed data lives here
│   └── kb/il.md                  Compressed state KB notes (one file per state)
├── docs/KB-LOOP.md               Weekly agent loop design
└── vercel.json                   Weekly cron: GET /api/cron/kb-update @ Mondays 09:00 UTC
```

## Seed data (for the integrator)

The research agent drops the verified registry at **`data/services.json`** and the
compressed notes at **`data/kb/<state>.md`** (e.g. `il.md`). Both files must
conform to the schema in `lib/types.ts` (`GovService`). All code is generic —
no service IDs are hard-coded anywhere in UI or API logic.

Current launch seed: 8 sample Chicago/Illinois services (`snap-il`, `era-chicago`,
`liheap-il`, `medicaid-il`, `wic-il`, `ides-ui`, `cta-reduced-fare`, `legal-aid-cook`).

## Env vars

| Var | Required | Default | Purpose |
|---|---|---|---|
| `AI_API_KEY` | no | — | Enables the OpenAI-compatible path in `/api/chat` |
| `AI_API_BASE_URL` | no | `https://api.openai.com/v1` | Chat-completions endpoint |
| `AI_MODEL` | no | `gpt-4o-mini` | Model for the AI path |
| `ROSTR_API_URL` | no | `https://rostr-platform.vercel.app` | Rostr v1 chat fallback (best effort) |
| `NEXT_PUBLIC_READONLY` | no | `false` | `true` → admin CMS + `/api/kb` POST become read-only |
| `READONLY` | no | `false` | Server-side mirror of the above |
| `CRON_SECRET` | no | — | If set, `/api/cron/kb-update` requires `Authorization: Bearer` |

## Local dev

```bash
npm install
npm run dev        # http://localhost:3000
```

Build + production smoke test:

```bash
npm run build
npm start          # then curl the endpoints below
```

## QA smoke test

```bash
curl -s http://localhost:3000/ | grep -o "<title>[^<]*"
curl -s "http://localhost:3000/api/services?q=rent" | head -c 400
curl -s http://localhost:3000/api/services/snap-il | head -c 200
curl -s -X POST http://localhost:3000/api/chat \
  -H 'Content-Type: application/json' \
  -d '{"messages":[{"role":"user","content":"I need help paying rent"}]}'
curl -s http://localhost:3000/api/cron/kb-update
```

The `/api/chat` response must include `serviceCards` with real registry IDs and a
concrete `actionPlan`. The local engine never invents services — IDs are
validated against the registry before returning.

## Client-side persistence

- Dashboard (applications, custom deadlines, saved services, task checklists):
  `localStorage` key **`govserv:v1`**
- Chat threads: `localStorage` key **`govserv:chats`**

## KB loop

`vercel.json` schedules `GET /api/cron/kb-update` weekly (Mondays 09:00 UTC).
The current route is a documented stub; the full loop design is in
`docs/KB-LOOP.md`: scrape agency sources → diff against `data/services.json` →
regenerate `data/kb/<state>.md` → open a PR for human review.

## Supabase roadmap (production editing)

The `/admin` CMS writes to `data/services.json` via `/api/kb` POST — fine in
dev, read-only on Vercel. For production editing:

1. Create a `services` table mirroring `GovService` (JSONB is fine for nested
   fields) + a `kb_files` table for `data/kb/*.md`.
2. Flip `NEXT_PUBLIC_READONLY=true` off; point `lib/data.ts` at Supabase
   (server-side reads with the service-role key, RLS on writes).
3. The weekly loop writes diffs to Supabase and regenerates the markdown from
   the table; `/api/kb` GET serves from Supabase when `SUPABASE_URL` is set.

## Deployment (Vercel)

```bash
npx -y vercel@latest --token "$VERCEL_TOKEN" --scope <team>
```

Set env vars in the project dashboard (never commit `.env.local`).
