# Vision

People will increasingly operate computers through agents. Most of computing
has to be rethought for that — but the piece that matters first, and compounds
longest, is **where the data lives and who it answers to**.

## Theses

1. **The agent becomes primary by writing everything else.** It is the
   system's programmer, not its kernel. Apps are compiled intents: every
   intent starts as a conversation; recurring ones get compiled into skills,
   listeners, and views. The health metric of the system is how fast a novel
   intent becomes a cheap habitual surface.

2. **Data outlives models.** The store is the source of truth; intelligence is
   rented and swappable. "My agent" = my data + my skills + whatever model I
   rent today. Nothing worth remembering may live only in a context window.

3. **Exit by default, structurally.** Files in open formats (JSONL, markdown,
   JPEG, SQLite). A continuous encrypted replica in storage the user controls,
   so leaving any provider never requires the provider's cooperation. Long
   term: identity separate from hosting (ATProto-shaped — adopt or copy
   deliberately, never invent identity). The moat is inverted on purpose: we
   compete on product because we cannot hold data hostage.

4. **Events are the primitive; time is the join key.** Notes, GPS pings,
   photos, transcripts, agent actions — all records with a timestamp, a
   source, and provenance. "The notes I took during that call" is a query,
   not a product feature. The new economics: an agent is a universal consumer,
   so half-described events are finally worth emitting.

5. **Senses → sensations → percepts.** Raw streams (audio, GPS, screen) are
   sensations. Cheap listeners distill them into percepts ("meeting started",
   "finished surfing", "arrived home"). Big models consume percepts and drill
   into sensations on demand. Reflexes before cortex.

6. **Capture can flake; authority cannot.** Capture must be frictionless
   (public HTTPS ingest, no VPN, offline buffering) or it silently stops
   happening. The authority is boring, always-on, dedicated, and immune to
   every future reshuffle of personal computing.

7. **The computer should give time back.** The agent is async-first: it works
   while you're away and hands you a digest. Push, not pull. A notification
   budget, enforced by a single gatekeeper. Success is measured in *less*
   screen time — which is why the business model can never be engagement.

8. **Events as context, not as commands.** Inbound data is untrusted input.
   Acting on it requires capability grants and verified provenance. "Why did
   my computer show me this" must always have an answer.

## What this is not (yet, or ever)

- Not a CRDT platform. Single-writer append-only streams make most sync
  conflict-free by construction; the rare mutable type (notes edited offline
  on two devices) gets an existing CRDT library later, or last-writer-wins
  with both versions kept.
- Not federation or multi-user — but identity + grants are shaped so sharing
  across homes can layer on without rework.
- Not a model host. Inference is a worker concern (local or rented), never
  part of the substrate.
- Not another silo with better branding. If this store is only readable by
  one agent or one company, the project has failed by its own definition.

## Division of labor

**Substrate = code.** Ingest, blobs, index, tokens, backups. Small, typed,
boring, trusted.

**Policy = prose.** Rollup formats, view layouts, assembly recipes, intent
rules — markdown and skills the agent follows, promoted to code only when
stable. Code the contracts; prose the policies.
