# Working on Fretboard companion

Read [docs/MAINTAINER_HANDOFF.md](docs/MAINTAINER_HANDOFF.md) before making changes. It contains architecture, behavior requirements, build/test commands, and the owner's preferences. Read README.md for user-facing setup.

- Use this repository's `mac/` source for future work; do not edit the legacy standalone HTML unless asked.
- Keep verification silent and offscreen. Do not launch/focus the live app or capture the desktop for routine review.
- Preserve earlier release artifacts before substantial changes.
- Do not start the deferred modularization without a new request.
- Inspect Git state before committing/pushing. The original local checkout may have no HEAD despite an already-published GitHub repository; see the workspace-level SESSION_HANDOFF.md if present. Preserve local files and never force-push to repair it.
- Keep the handoff current after meaningful changes. Follow current user instructions when they supersede these historical preferences.
