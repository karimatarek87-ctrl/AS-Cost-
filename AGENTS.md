# Abu Shakra Restaurant & Cafe App Instructions

This project is the Abu Shakra restaurant costing portal and related local apps.

## Git safety rule for every new work session

Before changing files, always check and sync the repository state:

1. Check the current branch and local changes:
   - `git status -sb`
   - `git branch --show-current`
2. Check the remote:
   - `git remote -v`
3. Fetch the latest GitHub state:
   - `git fetch origin`
4. Compare local work with `origin/main`:
   - `git status -sb`
   - `git log --oneline --decorate --graph --max-count=10 --all`
5. If the local branch is behind `origin/main` and the working tree is clean, update local files before starting:
   - `git pull --ff-only origin main`
6. If there are local uncommitted changes, do not overwrite them. Explain the situation to the user and ask before merging, rebasing, stashing, deleting, or replacing files.

The goal is: when the user works from any computer, first sync the newest committed changes from GitHub, then make new changes, then commit and push those changes back to GitHub.

## Main repository

- GitHub repo: `https://github.com/karimatarek87-ctrl/AS-Cost-.git`
- Main branch: `main`

If system Git is not available on Windows, use the bundled Codex Git executable when present:

`C:\Users\Aldeyaa01\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\cmd\git.exe`

## Project behavior to protect

- Keep the app simple for a non-technical restaurant user.
- Keep meal costing formulas centralized in `calculations.js`.
- Keep imported raw materials in `imported-materials.js`.
- Keep imported menu items and recipe status in `imported-menu.js`.
- Do not invent recipe quantities. Ask the user to confirm quantities and material mapping before marking a menu recipe as costed.
- Avoid committing temporary files, local secrets, or generated import working folders.

## Validation after changes

For normal JavaScript edits, run syntax checks before committing:

`node --check app.js`
`node --check data.js`
`node --check calculations.js`
`node --check imported-materials.js`
`node --check imported-menu.js`

If using the bundled Codex Node.js executable, run the same checks with:

`C:\Users\Aldeyaa01\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe`

