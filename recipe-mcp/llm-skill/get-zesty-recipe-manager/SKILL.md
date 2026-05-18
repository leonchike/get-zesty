---
name: get-zesty-recipe-manager
version: 1.0.3
description: >
  Use for any query touching the user's personal recipes, digitized cookbook library, grocery list, kitchen inventory (pantry/spices/fridge/freezer), or meal planning in Get Zesty Recipe Manager. Triggers: "do I have a recipe for...", "what recipes do I have", "show my cookbooks", "add to my grocery list", "what's in my fridge/pantry/freezer", "what's expiring soon", "I just used the last of...", "what can I make with what I have", "plan my meals", "suggest dinner", "update/save/change my recipe", or anything about the user's own saved recipes, cookbooks, shopping list, or kitchen contents. Supplements Claude's general cooking knowledge — use external knowledge freely, but always use this skill when the user's own data is involved. Be proactive: end each response with a specific next-step offer (e.g. after a recipe → check inventory or add to groceries; after a meal plan → build a shopping list; after listing inventory → suggest a recipe using expiring items).
---

# Get Zesty Recipe Manager

A personal recipe collection, digitized cookbook library, grocery list, and kitchen inventory tracker. Use the connected MCP tools to access the user's data — Claude's general cooking knowledge is always fair game alongside this.

**Core principle**: Always end with a proactive, meaningful next step. Don't just answer and stop — anticipate what the user will want to do next and offer it.

---

## Four Data Sources

The user has **four distinct kinds of data** — treat them differently:

| | Personal Recipes | Cookbook Recipes | Grocery List | Inventory |
|---|---|---|---|---|
| What it is | User-created / saved | Digitized from physical cookbooks | What to buy | What's already in the kitchen |
| Editable? | ✅ Full CRUD | ❌ Read-only | ✅ Full CRUD | ✅ Full CRUD |
| Search | Keyword + filters | Semantic / natural language | Listed by store section | Listed by location; substring search |
| Tools | `searchRecipes`, `getRecipe`, `createRecipe`, `updateRecipe`, `deleteRecipe` | `searchCookbookRecipes`, `getCookbookRecipe`, `listCookbooks`, `listCookbookRecipes`, `searchByIngredient` | `getGroceryList`, `addGroceryItem`, `addMultipleGroceryItems`, `updateGroceryItem`, `completeGroceryItems`, `deleteGroceryItem` | `getInventory`, `addInventoryItem`, `addMultipleInventoryItems`, `updateInventoryItem`, `consumeInventoryItem`, `discardInventoryItem`, `deleteInventoryItem`, `listExpiringSoon` |

**Groceries vs Inventory** — a crucial distinction:
- **Groceries** = "what I need to buy" (a shopping list)
- **Inventory** = "what I already have" (pantry/fridge/freezer contents)

When the user says "add milk", clarify if ambiguous: are they shopping (groceries) or did they just buy/restock (inventory)? Default to groceries unless context says otherwise (e.g., "I just bought…", "I have…", "I stocked up on…" → inventory).

---

## Tool Quick Reference

### Personal Recipe Tools
- **`searchRecipes`** — Search/filter saved recipes. Returns summaries; follow up with `getRecipe` for full details.
- **`getRecipe`** — Full recipe details by ID (ingredients, instructions, nutrition, notes).
- **`createRecipe`** — Save a new recipe. Use `parseWithAI: true` (default) for structured parsing.
- **`updateRecipe`** — Partial update — only include fields to change. Fetch current with `getRecipe` first.
- **`deleteRecipe`** — Soft-delete (reversible).

### Cookbook Tools
- **`listCookbooks`** — Show all digitized cookbooks with recipe counts.
- **`listCookbookRecipes`** — List all recipes in a specific cookbook (requires `cookbookId`). Supports pagination. Use when the user wants to browse or see everything inside a particular book.
- **`searchCookbookRecipes`** — Natural language semantic search across cookbooks. Great for exploratory queries like "something cozy with mushrooms" or "impressive dinner party dish".
- **`getCookbookRecipe`** — Full details including source book title, author, and page number.
- **`searchByIngredient`** — Find cookbook recipes by ingredients on hand.

### Grocery List Tools
- **`getGroceryList`** — Returns items grouped by store section (Produce, Dairy, Meat, etc.).
- **`addGroceryItem`** — Add a single item.
- **`addMultipleGroceryItems`** — Bulk add up to 50 items (always use this when adding from a recipe).
- **`updateGroceryItem`** — Change name, quantity, unit, or mark active/completed.
- **`completeGroceryItems`** — Batch-mark items as done.
- **`deleteGroceryItem`** — Permanently remove an item.

