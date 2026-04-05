# MCP Server Test Prompts - Recipe Manager

This document contains comprehensive test prompts to validate all 11 MCP tools in the Recipe Manager server. Use these prompts in Claude Desktop to ensure everything works correctly.

---

## 🧪 Testing Overview

**Total Tools:** 11
**Test Categories:** 5
- Recipe Search & Retrieval (2 tools)
- Recipe Management (3 tools)
- Grocery List Retrieval (1 tool)
- Grocery Item Management (5 tools)

---

## 📋 Pre-Test Checklist

Before running these tests, ensure:

- [ ] Next.js app is running on `http://localhost:3000`
- [ ] Claude Desktop has been restarted
- [ ] MCP server appears in Claude Desktop's available tools
- [ ] You have at least 1-2 existing recipes in your database
- [ ] You have a valid user ID configured

---

## 1️⃣ Recipe Search & Retrieval Tools

### Tool: `search_recipes`

#### Test 1.1: Basic Text Search
```
Search for all recipes that contain "chicken" in my recipe manager.
```

**Expected Result:**
- Returns list of recipes with "chicken" in title or description
- Shows recipe IDs, titles, cuisine types, difficulty
- Pagination info (total count, current page)

---

#### Test 1.2: Boolean Filter - Favorites Only
```
Show me only my favorite recipes from the recipe manager.
```

**Expected Result:**
- Returns only recipes marked as favorites
- May return empty list if no favorites exist

---

#### Test 1.3: Boolean Filter - Pinned Recipes
```
Find all my pinned recipes.
```

**Expected Result:**
- Returns only pinned recipes
- Shows pinned recipes at the top

---

#### Test 1.4: Cuisine Type Filter
```
Search for Italian and Mexican recipes in my recipe collection.
```

**Expected Result:**
- Returns recipes filtered by cuisine_types: ["Italian", "Mexican"]
- Only shows recipes matching these cuisines

---

#### Test 1.5: Meal Type Filter
```
Show me all dinner and lunch recipes.
```

**Expected Result:**
- Returns recipes filtered by meal_types: ["Dinner", "Lunch"]
- Only shows recipes for these meal times

---

#### Test 1.6: Combined Filters
```
Find Italian dinner recipes that I've marked as favorites.
```

**Expected Result:**
- Combines multiple filters: cuisine_type="Italian", meal_type="Dinner", is_favorite=True
- Returns intersection of all filters

---

#### Test 1.7: Pagination
```
Search for all recipes but show me only the first 5 results.
```

**Expected Result:**
- Returns exactly 5 recipes (limit=5)
- Shows total count and next page info

---

#### Test 1.8: Personal vs Public Filter
```
Show me only recipes I've personally created (not public ones).
```

**Expected Result:**
- Returns is_personal=True recipes
- Filters out public/shared recipes

---

### Tool: `get_recipe`

#### Test 2.1: Get Recipe by ID
```
Get the full details for recipe ID [use an ID from previous search results].
```

**Expected Result:**
- Returns complete recipe information
- Includes: title, description, ingredients, instructions
- Includes: parsed_ingredients, parsed_instructions (AI-parsed data)
- Includes: prep_time, cook_time, servings, difficulty
- Includes: nutrition info, equipment, utensils

---

#### Test 2.2: Get Non-Existent Recipe
```
Get recipe details for ID "invalid-recipe-id-12345".
```

**Expected Result:**
- Returns error: "Recipe not found" or similar
- Graceful error handling

---

## 2️⃣ Recipe Management Tools

### Tool: `create_recipe`

#### Test 3.1: Create Simple Recipe (with AI Parsing)
```
Create a new recipe in my recipe manager:
- Title: "Classic Spaghetti Carbonara"
- Ingredients: "400g spaghetti, 200g pancetta, 4 eggs, 100g parmesan cheese, black pepper, salt"
- Instructions: "1. Boil pasta. 2. Fry pancetta. 3. Mix eggs and cheese. 4. Combine all with pasta. 5. Season with pepper."
- Prep time: 10 minutes
- Cook time: 20 minutes
- Servings: 4
- Cuisine: Italian
- Meal type: Dinner
- Difficulty: Easy
```

