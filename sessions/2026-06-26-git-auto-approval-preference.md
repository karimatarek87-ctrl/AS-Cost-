# 2026-06-26 — Git Auto-Approval Preference

## Summary

The user asked to auto-allow Git commands so project syncing does not require repeated approvals.

## Agreed working rule

Routine Git commands may be used as part of normal project work:

- `git status`
- `git branch`
- `git remote`
- `git log`
- `git fetch`
- `git pull --ff-only`
- `git add`
- `git commit`
- `git push`
- `git ls-remote`

Destructive or history-changing Git commands should still ask for confirmation first:

- `git reset`
- `git clean`
- `git checkout -- <file>`
- `git restore`
- `git rebase`
- force push
- deleting branches or tags

## Reason

This keeps normal multi-device syncing fast while still protecting the user from accidental data loss.