### Inventory Tools
- **`getInventory`** — Returns items grouped by storage location (Pantry, Spices, Fridge, Freezer, Counter, Other, or user-defined). Filters:
  - `locationName` — restrict to one location (`"Fridge"`, `"Spices"`, etc.)
  - `status` — `"ACTIVE"` (default), `"CONSUMED"`, or `"DISCARDED"`
  - `expiringWithinDays` — only items expiring in the next N days
  - `nameContains` — case-insensitive substring match on the item name (e.g. `"parm"` → "parmesan", "parmesan crackers"). Filters across all locations.
- **`addInventoryItem`** — Add a single item. Params:
  - `name` (required) — the item name (e.g. `"miso"`, `"raw chicken"`)
  - `quantity` — numeric quantity (e.g. `4`)
  - `quantityUnit` — unit string (e.g. `"lbs"`, `"jar"`, `"g"`)
  - `locationName` — `"Pantry"`, `"Spices"`, `"Fridge"`, `"Freezer"`, `"Counter"`, `"Other"`, or a user-defined location. **If omitted**, the server AI infers it (milk → Fridge, cumin → Spices, avocado → Counter).
  - `expiresAt` — ISO date or `YYYY-MM-DD`. **If omitted**, the server AI may suggest one based on the item's typical shelf life. **If supplied by the user, always pass it** — the user's date overrides the AI suggestion.
  - `recipeId` — optional Recipe ID; links a leftover to the recipe it came from (the inventory entry will display "from <Recipe Title>").
  - `notes` — free-form notes (e.g. `"opened on Tuesday"`)
- **`addMultipleInventoryItems`** — Bulk add 1–50 items. Params:
  - `items` (required) — array of objects, each with the same shape as `addInventoryItem` (`name`, `quantity?`, `quantityUnit?`, `locationName?`, `expiresAt?`, `recipeId?`, `notes?`). AI classification runs per-item where `locationName`/`expiresAt` are omitted.
- **`updateInventoryItem`** — Partial update — only provided fields change. Params:
  - `itemId` (required) — the inventory item ID
  - `name`, `quantity`, `quantityUnit`, `locationName`, `notes` — any subset of these to change
  - `expiresAt` — ISO date or `YYYY-MM-DD`. Pass `null` to clear an existing expiry.
  - `status` — `"ACTIVE"`, `"CONSUMED"`, or `"DISCARDED"` (prefer `consumeInventoryItem` / `discardInventoryItem` for status changes — they handle the quantity logic too)
- **`consumeInventoryItem`** — Mark an item as used. Params:
  - `itemId` (required)
  - `decrement` — units to subtract (default `1`). If `decrement < quantity`, only quantity is reduced. If `decrement >= quantity` (or quantity is null), the item is flipped to CONSUMED. Pass a large number (e.g. `1000`) to fully consume regardless of quantity.
- **`discardInventoryItem`** — Mark DISCARDED (thrown out / wasted). Params:
  - `itemId` (required). Distinct signal from CONSUMED — use when something spoiled, not when it was eaten.
- **`deleteInventoryItem`** — Permanent record deletion. Params:
  - `itemId` (required). Prefer `consume`/`discard` unless the entry was created in error.
- **`listExpiringSoon`** — Items expiring within N days, sorted by soonest. Params:
  - `withinDays` — number of days (default `3`). Great for "what should I cook this week?"

---

## Common Workflows

### "Do I have a recipe for X?"
1. `searchRecipes(search: "X")` for personal recipes
2. `searchCookbookRecipes(query: "X")` for cookbook matches
3. `getRecipe` or `getCookbookRecipe` for full details on the best match
4. **Proactive next steps**: offer to check inventory for what's already on hand, add missing ingredients to the grocery list, suggest variations, or ask if they'd like to adjust servings

### Recipe Ideation & Exploration
*Triggered by: "suggest something for dinner", "I want to try something new", "what should I make this week", "I'm in the mood for something [adjective]"*

1. Ask about constraints if not clear (dietary needs, time, mood, cuisine preference) — but don't over-interrogate; make reasonable assumptions and search
2. Consider running `listExpiringSoon` if scope is "this week" — recipes that use up expiring items are doubly valuable
3. `searchCookbookRecipes` with a natural language query capturing the vibe (e.g., "quick weeknight dinner", "comforting winter dish", "light summer salad")
4. `searchRecipes` to also surface relevant personal recipes
5. Present a curated shortlist (3–5 options) with brief summaries — don't just dump results. If an option uses an expiring inventory item, highlight that ("uses the cilantro that expires Tuesday").
6. **Proactive next steps**: offer to show the full recipe for any of them, check what's already in their inventory, add missing ingredients to the grocery list, or fold a choice into a meal plan

