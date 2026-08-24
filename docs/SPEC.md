# SPEC v0 — the data contract

This document is the product. Everything else (agents, apps, views, providers)
is replaceable as long as this contract holds. Version: `0` (pre-stability;
evolve by adding, never by mutating history).

## Three layers

```
Layer 3: VIEWS/NAMES   folder trees, albums, tags, rollups — materialized, regenerable
Layer 2: RECORDS/LOG   append-only event streams; SQLite index
Layer 1: BLOBS (CAS)   immutable bytes by hash; local and/or remote tiers
```

Truth lives in layers 1–2 as plain files. Layer 3 and the SQLite index are
derived and may be deleted at any time without loss.

## Layer 1 — blobs

- Identity: `sha256:<hex>` of the bytes.
- On disk: `blobs/<hh>/<hash>` where `<hh>` is the first two hex chars.
- Immutable. Never edited, only added. Deletion is an explicit, logged act.
- **Location is a property, not an architecture** (git-annex pattern): a blob
  may exist locally, in R2/S3, or both, tracked in `blob_locations`. Large
  originals may be remote-only; their proxy bundles (below) are always local.

## Layer 2 — records

### Envelope

One JSON object per line, in per-source append-only streams:
`streams/<source>/<YYYY-MM>.jsonl`

```json
{
  "id": "01J5X0M9Z8...",          // ULID (sortable, unique)
  "ts": 1756000000000,            // ms epoch — when it HAPPENED
  "recorded_at": 1756000012345,   // ms epoch — when the home accepted it
  "source": "phone-cj",           // stream id; exactly one writer per source
  "seq": 4812,                    // per-source monotonic sequence
  "type": "note",                 // dotted namespace, see below
  "payload": { },                 // type-specific, strict JSON
  "refs": [ {"kind":"blob","id":"sha256:..."},
            {"kind":"event","id":"01J5..."} ]   // optional
}
```

Rules:

- **Single writer per source.** Devices/emitters never share a stream, so
  merging streams from N devices is a union — conflict-free by construction.
  Offline devices buffer locally and upload later ("a queue, not sync").
- **Append-only.** Corrections and derived data are new records referencing
  old ones. History is never rewritten.
- **Provenance is implicit and total**: every record's writer is known from
  `source` + the grant that authenticated the append (logged server-side).
- `ts` is occurrence time (EXIF taken-at, GPS fix time), `recorded_at` is
  ingest time. Both always present.

### Core types (v0)

| type | payload |
|---|---|
| `note` | `{ text, tags? }` |
| `sense.location` | `{ lat, lon, acc?, speed? }` |
| `media.photo` | `{ blob, w, h, gps?, device? }` (EXIF extract; `ts` = taken-at) |
| `media.audio` | `{ blob, duration_s, device? }` |
| `derived.transcript` | `{ of, text, segments?[{t0,t1,text}], model }` |
| `derived.caption` | `{ of, text, model }` |
| `derived.place` | `{ of, lat, lon, place }` (reverse geocode) |
| `derived.thumb` | `{ of, blob, w, h }` |
| `name` | `{ path, target, view }` (see Layer 3) |

`of`/`target` are a blob hash or event id. Derived records are appended by
listeners, never merged into originals. The index materializes a "current
view" per subject by folding derived records over it.

Namespaces: `sense.*` (sensations), `derived.*` (percepts/enrichment),
`media.*`, `name`, `note`, `agent.*` (agent actions — agents emit events
too), `app.<name>.*` (third-party). Unknown types must be stored and indexed
by envelope fields regardless — the agent is the universal consumer.

### Proxy bundles

For every media blob, enough must be local to browse and reason without
fetching the original: taken-at, GPS + place name, a thumbnail (few KB),
caption, OCR text. This is the agent's fovea; originals are fetched on
demand. Embeddings are derived, regenerable, and never precious.

## SQLite index (regenerable)

```sql
CREATE TABLE events (
  id TEXT PRIMARY KEY, ts INTEGER NOT NULL, recorded_at INTEGER NOT NULL,
  source TEXT NOT NULL, seq INTEGER NOT NULL, type TEXT NOT NULL,
  payload TEXT NOT NULL, UNIQUE (source, seq));
CREATE INDEX events_ts ON events(ts);
CREATE INDEX events_type_ts ON events(type, ts);

CREATE TABLE refs (event_id TEXT, kind TEXT, target TEXT);
CREATE INDEX refs_target ON refs(target);

CREATE TABLE blobs (hash TEXT PRIMARY KEY, size INTEGER, mime TEXT, created INTEGER);
CREATE TABLE blob_locations (hash TEXT, tier TEXT, ref TEXT,
  verified_at INTEGER, PRIMARY KEY (hash, tier));  -- tier: local | r2 | ...

CREATE TABLE grants (token_hash TEXT PRIMARY KEY, device TEXT,
  scopes TEXT, created INTEGER, revoked_at INTEGER);
CREATE TABLE cursors (listener TEXT PRIMARY KEY, last_event_id TEXT);
```

Deleting the index and rebuilding from streams + blobs must always work.
That property is tested, not assumed.

## HTTP API (v0)

Bearer token per device/emitter (a primitive grant: scoped, revocable,
logged). Ingest plane may be public HTTPS; read/control plane private.

```
POST /v0/events        append batch of envelopes (server sets recorded_at,
                       enforces source ownership + seq monotonicity)
POST /v0/blobs         raw bytes -> { hash } (idempotent by content)
GET  /v0/blobs/:hash   bytes (from best available tier)
GET  /v0/events?since_id=&type=&source=&limit=   cursor reads
```

Grant scopes v0 (coarse on purpose): `append:<source>`, `read:*`,
`read:<type-prefix>`. The shape (grants + audit) matters now; granularity
can come later. Semi-trusted third parties get **mediated queries** (ask the
agent, which answers under its own grants) before they ever get raw reads.

## Layer 3 — names and views

**Names are data, not structure** (the Git lesson: humans live happily on a
CAS when the naming layer is materialized).

- A `name` record binds a human path to a target within a named `view`:
  `{ path: "Photos/2026/08 Taipei/beach.jpg", target: "sha256:...", view: "by-place" }`
- A renderer materializes each view as a real tree of hardlinks/symlinks
  under `views/<view>/`. Humans get Finder/grep/rsync; the agent-failure
  case is plain navigable files.
- Multiple organizations coexist (by-date, by-album, by-tag) because names
  are cheap rows; "organizing" never moves bytes and is always undoable.

### Rollups (memory hierarchy)

Listeners maintain `views/rollups/days/YYYY-MM-DD.md`, then `weeks/`,
`months/` — each level summarizes the one below and **links down** (record
ids, view paths) so any agent can zoom from "surf trip to Kenting" to the
212 photos and 3 notes behind it. Nightly consolidation is a cron job.
Start with `days/` only; add levels when use demands them.

## Listeners

A listener = cursor over the log + a filter + a job that appends derived
records under its own `source` (e.g. `listener-geocode`). Failures re-run
idempotently (same input → same derived record id). v0 trigger is polling
the cursor; push can come later. Burrito v1's senses pipeline steps
(geocode, transcribe, caption, thumbnail) become listeners here.

## Invariants (the short list everything must preserve)

1. Streams and blobs are plain files; truth is never only in a database.
2. Append-only; single writer per source; provenance total.
3. Index and views are regenerable; deleting them loses nothing.
4. Anything worth remembering is written to the store — never only held in
   a context window, a cache, or a model.
5. The store is readable without any particular agent, app, or company.