**Expected Result:**
- Recipe created successfully
- Returns recipe_id
- AI parses ingredients into structured format
- AI parses instructions with timing info
- Success message confirms creation

---

#### Test 3.2: Create Recipe with Detailed Info
```
Add this recipe to my collection:

Title: "Spicy Thai Green Curry"
Description: "A fragrant and spicy Thai curry with coconut milk"
Ingredients:
- 500g chicken breast, cubed
- 2 tbsp green curry paste
- 1 can coconut milk (400ml)
- 1 cup bamboo shoots
- 2 kaffir lime leaves
- 1 tbsp fish sauce
- 1 tsp sugar
- Fresh basil for garnish

Instructions:
1. Heat oil in a wok over medium-high heat
2. Add curry paste and fry for 1 minute until fragrant
3. Add chicken and cook for 5 minutes
4. Pour in coconut milk and bring to simmer
5. Add bamboo shoots and lime leaves
6. Season with fish sauce and sugar
7. Simmer for 10 minutes
8. Garnish with fresh basil

Prep time: 15 minutes
Cook time: 25 minutes
Servings: 4
Cuisine: Thai
Meal type: Dinner
Difficulty: Medium
Make it public: No
```

**Expected Result:**
- Recipe created with all details
- AI parsing extracts quantities, units, ingredients
- AI parsing identifies timing in instructions
- Recipe is private (is_public=false)

---

#### Test 3.3: Create Minimal Recipe
```
Create a quick recipe: "Scrambled Eggs" with ingredients "2 eggs, butter, salt" and instructions "Beat eggs, cook in butter, season with salt". Serves 1, easy difficulty.
```

**Expected Result:**
- Creates recipe with minimal information
- Uses defaults for missing fields
- Still performs AI parsing

---

#### Test 3.4: Create Recipe Without AI Parsing
```
Create a recipe called "Test Recipe" with ingredients "flour, sugar" and instructions "mix and bake". Don't use AI parsing for this one.
```

**Expected Result:**
- Creates recipe with parseWithAI=False
- Skips AI ingredient/instruction parsing
- Stores raw text only

---

### Tool: `update_recipe`

#### Test 4.1: Update Recipe Description
```
Update the description of recipe [use ID from created recipe] to "An authentic Italian pasta dish with a creamy egg and cheese sauce".
```

**Expected Result:**
- Recipe description updated
- Other fields remain unchanged
- Returns updated recipe_id

---

#### Test 4.2: Update Multiple Fields
```
For recipe [ID], update:
- Prep time to 15 minutes
- Cook time to 25 minutes
- Difficulty to Medium
```

**Expected Result:**
- All specified fields updated
- Unspecified fields remain unchanged
- Confirmation message

---

#### Test 4.3: Update with AI Re-parsing
```
Update recipe [ID] with new ingredients: "500g spaghetti, 250g guanciale, 5 eggs, 150g pecorino romano, fresh black pepper" and re-parse with AI.
```

**Expected Result:**
- Ingredients updated
- AI re-parses the new ingredients
- Structured data (parsed_ingredients) updated

---

### Tool: `delete_recipe`

#### Test 5.1: Soft Delete Recipe
```
Delete the recipe called "Test Recipe" from my collection.
```

**Expected Result:**
- Recipe marked as deleted (soft delete)
- Recipe no longer appears in searches
- Data still exists in database (isDeleted=true)
- Confirmation message

---

#### Test 5.2: Delete Non-Existent Recipe
```
Delete recipe with ID "non-existent-id-999".
```

**Expected Result:**
- Error: "Recipe not found" or similar
- Graceful error handling

---

## 3️⃣ Grocery List Tools

### Tool: `get_grocery_list`

#### Test 6.1: View Complete Grocery List
```
Show me my current grocery list.
```

