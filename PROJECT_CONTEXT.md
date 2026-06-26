# Project Context — Abu Shakra Restaurant & Cafe Costing Apps

Last updated: 2026-06-26, Asia/Dubai

## Purpose

This repository contains the Abu Shakra restaurant costing portal and related local apps.

The main goal is to calculate meal cost clearly for restaurant management:

- Raw material recipe cost
- Flexible unit conversion
- Labour / salary loading
- Direct, indirect, fixed, and variable expenses
- Meal selling price
- Profit and margin
- Pending recipes that still need real quantities confirmed

The user is non-technical. Keep the system clean, simple, stable, and easy to operate from any computer.

## Repository

- GitHub repo: `https://github.com/karimatarek87-ctrl/AS-Cost-.git`
- Main branch: `main`
- Local project path on the original machine: `C:\Users\Aldeyaa01\OneDrive\Documents\Abu Shakra Restaurant & Cafe`

Important: GitHub reported the repo visibility as `public` on 2026-06-26, even though the user expected it to be private. Confirm visibility with the user if privacy matters before sharing links or sensitive business data.

## Main app files

- `index.html` — main meal costing portal page
- `styles.css` — main portal styling
- `app.js` — main portal behavior
- `data.js` — data loading, merging imported data, and local browser persistence
- `calculations.js` — centralized costing formulas
- `imported-materials.js` — imported raw materials from `Item.xlsx`
- `imported-menu.js` — imported restaurant menu from `AS_MENU_2025.pdf`
- `HOW TO OPEN.txt` — user opening instructions
- `Abu Shakra Apps.html` — launcher page
- `Driver Operations App/` — separate driver operations app
- `tools/item_import.mjs` — raw material import helper

## Current data facts

As of the latest verified costing work:

- Raw materials: 1,016 total
- Imported raw material records: 1,006
- Imported menu records: 220
- Total meals: 223
- Costed recipes: 4
- Pending recipes: 219
- Imported menu batch: `AS_MENU_2025-reviewed-v2-shish-tawouk`

## Confirmed sample recipe

The user confirmed a starting recipe for:

- Meal: `Shish Tawouk [Plate]`
- Meal ID: `meal-menu-2025-abu-shakra-grills-shish-tawouk-plate`
- Code: `MENU-045`
- Department: `dep-grill`
- Menu page: 8
- Selling price before VAT: AED 50.0000
- Annual production quantity: 86,500

Recipe ingredients currently use configured sample/raw material IDs:

- `mat-chicken` — 280 g, waste 3%
- `mat-spice` — 14 g
- `mat-bread` — 1 Piece
- `mat-hummus` — 1 Portion
- `mat-box` — 1 Piece

Loaded employees:

- `emp-grill-chef`
- `emp-grill-helper`

Loaded expenses:

- `exp-rent`
- `exp-gas`
- `exp-utilities`

Verified result using current configured prices:

- Materials: AED 9.0901
- Labour: AED 1.4243
- Expenses: AED 2.4280
- Total unit cost: AED 12.9423
- Selling price: AED 50.0000
- Profit per plate: AED 37.0577
- Margin: 74.1153%

Important: this recipe currently uses configured material prices. For final accounting accuracy, confirm the exact purchase-item mapping from the imported raw-material list.

## Formula rules to protect

- Keep costing formulas centralized in `calculations.js`.
- Do not duplicate formulas in UI files if a shared calculation function already exists.
- Expense and labour loading should be added to meal unit cost only as unit cost, not annual total.
- Do not invent recipe quantities. Ask the user to confirm quantities and raw material mapping before marking a meal as costed.
- Pending menu meals should stay visibly marked as pending until real recipe data is confirmed.

## User workflow preference

The user wants to build recipes one meal at a time, verify the cost, then continue.

For recipe work:

1. Pick one meal.
2. Confirm real ingredients, units, waste, labour/department, expenses, and production quantity.
3. Update the meal recipe.
4. Validate the calculated cost.
5. Commit and push the change to GitHub.
6. Update `SESSION_HANDOFF.md` and the dated session note before ending.

## Validation

For JavaScript changes, run syntax checks:

- `node --check app.js`
- `node --check data.js`
- `node --check calculations.js`
- `node --check imported-materials.js`
- `node --check imported-menu.js`

If system Node is unavailable, use the bundled Codex Node executable:

`C:\Users\Aldeyaa01\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe`

