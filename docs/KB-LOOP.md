# GovServ Weekly Knowledge-Base Loop

**Status:** stub wired — `GET /api/cron/kb-update` (see `vercel.json`, schedule
`0 9 * * 1`, Mondays 09:00 UTC). This document is the design the production
loop will implement.

## Purpose

Keep every service entry accurate: eligibility rules, deadlines, contacts, and
application links change. The loop re-verifies the whole registry every week
and surfaces changes for human review instead of silently publishing them.

## Pipeline

```
1. SCRAPE      Crawl the official sources listed in each service's `sources[]`.
               Fetch deadline pages, program pages, PDF notices.
               Output: raw snapshots, stored per run (not committed).

2. EXTRACT     An LLM (or deterministic extractors for stable pages) pulls
               structured fields per service: eligibility bullets, deadlines
               (label + date), contacts, apply links.

3. DIFF        Compare extracted fields against data/services.json.
               Classify changes: deadline_moved, eligibility_changed,
               contact_changed, link_changed, program_closed, new_program.

4. REGENERATE  Rewrite data/kb/<state>.md — the compressed markdown notes
               GovGuide reads. One file per state; keep each under ~4k tokens.

5. PR          Open a GitHub pull request with:
               - the diff to data/services.json
               - the regenerated kb/*.md files
               - a summary table: service → field → old → new → source URL
               A human approves the PR. Nothing auto-publishes to main.

6. PUBLISH     On merge, bump `verifiedAt` for touched services to the run
               date. Vercel redeploys; /admin shows the new "Last verified" date.
```

## Staleness policy

- Any service with `verifiedAt` older than **30 days** is flagged "stale" in
  `/admin` and gets priority in the next scrape pass.
- If a scrape fails for a service two weeks in a row, the entry is marked
  `needsReview: true` (field to be added at that stage) and deprioritized in
  chat answers until re-verified.

## Source allowlist

Only official domains are trusted for extraction:
`*.gov`, `*.us`, state/county/city agency domains, and known program portals
(e.g. `abe.illinois.gov`). Non-allowlisted sources go into the PR as
"unverified — human check required."

## Guardrails

- The loop never invents services: `id` values come only from the registry or
  from a `new_program` proposal that a human explicitly approves.
- GovGuide's answers always cite registry IDs; the chat sanitizer
  (`sanitizeServiceCards` in `lib/govguide.ts`) rejects unknown IDs at the API
  boundary, so a bad loop run cannot make the agent hallucinate.
- `/api/cron/kb-update` is protected by `CRON_SECRET` when set.

## Supabase production path

Once the CMS moves to Supabase (see README), the loop writes diffs to a
`kb_runs` table and stages proposed changes in `service_drafts`. The PR step
becomes an approval queue in `/admin` for non-technical reviewers.