**Expected Result:**
- Returns both active and completed items
- Active items listed separately from completed
- Each item shows: id, name, quantity, unit, status, section
- Items may be organized by grocery section (Produce, Dairy, etc.)
- Shows total counts

---

#### Test 6.2: Check Empty Grocery List
```
What's on my grocery list right now?
```

**Expected Result:**
- If empty: Returns empty arrays with totals of 0
- If not empty: Shows current items

---

## 4️⃣ Grocery Item Management Tools

### Tool: `add_grocery_item`

#### Test 7.1: Add Simple Item
```
Add milk to my grocery list.
```

**Expected Result:**
- Item added with name "milk"
- No quantity specified (quantity=null)
- AI classifies item to appropriate section (likely "Dairy & Eggs")
- Returns item ID and confirmation

---

#### Test 7.2: Add Item with Quantity
```
Add 2 pounds of chicken breast to my grocery list.
```

**Expected Result:**
- Item added: name="chicken breast", quantity=2, unit="pounds"
- AI classifies to section (likely "Meat & Seafood")
- Section classification cached for future use

---

#### Test 7.3: Add Item with Quantity and Unit
```
Add 1 gallon of whole milk to my grocery list.
```

**Expected Result:**
- Item added: quantity=1, unit="gallon"
- Classified to "Dairy & Eggs" section

---

#### Test 7.4: Add Uncommon Item (Test AI Classification)
```
Add dragon fruit to my grocery list.
```

**Expected Result:**
- Item added successfully
- AI performs classification (may take 1-8 seconds)
- Likely classified to "Produce" or "Fresh Produce"
- Classification cached in commonGroceryItem table

---

#### Test 7.5: Add Same Uncommon Item Again (Test Cache)
```
Add another dragon fruit to my grocery list.
```

**Expected Result:**
- Item added much faster (cache hit)
- Uses previously cached section classification
- Instant response (<100ms)

---

### Tool: `add_multiple_grocery_items`

#### Test 8.1: Add Multiple Items at Once
```
Add these items to my grocery list:
- 5 tomatoes
- 1 loaf of bread
- 2 pounds of ground beef
- 1 gallon of orange juice
- Fresh basil
```

**Expected Result:**
- All 5 items added successfully
- Parallel execution (fast)
- Each item classified to appropriate section
- Returns summary: total_added, total_failed, list of added items

---

#### Test 8.2: Bulk Add with Some Errors
```
Add to my grocery list:
- Bananas
- (leave one intentionally malformed if possible)
- Cheese
```

**Expected Result:**
- Valid items added
- Invalid items reported in failed_items array
- Partial success handling
- Clear error messages for failures

---

#### Test 8.3: Bulk Add from Recipe
```
Add all ingredients from my Spaghetti Carbonara recipe to my grocery list.
```

**Expected Result:**
- Multiple items added based on recipe ingredients
- Quantities preserved from recipe
- Each ingredient classified

---

### Tool: `update_grocery_item`

#### Test 9.1: Update Item Name
```
Change "milk" to "almond milk" in my grocery list.
```

**Expected Result:**
- Item name updated
- Other properties (quantity, section) unchanged
- Confirmation message

---

#### Test 9.2: Update Item Quantity
```
Change the quantity of chicken breast to 3 pounds.
```

**Expected Result:**
- Quantity updated to 3
- Unit remains "pounds"
- Name and other fields unchanged

---

#### Test 9.3: Update Item Status
```
Mark the tomatoes as active in my grocery list.
```

**Expected Result:**
- Status changed to "ACTIVE"
- Item appears in active items list

---

#### Test 9.4: Update Multiple Fields
```
For the bread item, change quantity to 2 and unit to "loaves".
```

**Expected Result:**
- Both quantity and unit updated
- Name and status unchanged

---

### Tool: `complete_grocery_items`

#### Test 10.1: Complete Single Item
```
Mark milk as completed on my grocery list.
```

**Expected Result:**
- Item status changed to "COMPLETED"
- Timestamp recorded
- Item moves to completed items section
- Returns count: 1 item completed

---

