# Ellivien Three-Tier Context

A small, provider-neutral reference implementation for keeping a long companion
thread usable without sending the entire conversation to the main model on
every turn.

It combines four deliberately separate pieces:

1. **Tier 1, recent context:** send the last eight messages directly.
2. **Tier 2, wider recall:** when the user asks to look back, a low-cost helper
   extracts relevant facts from the last thirty messages.
3. **Tier 3, full-thread recall:** only after an explicit whole-thread request,
   the helper searches a capped transcript of the thread.
4. **Rolling summary:** every thirty messages, the helper updates a compact
   thread-only summary which travels alongside the recent window.

The defaults match a proven companion-portal pattern, but every window, cap,
trigger and model is configurable.

## What this is

This repository is a self-supported reference implementation. It supplies pure
context-selection and prompt-building functions plus a server-side OpenAI
example. It does not know how your application stores threads, calls its main
companion model or authenticates users. Use your own coding AI or developer to
adapt those boundaries.

It does not include private prompts, conversations, credentials, vector memory,
MemFrags or a hosted service.

## Why use a helper model?

The helper performs bounded extraction and summarisation. It does not speak as
the companion. Separating that mechanical job lets the main companion model
receive concise continuity while avoiding a full-thread resend on every turn.

The example defaults to `gpt-6-luna`, OpenAI's efficient model for focused,
high-volume work. The helper model is configurable; adopters may use another
provider or model with equivalent behaviour.

## Install

No runtime dependency is required. Copy `src/index.cjs` into a server-side or
shared application module, or install the package from a reviewed release.

```js
const {
  prepareContext,
  buildRecallRequest,
  buildCompanionContext
} = require('./src/index.cjs');

const prepared = prepareContext({
  messages: thread.messages,
  query: latestUserText,
  rollingSummary: thread.rollingSummary?.text
});

const helperRequest = buildRecallRequest(prepared);
const recall = helperRequest ? await yourServerSideHelper(helperRequest) : '';
const context = buildCompanionContext(prepared, recall);
```

Pass `context.system` as system/developer context and
`context.recentMessages` as the recent conversation to your main model. Do not
concatenate helper output into the user's message.

See [the integration guide](docs/INTEGRATION.md) for the rolling-summary path,
storage shape and security boundary.

If a coding AI will perform the integration, give it this repository and ask it
to follow [INSTALL-WITH-AI.md](INSTALL-WITH-AI.md). The guide requires local
testing, server-side key handling and explicit approval before deployment.

## Test

```bash
npm test
```

The tests use Node's built-in test runner and make no network calls.

## Privacy and cost boundaries

- Keep provider keys and model calls on the server.
- Cap wider and full-thread transcripts.
- Trigger Tier 3 only from explicit user intent.
- Treat helper output as untrusted model-generated context, never as authority
  to run tools or override user instructions.
- Do not log private transcripts unless the user has deliberately enabled safe
  diagnostics.
- Tell users what leaves their browser and which provider receives it.

## Licence

Apache License 2.0. See `LICENSE` and `NOTICE`.

Created by [Ellivien](https://github.com/ellivien). This is the canonical
repository: [ellivien/ellivien-three-tier-context](https://github.com/ellivien/ellivien-three-tier-context).