### Meal Planning
*Triggered by: "help me plan meals", "plan my week", "what should I eat this week", "make me a meal plan"*

1. Clarify scope if needed: how many days, meals per day, any dietary constraints
2. Optionally `listExpiringSoon` to anchor part of the plan around items that need using up
3. Search both personal recipes and cookbooks for variety across different meal types
4. Draft a structured plan (e.g. a day-by-day table) mixing familiar personal recipes with new discoveries from cookbooks
5. Use general knowledge to fill gaps and balance the plan nutritionally/variety-wise
6. **Proactive next steps**: offer to cross-check the recipes' ingredients against inventory (`getInventory`) to see what's already on hand, then build a grocery list for only what's missing — ask "want me to add only the missing ingredients to your grocery list?" If yes, use `addMultipleGroceryItems` for each recipe, passing the `recipeId` where applicable

### Recipe → Grocery List (with inventory awareness)
1. `getRecipe` or `getCookbookRecipe` to retrieve ingredients
2. **Smart move**: `getInventory(nameContains: "<ingredient>")` for the key ingredients — items already on hand may not need to be re-bought
3. **Mind the quantity gap**: having 1 onion when the recipe needs 3 still requires a grocery entry. When in doubt, ask the user, or add the full amount with a note.
4. `addMultipleGroceryItems` with the *missing or under-stocked* ingredients (pass `recipeId` for personal recipes to link them)
5. `getGroceryList` to confirm items were added correctly
6. **Proactive next steps**: offer to check for ingredient overlaps if multiple recipes were added, or ask if anything should be removed (things they already have enough of)

### Updating a Recipe
*Triggered by: "change the servings on...", "update the instructions for...", "add a note to...", "fix my pasta recipe"*

1. `searchRecipes` if the exact recipe isn't specified — confirm with the user which one
2. `getRecipe` to see current values before making changes
3. Confirm the intended changes with the user if anything is ambiguous
4. `updateRecipe` with only the changed fields — omit everything else
5. **Proactive next steps**: offer to show the updated recipe in full, or ask if they'd like to update the grocery list if serving size changed

### Updating the Grocery List
*Triggered by: "I already have X", "remove X from my list", "change the quantity of...", "clear my list", "check off..."*

1. `getGroceryList` to see current state
2. Use the appropriate tool:
   - Quantity/name change → `updateGroceryItem`
   - Mark as bought → `completeGroceryItems` (batch-friendly)
   - Remove entirely → `deleteGroceryItem`
3. **Proactive next steps**: if items are being marked as completed (i.e. bought), offer to add them to inventory — "want me to log these in your kitchen inventory so we know what's on hand?" If yes, use `addMultipleInventoryItems`.

### Restocking the Kitchen / Logging Purchases
*Triggered by: "I just got back from the store with...", "I bought X", "I have X in my pantry now", "stocked up on..."*

1. Parse the items the user mentions (quantities, units if given)
2. `addMultipleInventoryItems` with the list — let AI classify location automatically
3. Show what landed where (e.g., "Stocked: 2 lbs chicken → Fridge, 1 jar oregano → Spices")
4. **Proactive next steps**: ask if anything should also be removed from the grocery list (since they bought it). If yes, `getGroceryList` and `completeGroceryItems` for the matching items.

### "What's in my fridge/pantry/freezer?"
1. `getInventory(locationName: "Fridge")` (or whichever location)
2. Present the items with their expiry indicators
3. **Proactive next steps**: if items are expiring soon, point them out and offer to suggest recipes that use them (`searchByIngredient` + `searchRecipes`)

### "What's expiring soon?"
*Triggered by: "what should I use up", "what's about to go bad", "anything expiring this week"*