#### Test 10.2: Complete Multiple Items
```
Mark these items as completed: tomatoes, bread, and chicken breast.
```

**Expected Result:**
- All specified items marked as completed
- Batch operation (efficient)
- Returns count of completed items
- Confirmation message

---

#### Test 10.3: Complete All Active Items
```
Mark all items on my grocery list as completed.
```

**Expected Result:**
- All active items → completed
- Returns total count
- Active list becomes empty

---

### Tool: `delete_grocery_item`

#### Test 11.1: Delete Single Item
```
Remove dragon fruit from my grocery list.
```

**Expected Result:**
- Item permanently deleted (hard delete)
- No longer appears in list
- Confirmation with item_id

---

#### Test 11.2: Delete Completed Item
```
Delete the completed milk item from my list.
```

**Expected Result:**
- Completed item removed
- Permanent deletion
- Confirmation message

---

#### Test 11.3: Delete Non-Existent Item
```
Delete grocery item with ID "non-existent-999".
```

**Expected Result:**
- Error: "Item not found" or similar
- Graceful error handling
- No crash or unexpected behavior

---

## 🔄 Integration & Workflow Tests

### Workflow Test 1: Complete Recipe-to-Grocery Flow
```
1. Search for "pasta" recipes
2. Get the full details of the first result
3. Add all ingredients from that recipe to my grocery list
4. View my updated grocery list
5. Mark the first 2 items as completed
6. Delete one of the completed items
```

**Expected Result:**
- Seamless flow through multiple tools
- Data consistency across operations
- Proper state management

---

### Workflow Test 2: Recipe Creation & Management
```
1. Create a new recipe for "Quick Breakfast Oats"
2. Search for it to verify it was created
3. Get its full details
4. Update the description
5. Delete the recipe
6. Search again to confirm it's gone
```

**Expected Result:**
- Complete CRUD cycle works
- Recipe searchable after creation
- Updates persist
- Soft delete removes from search

---

### Workflow Test 3: Grocery List Management
```
1. View current grocery list
2. Add 5 new items in bulk
3. Update quantity of 2 items
4. Complete 3 items
5. Delete 1 item
6. View final grocery list state
```

**Expected Result:**
- All operations complete successfully
- State updates reflect in real-time
- Counts accurate throughout

---

## 🚨 Error Handling Tests

### Error Test 1: Invalid Recipe ID
```
Get recipe with ID "definitely-not-a-real-id".
```

**Expected Result:**
- Returns 404 or "Recipe not found" error
- Error message is clear and helpful
- No server crash

---

### Error Test 2: Invalid User ID
```
(This would require manually changing env vars, so skip in normal testing)
```

---

### Error Test 3: Missing Required Fields
```
Create a recipe with just a title "Test" and nothing else.
```

**Expected Result:**
- Error about missing ingredients/instructions
- Clear validation message
- Suggests required fields

---

### Error Test 4: Invalid Enum Values
```
Create a recipe with difficulty "SUPER_HARD" (invalid enum).
```

**Expected Result:**
- Error about invalid difficulty value
- Lists valid options: EASY, MEDIUM, HARD

---

### Error Test 5: Network/API Errors
```
(Test with Next.js app stopped)
Try to search for recipes.
```

**Expected Result:**
- Connection error caught
- Error message explains API is unreachable
- Sentry captures the error (if configured)

---

## ✅ Success Criteria

### All Tests Pass If:

**Recipe Tools:**
- ✅ Can search recipes with various filters
- ✅ Can retrieve full recipe details
- ✅ Can create recipes with AI parsing
- ✅ Can update recipes (partial updates work)
- ✅ Can soft-delete recipes

**Grocery Tools:**
- ✅ Can view grocery list (active + completed)
- ✅ Can add single items with AI classification
- ✅ Can bulk add items (parallel execution)
- ✅ Can update items (name, quantity, status)
- ✅ Can complete items (batch operation)
- ✅ Can delete items permanently

