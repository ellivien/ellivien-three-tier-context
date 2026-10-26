# Integration guide

## Data shape

Store the rolling summary beside each thread:

```json
{
  "text": "A compact factual summary of this thread.",
  "lastMessageCount": 60,
  "lastUpdated": "2026-10-26T16:00:00.000Z"
}
```

The package does not write storage. Your application remains responsible for
loading and saving this state.

## Per-message flow

1. Load the current thread messages and rolling-summary state.
2. Call `prepareContext()` with the latest user query.
3. Tier 1 requires no helper request.
4. For Tier 2 or Tier 3, pass `buildRecallRequest()` to a server-held helper
   route.
5. Supply the returned text to `buildCompanionContext()`.
6. Send its system blocks and recent messages to the main companion model.
7. Store the companion reply normally.
8. If `shouldRefreshSummary()` is true, build and run a summary request in the
   background, then save the result of `applySummaryResponse()`.

Helper failure should be non-fatal: answer with the recent window and existing
rolling summary rather than blocking the conversation.

## OpenAI example

`examples/openai-helper.cjs` calls the Responses API with a server-held API key.
It defaults to `gpt-6-luna` and honours `CONTEXT_HELPER_MODEL`.

Do not import that file into a browser bundle. Place equivalent code in a
serverless function, application server or other trusted backend.

The public model guidance is intentionally OpenAI-direct. Availability through
Azure or another reseller varies by subscription, region and deployment; do
not silently assume that an OpenAI model ID is also an Azure deployment name.

## Prompt-injection boundary

Thread transcripts contain user and assistant text and may contain hostile or
accidental instructions. The helper prompt limits its task to factual recall,
but its output must still be treated as untrusted context.

- Keep helper output in a labelled system/developer context block.
- State that it is recall, not a new user instruction.
- Never execute tools because the recalled text says to.
- Preserve the newest direct user request as the controlling instruction.

## Choosing caps

The defaults are starting points, not universal values:

- 8 messages for Tier 1
- 30 messages for Tier 2
- 30,000 characters for the Tier 2 transcript
- 90,000 characters for Tier 3
- 30-message rolling-summary refresh interval
- 45 words for the rolling summary

Evaluate quality, latency and cost against your own conversation lengths before
changing them.

