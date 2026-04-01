# ACQUIRE — THE MERGER TYCOONS

Online multiplayer implementation of the classic **Acquire** board game: hotel
chains, mergers, stocks, and turn-based strategy in the browser.

**Stack:** [Deno](https://deno.com/) · [Hono](https://hono.dev/) · TypeScript

---

## Quick links

| Resource | Link |
| -------- | ---- |
| Play (hosted) | [acquire-dev.onrender.com](https://acquire-dev.onrender.com) |
| Rules (wiki) | [How to play](https://github.com/step-batch-10/acquire-merger-tycoons/wiki/How-to-play) |
| Flow charts | [Wiki — Flow charts](https://github.com/step-batch-10/acquire-merger-tycoons/wiki/Flow-charts) |
| Mockups | [Wiki — Mock-ups](https://github.com/step-batch-10/acquire-merger-tycoons/wiki/Mock-Ups) |
| Data models | [Wiki — Models](https://github.com/step-batch-10/acquire-merger-tycoons/wiki/Models) |
| Project board | [GitHub Project](https://github.com/orgs/step-batch-10/projects/8) |

---

## Project description

This project was built during a software internship. Players join a lobby,
receive tiles and cash, found and grow hotel chains, trade stock, and resolve
mergers. Game logic lives in typed models; the server uses Hono for HTTP,
sessions, and routing over static UI assets.

---

## Repository layout

| Path | Purpose |
| ---- | ------- |
| `src/` | Application entry (`app.ts`), handlers, game models |
| `test/` | Deno tests (models, handlers, integration-style routes) |
| `public/` | Static HTML/CSS/JS for login, lobby, and game UI |
| `docs/` | HTML slide deck (open locally or publish with [GitHub Pages](https://pages.github.com/) from `/docs`) |
| `hooks/` | Optional Git hooks (format, lint, tests, coverage) — see [Development](#development) |

---

## Prerequisites

- [Deno](https://docs.deno.com/runtime/getting_started/installation) 2.x
- Git

Optional: [deployctl](https://docs.deno.com/deploy/manual/deployctl/) for manual
Deno Deploy uploads (CI already deploys on `main`).

---

## Getting started

```bash
git clone https://github.com/step-batch-10/acquire-merger-tycoons.git
cd acquire-merger-tycoons
deno install          # npm deps (e.g. Hono, lodash) for type-checking and runtime
deno task start       # dev server with watch — serves the app (see main.ts)
```

The dev server uses `deno run -A --watch main.ts`. Adjust host/port in code if
needed for your environment.

---

## Development

Common tasks (see `deno.json` → `"tasks"`):

| Task | Command | Description |
| ---- | ------- | ----------- |
| Run app (watch) | `deno task start` | Local development server |
| Test | `deno task test` | All tests, full permissions |
| Test (watch) | `deno task test-watch` | Re-run tests on change |
| Lint | `deno task lint` | Deno linter |
| Format | `deno task fmt` | Format with project settings |
| Coverage report | `deno task test-coverage` | Tests + `coverage/` output |
| Coverage gate | `deno task coverage` | Runs tests with coverage, then 100% line/function/branch check |
| Full dev check | `deno task dev-check` | Lint, format, and coverage gate |

### Git hooks

Scripts in `hooks/` describe a **pre-commit** (format → lint → test) and
**pre-push** (coverage + full test) flow. Wire them if your team uses them, for
example:

```bash
ln -sf ../../hooks/pre-commit .git/hooks/pre-commit
ln -sf ../../hooks/pre-push .git/hooks/pre-push
```

---

## Testing

Tests live under `test/` and mirror `src/` (e.g. `test/game_test.ts`,
`test/game_handler_test.ts`). Run:

```bash
deno task test
```

For coverage HTML and `lcov` under `coverage/`:

```bash
deno task test-coverage
```

CI (`.github/workflows/deno.yml`) runs `deno lint`, `deno test -A --coverage`,
and the same coverage checker as `deno task coverage` on pushes to `main`,
then deploys to Deno Deploy when tests pass.

---

## Documentation

- **Wiki** (rules, diagrams, models): links in [Quick links](#quick-links) above.
- **Slide deck**: static HTML in `docs/` — open `docs/index.html` in a browser
  from a clone, [Slide deck](https://step-batch-10.github.io/acquire-merger-tycoons/)

---