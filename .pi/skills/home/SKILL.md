---
name: home
description: Work on stuffed-burrito (the personal data home). Use when reading, designing, or writing code, docs, emitters, listeners, views, or skills in this repository, or when ingesting ideas/rambles into the project.
---

# The home — how to work here

## Read first (in order, once per session if unfamiliar)

1. `docs/VISION.md` — theses; the why
2. `docs/SPEC.md` — the v0 data contract (this is the product)
3. `docs/ARCHITECTURE.md` — roles, planes, agent placement, build order

## Invariants you must never violate

- Truth = streams + blobs as plain files. SQLite index and `views/` are
  regenerable; code that makes them load-bearing is a bug.
- Append-only, single writer per source. Corrections and enrichment are new
  `derived.*` records referencing their subject — never mutations.
- Every record: `ts` (occurred) + `recorded_at` (ingested) + `source` + type
  namespace per SPEC. Provenance is total.
- Facts worth keeping get written to the store as records or rollups — never
  left only in a conversation, cache, or context window.
- The store must remain usable without pi. Prefer boring, greppable formats.

## Division of labor

Substrate (ingest, blobs, index, tokens, backups) is small typed code with
tests — especially the rebuild-from-streams test. Everything above substrate
(rollup formats, views, assembly recipes, intent policy) starts as prose/skills
and is promoted to code only when stable. When in doubt, write prose.

## Conventions

- New record types: propose in `docs/SPEC.md` first (add a row + payload
  shape), then emit. Unknown types must still index by envelope.
- Listeners: own `source` (`listener-<name>`), cursor in `cursors` table,
  idempotent (same input -> same derived record id).
- User rambles/ideas arriving in conversation: capture as `note` records
  (tags: `idea`) once ingest exists; until then append to `docs/notes/`.
  The weekly ritual reads these and proposes skills/views/promotions.
- Keep `docs/RECOVER.md` current with every infra change; it is the spec's
  executable form.
