# Session Handoff — Abu Shakra Restaurant & Cafe

Last updated: 2026-06-26, Asia/Dubai

## Current state

The project is now a Git repository connected to:

`https://github.com/karimatarek87-ctrl/AS-Cost-.git`

Branch:

`main`

The first full app sync was pushed successfully:

`420b2db Initial Abu Shakra costing app sync`

## What changed most recently

- Created project memory system:
  - `PROJECT_CONTEXT.md`
  - `SESSION_HANDOFF.md`
  - `sessions/README.md`
  - dated session notes in `sessions/`
- Updated `AGENTS.md` so the agent checks GitHub first, reads project context when asked, and updates handoff files before ending meaningful sessions.
- Added the user's Git preference: routine Git sync/publish commands may be used without repeated confirmation, but destructive/history-changing Git commands must still ask first.

## Next likely work

Continue adding recipes one meal at a time.

Recommended next step:

1. Ask the user which meal to cost next.
2. Confirm ingredients, unit quantities, waste, labour, expenses, and production quantity.
3. Update `imported-menu.js`.
4. Validate the meal cost.
5. Commit and push.
6. Update this handoff file before ending.

## Things to remember

- The user wants a non-technical, practical restaurant costing system.
- Do not invent recipe quantities.
- Pending recipes should remain pending until confirmed.
- Keep formulas in `calculations.js`.
- Use GitHub sync at the start and end of work.
- Routine Git commands are approved by user preference; still ask before destructive Git operations.
- GitHub currently reports the repo as `public`; the user expected private.

## Latest verified costing example

`Shish Tawouk [Plate]`

- Unit cost: AED 12.9423
- Selling price: AED 50.0000
- Profit per plate: AED 37.0577
- Margin: 74.1153%
