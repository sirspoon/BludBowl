# BludBowl

A Blood Bowl game in a single file, `index.html`, hosted on GitHub Pages at
https://sirspoon.github.io/BludBowl/ (served from `main`).

## Workflow
- Commit and push straight to `main` — no feature branches or pull requests.
  The owner tests changes on the live site, which updates a minute or two after a push.
- Every change to the game bumps the version by 0.01 (e.g. v2.01 → v2.02).
  The version is the `#app-version` text on the title screen in `index.html`.
  Changes that don't touch the game (like this file) don't bump it.
- With each version bump, add an entry at the top of `CHANGELOG.md` (version, date, what
  changed in plain words, linking any issue it closes). Pushing tags is blocked in cloud
  sessions, so the changelog is the version history.
- When a change fixes an issue, comment on it saying which version fixed it and what changed
  (`gh api -X POST repos/sirspoon/BludBowl/issues/N/comments -f body=...`). Leave the issue
  open: the owner checks the fix on the live site and closes it themselves.
- Use the GitHub REST API (`gh api repos/sirspoon/BludBowl/...`) for issues;
  `gh issue list` and other GraphQL-based commands are blocked in cloud sessions.
