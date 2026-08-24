# Architecture — where things run, where the agent sits

## Roles (not machines)

| Role | Duty | Qualities |
|---|---|---|
| **Authority (the home)** | store, log, index, ingest API, listeners | boring, always-on, dedicated, Linux, immune to reshuffles |
| **Bridge** | emitters into walled gardens (Apple: Photos, iMessage, Notes; runs local Whisper) | macOS as appliance firmware; allowed to flake |
| **Workers** | inference, heavy jobs (M4 Max, cloud GPUs) | attach to the home over the tailnet; disposable |
| **Clients** | phone, laptop, TUI, browser | dumb by design; render views, capture input, buffer offline |

**Capture can flake; authority cannot.** A bridge outage costs a capture gap;
the authority never loses accepted data.

Current physical mapping: authority = Linux VM (Fedora box now → dedicated
Apple-silicon box later; migration = VM image + restic restore). Bridge =
macOS on that box's metal, emitters POSTing to the VM over localhost.

## Network: two planes

- **Ingest plane — public HTTPS** on an owned domain. Caddy + Let's Encrypt,
  bearer device tokens. Append-only endpoint; worst case on token leak is
  log spam, not exfiltration. Phones must capture with zero VPN running.
  If CGNAT or hiding the home IP: a $5 relay VPS doing SNI/TCP passthrough
  (TLS still terminates at home; relay sees ciphertext; relay may buffer).
- **Control plane — tailnet.** Reads, admin, SSH, workers, agent traffic.

## The agent

The agent is a **privileged client**: same API, same grants, more scope. It
becomes the primary interface by *writing* the other interfaces — apps are
compiled intents (see VISION §1). pi is the current agent; the store must
remain fully usable without it.

### Memory tiers

| Tier | Where | Nature |
|---|---|---|
| Episodic | the log | complete, permanent, queryable |
| Semantic | rollups + entity/preference records in the store | maintained by listeners; distilled |
| Working | agent sessions (assembled context documents) | disposable; prompt caching is an optimization, never a home for facts |

A "domain agent" is an assembled markdown context + a skill, rehydratable by
any model. Sessions periodically compact **into the store** (semantic
records), not into themselves. Rule 4 of SPEC invariants governs all tiers.

### Nervous system (target shape, built incrementally)

```
sensations (streams) -> listeners (rules, small models) -> percepts
percepts -> triage (small, always-on) -> wake domain agents (frontier, on demand)
one gatekeeper owns human notifications, with a budget
```

Intent hypotheses are just derived records with confidence + basis, so
"why did it show me this" is always answerable. Corrections are events;
the loop learns from what you did next.

## UI

1. **v0: generated HTML** served from the store (phone browser / PWA). The
   agent writes and rewrites a small web app. 80% of the vision, 5% of the
   work.
2. Later: dumb native client rendering **UI documents stored as records** —
   versioned, inspectable, regenerable views (the pi dev-branch
   presentation-host + ReplicatedState shape). Three dynamism tiers:
   authored views (stable, offline-capable), parameterized views (home
   screen assembled from percepts), generative views (novel tasks, then
   promoted or discarded).

## Build order

1. **Founding docs** (this tree) + provision the authority VM: Caddy split,
   device tokens, restic → B2 from day one. `RECOVER.md` stays current.
2. **Substrate** (~500 boring lines): POST/GET events + blobs, streams on
   disk, SQLite index, rebuild-from-streams test.
3. **Emitters, payoff order**: `note` CLI/shortcut (starts the habit) →
   phone GPS → photos-R2 backfill (bucket → hashes + EXIF + records) →
   Handy transcripts → macOS bridge.
4. **Two listeners + one surface**: reverse-geocode + nightly `days/*.md`
   rollup; the daily timeline as generated HTML — notes, places, photos
   interleaved through space and time.
5. **Live in it; weekly ritual**: the agent reads the week's notes/rambles
   and proposes new skills, views, record types, prose→code promotions.

Explicitly deferred: native client, triage spine, multi-user/identity
(ATProto homework first), CRDTs, federation. Each layers on without rework —
that test decided every choice above.
