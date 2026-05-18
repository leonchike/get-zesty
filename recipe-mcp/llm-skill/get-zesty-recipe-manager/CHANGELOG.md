# Changelog

All notable changes to the `get-zesty-recipe-manager` skill are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Version applies to the skill itself, not the underlying MCP server or web app. Bump on:
- **MAJOR** — a previously documented workflow or tool no longer behaves the same way (breaking guidance change).
- **MINOR** — new tools added, new workflows documented, or substantive new guidance.
- **PATCH** — wording fixes, typo corrections, small clarifications that don't change behavior.

---

## [1.0.3] — 2026-05-12

Patch release: improves discoverability of inventory tool parameters. No behavior change.

### Changed
- Restructured the **Tool Quick Reference > Inventory Tools** section so every tool's full param list is enumerated inline (mirrors the pattern already used for `getInventory`).
- **`addInventoryItem`** now explicitly lists `name`, `quantity`, `quantityUnit`, `locationName`, `expiresAt`, `recipeId`, `notes` with descriptions and AI-fallback rules. The prior wording only named `recipeId` as a parameter, which under-surfaced the fact that the LLM can pass a user-supplied `expiresAt` (e.g. "miso that expires August 10th 2026" → `expiresAt: "2026-08-10"`).
- **`addMultipleInventoryItems`** now spells out the per-item shape.
- **`updateInventoryItem`** now lists every updatable field including the `null` semantics for clearing `expiresAt`.
- **`consumeInventoryItem`** clarifies the decrement-vs-flip threshold and the "pass a large number to fully consume" pattern at the tool-reference level (not just in Behavior Notes).
- **`discardInventoryItem`**, **`deleteInventoryItem`**, **`listExpiringSoon`** each now name their parameters explicitly.

### Why
Without explicit param lists, the LLM was relying on the MCP tool schemas (which document all params) to discover what it could pass. That works most of the time, but the skill's tool reference is the more authoritative place — and it was under-documenting `addInventoryItem`. This patch closes that gap.

---

## [1.0.2] — 2026-05-12

Patch release: frontmatter `description` fits claude.ai's 1024-character limit (was 1131).

### Changed
- Tightened the `description` to 972 characters by compressing trigger phrasing, condensing the proactivity example list, and removing the MCP URL (not load-bearing — claude.ai connects to the MCP via its own connector configuration, not via this field).
- All four data sources (recipes, cookbooks, groceries, inventory) and the supplement-don't-replace + proactivity principles are preserved.

---

## [1.0.1] — 2026-05-12

Patch release: accuracy fixes from a post-1.0.0 review pass. No new tools or workflows.

### Fixed
- Corrected the `nameContains` description to clarify it only matches against the item name on the MCP path (the prior wording incorrectly implied notes and recipe-title coverage, which is UI-only).
- "Recipe → Grocery List" workflow now warns about quantity gaps (having 1 onion when a recipe needs 3 still requires a grocery entry).
- "Marking Inventory Consumed/Discarded" workflow now includes an explicit disambiguation step when `nameContains` returns multiple matches.
- "After Cooking → Log Leftovers" workflow clarifies that `expiresAt` must be an ISO date string or `YYYY-MM-DD`.

### Added
- Behavior note on disambiguating multiple inventory matches.
- Behavior note on accepted `expiresAt` date formats (ISO 8601 and `YYYY-MM-DD`; pass `null` via `updateInventoryItem` to clear).

---

## [1.0.0] — 2026-05-12

First formally versioned release.

### Added
- **Inventory tools section** documenting 8 new MCP tools: `getInventory`, `addInventoryItem`, `addMultipleInventoryItems`, `updateInventoryItem`, `consumeInventoryItem`, `discardInventoryItem`, `deleteInventoryItem`, `listExpiringSoon`.
- **"Four Data Sources" table** replacing the prior "Two Recipe Sources" — now covers Personal Recipes, Cookbook Recipes, Grocery List, and Inventory side-by-side.
- **Groceries vs Inventory** distinction with disambiguation guidance ("groceries = what to buy, inventory = what I have").
- **New workflows**: Restocking the Kitchen, "What's in my fridge?", "What's expiring soon?", "What can I make with what I have?", Marking Inventory Consumed/Discarded, After Cooking → Log Leftovers.
- **Inventory-aware variants** of existing workflows: Recipe → Grocery List now checks inventory first; Meal Planning anchors around expiring items; Updating Grocery List offers to log completed items as inventory.
- **Inventory Locations & Status reference** in the Field Value Conventions section. Default locations: Pantry, Spices, Fridge, Freezer, Counter, Other. Status values: ACTIVE, CONSUMED, DISCARDED.
- **`nameContains` search** documented for `getInventory` (cross-location substring search).
- **Behavior notes** for `consumeInventoryItem` semantics (decrement vs flip), AI-classified locations, leftover `recipeId` linking, and the distinct CONSUMED vs DISCARDED signals.
- **Expanded Proactivity Guide** with 5 new inventory-related next-step offers.

### Changed
- Skill `description` now includes inventory triggers: "what's in my fridge/pantry/freezer", "what's expiring soon", "I just used the last of...", "what can I make with what I have".
- Reframed the skill as a four-domain assistant (recipes + cookbooks + groceries + inventory) rather than a recipes-and-shopping-list assistant.

### Notes
- Pre-1.0.0 (unversioned baseline): personal recipes, cookbook recipes, grocery list tools, proactivity guidance, and field value conventions.
