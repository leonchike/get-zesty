# MCP Server Testing Guide

Quick guide to verify all fixes are working correctly.

## Version 1.0.2 Test Cases

### ✅ Test 1: Create Recipe (Fixed in v1.0.1)

**Test:**
```python
create_recipe(
    title="Test Recipe - v1.0.2",
    ingredients="2 cups flour\n1 cup water\n1 tsp salt",
    instructions="1. Mix ingredients\n2. Knead dough\n3. Let rest",
    prep_time=15,
    cook_time=30,
    servings=4,
    difficulty="EASY"
)
```

**Expected:** Recipe created successfully with `source="USER"`

**Verification:** Check response contains recipe ID and no Prisma validation errors

---

### ✅ Test 2: Delete Recipe (Fixed in v1.0.2)

**Test:**
```python
# First create a recipe, then delete it
recipe = create_recipe(title="Recipe to Delete", ingredients="test", instructions="test")
delete_recipe(recipe_id=recipe["content"]["recipe_id"])
```

**Expected:** Recipe soft-deleted successfully

**Verification:** No "unexpected keyword argument" errors, returns deleted recipe ID

---

### ✅ Test 3: Delete Grocery Item (Fixed in v1.0.2)

**Test:**
```python
# First add an item, then delete it
item = add_grocery_item(name="Test Item to Delete", quantity=1)
delete_grocery_item(item_id=item["content"]["item"]["id"])
```

**Expected:** Grocery item permanently deleted

**Verification:** No "unexpected keyword argument" errors, returns deleted item ID

---

### ✅ Test 4: Search with Array Filters (Fixed in v1.0.2)

**Test Case A - With Cuisine Types:**
```python
search_recipes(
    cuisine_types=["Italian", "Mexican"],
    limit=10
)
```

**Expected:** Returns recipes matching specified cuisine types, no validation errors

**Test Case B - With Meal Types:**
```python
search_recipes(
    meal_types=["Dinner", "Lunch"],
    limit=10
)
```

**Expected:** Returns recipes matching specified meal types, no validation errors

**Test Case C - Both Arrays:**
```python
search_recipes(
    cuisine_types=["Italian"],
    meal_types=["Dinner"],
    search="pasta",
    limit=10
)
```

**Expected:** Returns filtered results, no validation errors

**Test Case D - No Arrays (Default):**
```python
search_recipes(
    search="chicken",
    limit=10
)
```

**Expected:** Returns all matching recipes, arrays not included in payload

---

## Full Suite Test Plan

### Recipe Tools (5)

1. **search_recipes**
   - [x] Basic search (text only)
   - [x] Boolean filters (is_favorite, is_pinned, etc.)
   - [x] Single array filter (cuisine_types)
   - [x] Single array filter (meal_types)
   - [x] Multiple array filters combined
   - [x] Pagination (page, limit)

2. **get_recipe**
   - [x] Valid recipe ID
   - [x] Invalid recipe ID (should return error)
   - [x] Recipe with parsed ingredients/instructions

3. **create_recipe**
   - [x] Minimal fields (title, ingredients, instructions)
   - [x] All fields populated
   - [x] With AI parsing enabled (default)
   - [x] With AI parsing disabled
   - [x] Numeric fields as int/float/string

4. **update_recipe**
   - [x] Update single field
   - [x] Update multiple fields
   - [x] Update with AI parsing
   - [x] Numeric fields as int/float/string

5. **delete_recipe**
   - [x] Valid recipe ID
   - [x] User's own recipe
   - [x] Verify soft delete (isDeleted=true)

### Grocery Tools (6)

6. **get_grocery_list**
   - [x] Returns active items
   - [x] Returns completed items (last 7 days)
   - [x] Items organized by section

7. **add_grocery_item**
   - [x] Item with name only
   - [x] Item with quantity and unit
   - [x] Item with recipe association
   - [x] AI section classification occurs

8. **add_multiple_grocery_items**
   - [x] Add 3+ items at once
   - [x] Mix of items with/without quantities
   - [x] Parallel execution (fast)
   - [x] Error handling for invalid items

9. **update_grocery_item**
   - [x] Update name
   - [x] Update quantity
   - [x] Update status (ACTIVE/COMPLETED)
   - [x] Update multiple fields

10. **complete_grocery_items**
    - [x] Complete single item (using array)
    - [x] Complete multiple items (batch)
    - [x] Returns count of completed items

11. **delete_grocery_item**
    - [x] Valid item ID
    - [x] User's own item
    - [x] Permanent deletion (not soft delete)

---

## Error Handling Tests

### Expected Errors (Should Handle Gracefully)

1. **Invalid API Key**
   - Set wrong API key in .env
   - Expected: 401 error with clear message

2. **Invalid User ID**
   - Use non-existent user_id
   - Expected: 404 error "User not found"

3. **Recipe Not Found**
   - Try to get/update/delete non-existent recipe
   - Expected: 404 error "Recipe not found"

4. **Grocery Item Not Found**
   - Try to update/delete non-existent item
   - Expected: 404 error or graceful failure

5. **Missing Required Fields**
   - Create recipe without title/ingredients/instructions
   - Expected: 400 error with validation message

---

## Performance Tests

### AI Classification Performance

**Test:**
```python
# Add common item (should be fast - cache hit)
add_grocery_item(name="Milk", quantity=1)  # ~10-50ms

# Add uncommon item (AI classification)
add_grocery_item(name="Dragon Fruit", quantity=2)  # 1-8 seconds, max 10s timeout

# Add same uncommon item again (should now be cached)
add_grocery_item(name="Dragon Fruit", quantity=1)  # ~10-50ms
```

**Expected:**
- First "Dragon Fruit" takes 1-8 seconds (AI classification)
- Second "Dragon Fruit" is instant (cache hit)
- Common items always fast

### Bulk Operations Performance

**Test:**
```python
# Add 10 items at once
items = [
    {"name": f"Item {i}", "quantity": i}
    for i in range(1, 11)
]
add_multiple_grocery_items(items)
```

**Expected:**
- Parallel execution (faster than sequential)
- All items added or errors reported per-item

---

## Verification Checklist

After running tests, verify:

- [ ] No Prisma validation errors
- [ ] No "unexpected keyword argument" errors
- [ ] No 500 errors (unless database issue)
- [ ] All 11 tools return expected data structures
- [ ] AI classification works (items get sections)
- [ ] Delete operations persist (verify in database/UI)
- [ ] Array filters work without validation errors
- [ ] Numeric type coercion works (int/float/string all accepted)

---

**Version:** 1.0.2
**Last Updated:** 2025-10-20
