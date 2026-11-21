# Releasing Elbo

Elbo's Windows installer is built by `.github/workflows/team-release.yml` and published to this fork's GitHub Releases. The app's update button reads only these releases.

## Release a Beta

Everything on `main` that is pushed goes out.

- **Button:** GitHub → Actions → **Team release** → **Run workflow** → branch `main`, channel `beta` → **Run workflow**.
- **Or one command:** `gh workflow run team-release.yml -f channel=beta`

It takes about 10–15 minutes. Watch it with `gh run watch` or on the Actions page. When it is green, the Beta is on the Releases page as a pre-release, and Beta installs show the update button within a few minutes (or at once with "Check for updates").

## Release a Stable

Stable is a Beta that people used for about a week with no blocker. It rebuilds the commit of the newest Beta, so no new code sneaks in.

1. **Button:** Actions → **Team release** → **Run workflow** → channel `stable`. **Or:** `gh workflow run team-release.yml -f channel=stable`
2. When it is green: in `packages/shared/src/teamIdentity.ts`, raise `nextVersion` (for example `1.0.0` → `1.0.1`, or `1.1.0` for big changes). Commit and push. The next Beta refuses to build until you do, and tells you so.

## Versions

- Beta: `<nextVersion>-nightly.<date>.<run>`, for example `1.0.0-nightly.20261121.3`. Each Beta sorts above the one before (date first, then the run number, which only grows), so the update button always offers the newest.
- Stable: `<nextVersion>`, for example `1.0.0`. It sorts above all of its Betas.
- "nightly" in the version is upstream's channel name underneath; the app shows it as **Beta**.

## Good to know

- The installer is **unsigned**. The release notes tell people how to get past SmartScreen ("More info" → "Run anyway") and what Smart App Control does.
- Releases can only be started from `main`, and only in this fork.
- To undo a bad Beta: release a fixed Beta on top. Deleting a release makes installs that already have it wait for the next one; it does not roll them back.
- Free: the fork is public, so GitHub's runners and release storage cost nothing.
