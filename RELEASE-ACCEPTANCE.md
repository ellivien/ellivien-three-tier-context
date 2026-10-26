# Release acceptance

Do not make the repository public or create a release until every item passes.

- [ ] `npm test` passes from a clean checkout.
- [ ] `npm run package:release -- v0.1.0` succeeds.
- [ ] The ZIP checksum verifies from inside `release/`.
- [ ] The ZIP contains only the intended public files.
- [ ] No private names, conversations, local paths, credentials or `.DS_Store`
      files appear in the source or archive.
- [ ] The OpenAI example keeps its API key server-side.
- [ ] Public docs describe the project as self-supported and adaptable.
- [ ] The owner has reviewed and explicitly approved publication.

