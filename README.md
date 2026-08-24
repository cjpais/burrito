# stuffed burrito

A home for personal data, and the agent that programs it.

This is generation 2 of [burrito](https://github.com/cjpais/burrito/tree/main)
(v1 lives on `main`). v1 was built before AI agents existed, so roughly half of
it was hand-rolled intelligence: prompt templates, NL→code generation, a JS VM,
caches. What remains to build is the part that
compounds and outlives every model: **the data substrate**.

## What this is

- A **content-addressed blob store** for photos, audio, video, files (local and/or remote tiers).
- An **append-only event log**: single-writer streams per device, everything timestamped, provenance on every record.
- A **SQLite index** over both — regenerable, disposable, never the source of truth.
- **Materialized views**: human-navigable folder trees, tags, albums, and rollups rendered *from* records — names are data, not structure.
- **Senses**: emitters (phone, Handy, photo apps, macOS bridge) that append; **listeners** that derive percepts (geocode, transcribe, caption, daily rollups).
- **Agents as clients**: pi (or anything else) reads and writes through the same API and grants as every other app. The agent is the system's programmer, not its kernel.

## Principles (see docs/VISION.md)

Data outlives models. Exit by default. Time is the join key. Capture can flake;
authority cannot. Context windows are caches; the log is the disk.

## Status

Founding documents only. Read in order:

1. [docs/VISION.md](docs/VISION.md) — why
2. [docs/SPEC.md](docs/SPEC.md) — the v0 data contract
3. [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — where things run, where the agent sits
4. [docs/RECOVER.md](docs/RECOVER.md) — the restore drill (kept honest, always current)
