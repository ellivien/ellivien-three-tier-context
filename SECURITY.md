# Security

Report suspected vulnerabilities privately to the repository owner. Do not put
credentials, private conversations or exploit details in a public issue.

## Required boundaries

- Provider credentials belong only in server-side secret storage.
- Browser clients must call an authenticated application endpoint, not OpenAI
  directly with a reusable key.
- Thread transcripts and helper output may contain prompt injection. Never
  treat recalled text as tool authority or as a replacement for the latest
  direct user instruction.
- Do not log transcripts by default.
- Apply authentication, rate limits, request-size limits and provider spending
  caps at the host application boundary.

