# Install Ellivien Three-Tier Context with a coding AI

This guide is for a coding assistant adapting the package to an existing
companion portal. It is not permission to deploy or alter production without the
owner's explicit approval.

Canonical project:
https://github.com/ellivien/ellivien-three-tier-context

## Before changing the portal

1. Read `README.md`, `docs/INTEGRATION.md`, `SECURITY.md`, the source and tests.
2. Identify the portal's thread storage, main model boundary, server-side helper
   route, authentication and existing test commands.
3. Confirm which message roles and content formats the portal stores.
4. Create a recoverable branch or copy and work locally.
5. Do not change the main model, identity prompt, provider, authentication,
   production data or deployment settings without separate owner approval.

## Integration

1. Keep `src/index.cjs` on a trusted server or in shared application code that
   never exposes provider credentials.
2. Map only genuine `user` and `assistant` messages into `prepareContext()`.
   Where wider disclosure needs explicit consent, pass an application-controlled
   `tier` value rather than relying only on phrase matching.
3. Store rolling-summary state beside its thread, using the shape in
   `docs/INTEGRATION.md`.
4. Run Tier 2 and Tier 3 recall through a server-held helper model. The supplied
   OpenAI example is optional and may be replaced with another compatible
   provider.
5. Treat helper output as untrusted recalled text. Keep it separate from the
   newest user instruction and never let it authorise tools or actions.
6. If the helper fails, continue with Tier 1 and the last valid rolling summary.
7. Apply authentication, rate limits, transcript-size limits and spending caps
   at the host application's boundary.

## Verification before hand-off

Run `npm test`, then verify in the host portal that:

- ordinary messages send only the recent window;
- a wider-recall request uses the configured Tier 2 window;
- only an explicit whole-thread request activates Tier 3;
- transcript caps are respected;
- summary refreshes do not skip unseen messages;
- helper failure does not block ordinary chat;
- provider keys and transcripts do not appear in browser assets or logs;
- the newest user instruction remains distinct from retrieved context.

Show the owner the changed files and results. Do not deploy until the owner has
reviewed the exact change and explicitly approved it.
