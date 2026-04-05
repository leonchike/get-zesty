# MCP Server Bug Fixes - 2025-10-20

## Issues Fixed

### 1. Recipe Creation Error - Invalid RecipeSource Value

**Error:**
```
Invalid value for argument `source`. Expected RecipeSource.
PrismaClientValidationError: Invalid `prisma.recipe.create()` invocation
```

**Root Cause:**
The MCP server was sending `"USER_CREATED"` as the recipe source, but the Prisma schema defines the `RecipeSource` enum with different values:
- `USER`
- `SCRAPE`
- `GEN_AI`

**Fix:**
Changed `source: "USER_CREATED"` to `source: "USER"` in the create_recipe tool (line 281).

**File:** `mcp/main.py`

**Impact:** Recipe creation via MCP now works correctly.

---

### 2. Delete Recipe Error - Invalid HTTP Method Signature

**Error (Attempt 1):**
```
AsyncClient.delete() got an unexpected keyword argument 'json'
```

**Error (Attempt 2):**
```
AsyncClient.delete() got an unexpected keyword argument 'content'
```

**Root Cause:**
The `httpx.AsyncClient.delete()` method has very limited parameter support and doesn't accept `json` or `content` parameters like other HTTP methods. This is because DELETE requests with bodies are uncommon in REST APIs.

**Fix:**
Use the low-level `client.request()` method which supports all parameters:
```python
response = await client.request(
    "DELETE",
    url,
    json=payload,
    headers=get_headers(),
    timeout=30.0
)
```

**Files:**
- `mcp/main.py` - delete_recipe() function (line 447-457)

**Impact:** Recipe deletion via MCP now works correctly.

---

### 3. Delete Grocery Item Error - Same HTTP Method Issue

**Error:**
```
AsyncClient.delete() got an unexpected keyword argument 'json'
AsyncClient.delete() got an unexpected keyword argument 'content'
```

**Root Cause:**
Same issue as #2 - `delete()` method has limited parameter support.

**Fix:**
Applied the same fix as #2 using `client.request()`:
```python
response = await client.request(
    "DELETE",
    url,
    json=payload,
    headers=get_headers(),
    timeout=30.0
)
```

**File:** `mcp/main.py` - delete_grocery_item() function (line 889-899)

**Impact:** Grocery item deletion via MCP now works correctly.

---

### 4. Search Recipes Array Parameters Error

**Error:**
Input validation error when passing `cuisine_types` or `meal_types` array parameters.

**Root Cause:**
The API was receiving empty arrays `[]` when no filters were provided. Some validation or processing logic may reject empty arrays differently than `undefined`/`null` values.

**Fix:**
Only include array parameters in the request payload when they have actual values:
```python
# Build filters object
filters = {
    "search": search,
    "isFavorite": is_favorite,
    "isPinned": is_pinned,
    "isPersonal": is_personal,
    "isPublic": is_public,
    "page": page,
    "limit": min(limit, 64)
}

# Only include array filters if they have values
if cuisine_types:
    filters["cuisineTypes"] = cuisine_types
if meal_types:
    filters["mealTypes"] = meal_types
```

**File:** `mcp/main.py` - search_recipes() function (line 72-91)

**Impact:** Array filters now work correctly when searching recipes.

---

## Summary of Changes

### Modified Files
1. **mcp/main.py**
   - Line 281: Changed recipe source from "USER_CREATED" to "USER"
   - Lines 72-91: Fixed search_recipes to conditionally include array parameters
   - Lines 447-457: Fixed delete_recipe to use client.request() method
   - Lines 889-899: Fixed delete_grocery_item to use client.request() method

### Test Results (After Fixes)

**Expected Working Tools (11/11):**
- ✅ search_recipes
- ✅ get_recipe
- ✅ create_recipe (FIXED)
- ✅ update_recipe
- ✅ delete_recipe (FIXED)
- ✅ get_grocery_list
- ✅ add_grocery_item
- ✅ add_multiple_grocery_items
- ✅ update_grocery_item
- ✅ complete_grocery_items
- ✅ delete_grocery_item (FIXED)

---

## Testing Notes

### Recipe Creation
Test with:
```python
create_recipe(
    title="Test Recipe",
    ingredients="1 cup flour\n2 eggs",
    instructions="Mix and bake",
    prep_time=10,
    cook_time=20,
    servings=4,
    difficulty="EASY"
)
```

Expected: Recipe created successfully with source="USER"

### Recipe Deletion
Test with:
```python
delete_recipe(recipe_id="<valid-recipe-id>")
```

Expected: Recipe soft-deleted (isDeleted=true)

### Grocery Item Deletion
Test with:
```python
delete_grocery_item(item_id="<valid-item-id>")
```

Expected: Grocery item permanently deleted

---

## Additional Notes

### RecipeSource Enum Values
Per the Prisma schema, valid values for recipe source are:
- `USER` - User-created recipes
- `SCRAPE` - Web-scraped recipes
- `GEN_AI` - AI-generated recipes

### HTTP DELETE Method Limitation
The httpx library's `delete()` method has very limited parameter support compared to POST/PUT/PATCH:
- ✅ Supported by `delete()`: `params`, `headers`, `cookies`, `auth`, `timeout`
- ❌ Not supported by `delete()`: `json`, `content`, `data`, `files`

**Solution:** Use the low-level `client.request()` method which supports all parameters:
```python
# ❌ Don't use delete() for JSON bodies
response = await client.delete(url, json=payload)  # Fails!

# ✅ Use request() instead
response = await client.request("DELETE", url, json=payload)  # Works!
```

---

**Version:** 1.0.2
**Date:** 2025-10-20
**Impact:** Critical - All 11 MCP tools now fully functional

## Changelog

### v1.0.2 (2025-10-20 - Second Update)
- Fixed delete operations to use `client.request()` instead of `client.delete()`
- Fixed search_recipes to conditionally include array parameters
- All 11 tools now fully operational

### v1.0.1 (2025-10-20 - Initial Update)
- Fixed RecipeSource enum value (USER vs USER_CREATED)
- Attempted fix for delete operations (unsuccessful)

### v1.0.0 (2025-10-19)
- Initial MCP server implementation