1. `listExpiringSoon(withinDays: 7)` (or 3 for shorter horizon — match the user's framing)
2. Group by urgency (today, this week)
3. **Proactive next steps**: offer to find recipes that use the expiring items — pass the names to `searchByIngredient` and `searchRecipes`. Or offer to discard items that are already past expiry.

### "What can I make with what I have?"
*Triggered by: "what can I cook with what's in the kitchen", "recipes using what I have"*

1. `getInventory(status: "ACTIVE")` to see everything on hand
2. Pick 3–5 prominent ingredients (proteins, signature items, expiring items) and pass to `searchByIngredient` and `searchRecipes`
3. Supplement with Claude's own suggestions for ideas not in their collection
4. Highlight matches that lean heavily on what they already have ("uses 8 of your 10 ingredients")
5. **Proactive next steps**: offer to pull up the full recipe, add only the missing ingredients to the grocery list, or — once they cook it — offer to log leftovers in inventory

### Marking Inventory Consumed/Discarded
*Triggered by: "I finished the X", "we ate the leftovers", "the bread went moldy", "I threw out the milk"*

1. `getInventory(nameContains: "X")` to find the item (more reliable than guessing IDs)
2. **Disambiguate if multiple matches**: if more than one item matches (e.g., two open jars of mustard), show the user the candidates with their location and `addedAt` date and ask which one — never guess
3. If consumed/eaten → `consumeInventoryItem(itemId, decrement: <amount> or large number to fully consume)`
4. If wasted/spoiled → `discardInventoryItem(itemId)` — this is the right signal for waste tracking
5. **Proactive next steps**: ask if they want to add the item back to the grocery list to restock, or check if related items are also low

### After Cooking → Log Leftovers
*Triggered by user mentioning they just made a recipe, or after Claude walks them through one*

1. Ask if there are leftovers worth saving
2. If yes, `addInventoryItem(name: "Leftover <recipe name>", locationName: "Fridge", recipeId: <id>, expiresAt: "<YYYY-MM-DD, 3-5 days out>")` — `expiresAt` must be an ISO date string or `YYYY-MM-DD`
3. **Proactive next steps**: mention it'll show up in inventory and `listExpiringSoon` to nudge eating it within a few days

### Saving a New Recipe
1. Gather: title, ingredients, instructions — and optionally description, prep/cook time, servings, cuisine, meal type
2. If from a URL or conversation, extract and structure the details before calling
3. `createRecipe` with `parseWithAI: true` (default — slower but creates better structured data)
4. Confirm with the returned ID
5. **Proactive next steps**: offer to check inventory for what's already on hand, add missing ingredients to the grocery list, or include it in a meal plan

### Browsing the Cookbook Collection
1. `listCookbooks` to show what's available
2. Choose the right lookup approach:
   - **Browsing a specific book** → `listCookbookRecipes(cookbookId: ...)` to page through everything in it
   - **Searching by idea or vibe** → `searchCookbookRecipes` with a natural language query, optionally filtered by `cookbookId`
3. `getCookbookRecipe` for the full recipe — surface the page number so the user can find it in their physical book
4. **Proactive next steps**: offer to check inventory for what's on hand, add missing ingredients to the grocery list, or save it as a personal recipe for easier future access

---

## Proactivity Guide

Always close a response with a short, specific follow-up offer. Match it to what was just done:

| Just did... | Good next step offer |
|---|---|
| Showed a recipe | "Want to check your inventory for what's on hand, or add the rest to your grocery list?" |
| Built a meal plan | "Should I cross-check your inventory and put together a shopping list for only what's missing?" |
| Added to grocery list | "I've added X items. Want me to check the full list, or scan inventory to remove items you already have?" |
| Updated a recipe | "Here's the updated version — want to see the full recipe?" |
| Found recipe matches | "Want the full recipe for any of these, or should I add one to your list?" |
| Cleared grocery items | "List is clear! Want me to log them in inventory since you've bought them?" |
| Completed grocery items | "Nice — want me to log those in your kitchen inventory so we know what's on hand?" |
| Saved a new recipe | "Saved! Want me to check what's already in inventory before adding the rest to your grocery list?" |
| Explored cookbook | "Found it on page X of [Book]. Want me to add the ingredients to your list?" |
| Showed inventory | "Anything in here expiring soon? Want me to find a recipe that uses up what's on hand?" |
| Listed expiring items | "Want recipe ideas for any of these before they go bad?" |
| Consumed an item | "Should I add it back to the grocery list to restock?" |
| Logged leftovers | "I'll flag it in `listExpiringSoon` so you don't forget — want to plan a leftover meal for later this week?" |

Keep the offer **specific and actionable** — not generic like "let me know if you need anything else."

---

## Field Value Conventions

When calling `createRecipe` or `updateRecipe`, store `cuisineType` and `mealType` in **lowercase** and pick from the canonical value set. The web app's dropdowns match on exact value — `"Dinner"` will render as empty; `"dinner"` will select "Dinner" correctly.

**`mealType`** — one of:
`breakfast`, `brunch`, `lunch`, `dinner`, `appetizer`, `snack`, `main`, `side`, `soup`, `dessert`, `drinks`, `sauce`, `condiment`, `pantry-staple`

**`cuisineType`** — lowercase country/region name from the canonical list (e.g. `italian`, `french`, `japanese`, `mexican`, `nigerian`, `greek`, `thai`, `chinese`, `vietnamese`, `indian`, `american`, `caribbean`, `spanish`). Compound values also accepted: `american bbq`, `cajun/creole`, `southern`, `fusion`, `asian`. If the user's description doesn't map to a single cuisine, prefer the primary one over hyphenated fusions.

Normalize on input: "this is a Greek appetizer" → `cuisineType: "greek"`, `mealType: "appetizer"`.

### Inventory Locations

Default locations (seeded for every user): **Pantry**, **Spices**, **Fridge**, **Freezer**, **Counter**, **Other**. Users may add custom locations (e.g., "Spice Rack", "Garage Freezer"). When passing `locationName`, match exactly to one of the available names — case matters for matching against the user's custom locations. If unsure, omit `locationName` and let the AI infer.

### Inventory Status Values

- **`ACTIVE`** — currently in the kitchen (default)
- **`CONSUMED`** — eaten / used up (positive signal)
- **`DISCARDED`** — thrown out / wasted (waste-tracking signal)

These are intentionally distinct. When the user says "I ate the last apple" use `consumeInventoryItem`; when they say "the bread went moldy" use `discardInventoryItem`. The user-facing UI shows consumed and discarded items in separate collapsed sections.

---

## Behavior Notes

- **Supplement, don't replace**: Use MCP data for the user's own collection; use general knowledge freely for cooking tips, substitutions, pairings, technique, etc.
- **Check both recipe sources by default**: When a user asks about a recipe they might have, search both personal recipes *and* cookbooks unless context is clearly one or the other.
- **Groceries ≠ Inventory**: A grocery list is "to buy"; inventory is "what I have". When in doubt, default to groceries, but listen for restock language ("I bought", "I stocked up") that signals inventory.
- **Cross-tool wins**: The biggest unlock from this skill is *combining* tools — checking inventory before adding to grocery list, suggesting recipes that use expiring items, logging leftovers tied to the recipe they came from. Always look for these moments.
- **Pagination**: `searchRecipes` returns up to 20 results. Check `totalCount` and `nextPage` — if there are more, mention it.
- **IDs flow through**: Get IDs from search results, pass to detail tools. Never guess IDs.
- **Cookbook recipes are read-only**: Don't attempt to update or delete them.
- **Soft deletes**: `deleteRecipe` is reversible — worth mentioning to the user.
- **Grocery sections are auto-assigned**: The server AI-classifies items into store sections; no need to specify.
- **Inventory locations are auto-classified**: Similarly, omit `locationName` on add and the server will pick (milk → Fridge, cumin → Spices, etc.). The server also suggests an `expiresAt` based on typical shelf life — the user can override.
- **`consumeInventoryItem` semantics**: If you want to fully mark an item consumed regardless of quantity, pass a large `decrement` (e.g. 1000). The server flips status to CONSUMED once `quantity <= decrement` or when quantity is null.
- **Searching inventory by name**: Use `nameContains` (case-insensitive substring) rather than fetching the full list and scanning. It matches against the item name only (not notes or source recipe). For leftover lookups, search by the recipe name as it was logged (e.g. `nameContains: "tacos"` if the entry name is "Leftover Mahi Mahi Tacos").
- **Disambiguating multiple matches**: When `nameContains` returns more than one item, show the user the matches with their location and `addedAt` date and ask which one. Never assume — two open jars of the same thing can have different expiry dates.
- **Date formats**: `expiresAt` accepts ISO 8601 (`"2026-05-20T00:00:00Z"`) or just `YYYY-MM-DD` (`"2026-05-20"`). Pass `null` via `updateInventoryItem` to clear an expiry.
- **Normalize `cuisineType` / `mealType` before saving**: Always lowercase these and map synonyms ("Main Course" → `main`, "Side Dish" → `side`, "Drink"/"Beverage" → `drinks`, "Pantry Staple" → `pantry-staple`). The DB is case-sensitive and the edit UI won't pre-fill mismatched values.
- **Meal plan grocery lists**: Use `addMultipleGroceryItems` per recipe, passing `recipeId` for personal recipes so items are linked back to their source.
- **Leftover linking**: When logging leftovers from a cooked recipe, pass `recipeId` to `addInventoryItem` so the inventory entry shows "from <Recipe Title>" in the UI.
