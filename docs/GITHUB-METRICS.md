# GitHub release and metrics evidence

This project uses GitHub's aggregate repository evidence without adding
analytics, cookies or telemetry to companion portals.

## One-time setup

1. Create a fine-grained personal access token.
2. Limit it to `ellivien-three-tier-context` only.
3. Grant **Administration: Read-only** and **Contents: Read-only**, with no
   write permissions.
4. Add it under **Settings → Secrets and variables → Actions** as a repository
   secret named `CONTEXT_TRAFFIC_TOKEN`.
5. After the workflow is present, run **Preserve GitHub metrics** once and
   confirm that a JSON file appears under `metrics/snapshots/`.

Administration read is required for GitHub's rolling traffic endpoints.
Contents read permits release and asset download records while the repository
is private. The workflow's separate short-lived `GITHUB_TOKEN` writes only the
aggregate snapshot.

Automatic Sunday preservation now lives in
[`ellivien-open-source-evidence`](https://github.com/ellivien/ellivien-open-source-evidence),
which discovers current and future public repositories account-wide. This
repository-specific workflow remains available as a manual fallback. Snapshots
record GitHub's rolling 14-day views, visitors, clones and cloners plus release
downloads, without visitor identities.

Each snapshot keeps per-asset counts and a `releasePackageDownloadTotal` that
sums only named `.zip` packages. The separate `releaseAssetDownloadTotal`
includes checksum-file downloads and must not be described as package downloads.

## Release

After `RELEASE-ACCEPTANCE.md` passes, create and push a tag matching
`package.json`, initially `v0.1.0`. The release workflow tests the package,
builds `ellivien-three-tier-context-v0.1.0.zip` and its SHA-256 file, then
creates the GitHub release.

Direct users to the named ZIP. GitHub counts named release-asset downloads;
its automatic source archives do not expose the same cumulative count.