**AI Features:**
- ✅ Recipe ingredients parsed into structured format
- ✅ Recipe instructions parsed with timing
- ✅ Grocery items auto-classified to sections
- ✅ Classification results cached for performance

**Error Handling:**
- ✅ Invalid IDs return clear errors
- ✅ Missing fields return validation errors
- ✅ Network errors handled gracefully
- ✅ No server crashes on bad input

**Performance:**
- ✅ Search returns results in < 1 second
- ✅ Recipe creation with AI < 10 seconds
- ✅ Grocery item addition < 100ms (cached)
- ✅ Grocery item addition < 10 seconds (AI classification)
- ✅ Bulk operations faster than sequential

---

## 📊 Test Results Template

Copy this template to track your test results:

```markdown
## Test Results - [Date]

### Recipe Search & Retrieval
- [ ] Test 1.1: Basic Text Search
- [ ] Test 1.2: Favorites Filter
- [ ] Test 1.3: Pinned Filter
- [ ] Test 1.4: Cuisine Type Filter
- [ ] Test 1.5: Meal Type Filter
- [ ] Test 1.6: Combined Filters
- [ ] Test 1.7: Pagination
- [ ] Test 1.8: Personal vs Public
- [ ] Test 2.1: Get Recipe by ID
- [ ] Test 2.2: Get Non-Existent Recipe

### Recipe Management
- [ ] Test 3.1: Create Simple Recipe
- [ ] Test 3.2: Create Detailed Recipe
- [ ] Test 3.3: Create Minimal Recipe
- [ ] Test 3.4: Create Without AI
- [ ] Test 4.1: Update Description
- [ ] Test 4.2: Update Multiple Fields
- [ ] Test 4.3: Update with AI Re-parsing
- [ ] Test 5.1: Soft Delete Recipe
- [ ] Test 5.2: Delete Non-Existent

### Grocery List
- [ ] Test 6.1: View Complete List
- [ ] Test 6.2: Check Empty List

### Grocery Item Management
- [ ] Test 7.1: Add Simple Item
- [ ] Test 7.2: Add with Quantity
- [ ] Test 7.3: Add with Quantity & Unit
- [ ] Test 7.4: Add Uncommon Item (AI)
- [ ] Test 7.5: Add Same Item (Cache)
- [ ] Test 8.1: Add Multiple Items
- [ ] Test 8.2: Bulk Add with Errors
- [ ] Test 8.3: Bulk Add from Recipe
- [ ] Test 9.1: Update Item Name
- [ ] Test 9.2: Update Quantity
- [ ] Test 9.3: Update Status
- [ ] Test 9.4: Update Multiple Fields
- [ ] Test 10.1: Complete Single Item
- [ ] Test 10.2: Complete Multiple Items
- [ ] Test 10.3: Complete All Items
- [ ] Test 11.1: Delete Single Item
- [ ] Test 11.2: Delete Completed Item
- [ ] Test 11.3: Delete Non-Existent

### Integration Workflows
- [ ] Workflow 1: Recipe-to-Grocery
- [ ] Workflow 2: Recipe CRUD
- [ ] Workflow 3: Grocery Management

### Error Handling
- [ ] Error Test 1: Invalid Recipe ID
- [ ] Error Test 3: Missing Required Fields
- [ ] Error Test 4: Invalid Enum Values

**Issues Found:** [List any issues here]

**Overall Status:** ✅ PASS / ⚠️ PARTIAL / ❌ FAIL

**Notes:** [Any additional observations]
```

---

## 🎯 Quick Smoke Test (5 minutes)

If you're short on time, run these critical tests:

1. **Search recipes:** "Find all recipes"
2. **Create recipe:** "Create a recipe for scrambled eggs"
3. **Get grocery list:** "Show my grocery list"
4. **Add item:** "Add milk to grocery list"
5. **Complete item:** "Mark milk as completed"
6. **Delete item:** "Remove milk from list"

If all 6 work, core functionality is operational! ✅

---

**Version:** 1.0.3
**Last Updated:** 2025-10-20
**Compatible with:** Recipe Manager MCP Server v1.0.3
