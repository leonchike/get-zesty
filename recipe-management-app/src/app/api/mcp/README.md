# MCP API Documentation

This directory contains API endpoints designed for MCP (Model Context Protocol) server integration with API key authentication.

## Authentication

All MCP endpoints require API key authentication via header and user identification via request body.

**Required Headers:**
```
X-API-Key: <your-mcp-api-key>
Content-Type: application/json
```

**Required in Request Body:**
```json
{
  "user_id": "user-uuid-here"
}
```

The API key is configured in your `.env` file as `MCP_API_KEY`.

---

## Endpoints

### Recipe Endpoints

#### 1. Search Recipes
Search and filter recipes for a user.

**Endpoint:** `POST /api/mcp/recipes/search`

**Headers:**
```
X-API-Key: <your-mcp-api-key>
Content-Type: application/json
```

**Request Body:**
```json
{
  "user_id": "user-uuid",
  "filters": {
    "search": "chicken",
    "isFavorite": false,
    "isPinned": false,
    "isPersonal": false,
    "isPublic": false,
    "cuisineTypes": ["Italian", "Mexican"],
    "mealTypes": ["Dinner", "Lunch"],
    "page": 1,
    "limit": 20
  }
}
```

**Response:**
```json
{
  "recipes": [...],
  "nextPage": 2,
  "totalCount": 45
}
```

---

#### 2. Get Recipe by ID
Retrieve a specific recipe by ID.

**Endpoint:** `GET /api/mcp/recipes?id=<recipe-id>&user_id=<user-uuid>`

**Headers:**
```
X-API-Key: <your-mcp-api-key>
```

**Query Parameters:**
- `id` (required): Recipe ID
- `user_id` (required): User UUID

**Response:**
```json
{
  "id": "recipe-uuid",
  "title": "Chicken Parmesan",
  "description": "Classic Italian dish",
  "ingredients": "...",
  "instructions": "...",
  "imageUrl": "https://...",
  ...
}
```

---

#### 3. Create Recipe
Create a new recipe for a user.

**Endpoint:** `POST /api/mcp/recipes`

**Headers:**
```
X-API-Key: <your-mcp-api-key>
Content-Type: application/json
```

**Request Body:**
```json
{
  "user_id": "user-uuid",
  "recipe": {
    "title": "My New Recipe",
    "description": "A delicious recipe",
    "ingredients": "1 cup flour\n2 eggs",
    "instructions": "1. Mix ingredients\n2. Bake at 350F",
    "prepTime": 15,
    "cookTime": 30,
    "servings": 4,
    "cuisineType": "Italian",
    "mealType": "Dinner",
    "difficulty": "EASY",
    "imageUrl": "https://...",
    "sourceUrl": null,
    "source": "USER_CREATED",
    "isPublic": true
  },
  "parseWithAI": true
}
```

**Response:**
```json
{
  "id": "new-recipe-uuid"
}
```

---

#### 4. Update Recipe
Update an existing recipe.

**Endpoint:** `PUT /api/mcp/recipes`

**Headers:**
```
X-API-Key: <your-mcp-api-key>
Content-Type: application/json
```

**Request Body:**
```json
{
  "user_id": "user-uuid",
  "id": "recipe-uuid",
  "recipe": {
    "title": "Updated Recipe Title",
    "description": "Updated description",
    "servings": 6
  },
  "parseWithAI": false
}
```

**Response:**
```json
{
  "id": "recipe-uuid",
  "title": "Updated Recipe Title",
  ...
}
```

---

#### 5. Delete Recipe
Soft delete a recipe (marks as deleted, doesn't permanently remove).

**Endpoint:** `DELETE /api/mcp/recipes`

**Headers:**
```
X-API-Key: <your-mcp-api-key>
Content-Type: application/json
```

**Request Body:**
```json
{
  "user_id": "user-uuid",
  "id": "recipe-uuid"
}
```

**Response:**
```json
{
  "id": "recipe-uuid"
}
```

---

### Grocery Endpoints

#### 6. Get Grocery List
Retrieve user's grocery list (active items + completed items from last 7 days).

**Endpoint:** `GET /api/mcp/groceries?user_id=<user-uuid>`

**Headers:**
```
X-API-Key: <your-mcp-api-key>
```

**Query Parameters:**
- `user_id` (required): User UUID

**Response:**
```json
{
  "groceries": [
    {
      "id": "grocery-uuid",
      "name": "Chicken Breast",
      "quantity": 2,
      "quantityUnit": "lbs",
      "status": "ACTIVE",
      "recipeId": "recipe-uuid",
      "sectionId": "section-uuid",
      "section": {
        "id": "section-uuid",
        "name": "Meat"
      },
      "recipe": {
        "id": "recipe-uuid",
        "title": "Chicken Parmesan"
      }
    }
  ]
}
```

---

#### 7. Create Grocery Item
Add a new item to the grocery list with automatic AI-powered section classification.

**Features:**
- Automatically classifies items into grocery sections (Produce, Meat, Dairy, etc.)
- Uses cached classifications from common grocery items for fast processing
- Falls back to AI classification for new/unknown items
- Stores successful classifications for future use

**Endpoint:** `POST /api/mcp/groceries`

**Headers:**
```
X-API-Key: <your-mcp-api-key>
Content-Type: application/json
```

**Request Body:**
```json
{
  "user_id": "user-uuid",
  "item": {
    "name": "Tomatoes",
    "quantity": 5,
    "quantityUnit": "pieces",
    "recipeId": null
  }
}
```

**Response:**
```json
{
  "grocery": {
    "id": "new-grocery-uuid",
    "name": "Tomatoes",
    "quantity": 5,
    "quantityUnit": "pieces",
    "status": "ACTIVE",
    ...
  }
}
```

---

#### 8. Update Grocery Item
Update an existing grocery item.

**Endpoint:** `PATCH /api/mcp/groceries`

**Headers:**
```
X-API-Key: <your-mcp-api-key>
Content-Type: application/json
```

**Request Body:**
```json
{
  "user_id": "user-uuid",
  "item": {
    "id": "grocery-uuid",
    "quantity": 3,
    "status": "COMPLETED"
  }
}
```

**Response:**
```json
{
  "grocery": {
    "id": "grocery-uuid",
    "quantity": 3,
    "status": "COMPLETED",
    ...
  }
}
```

---

#### 9. Complete Grocery Item(s)
Mark grocery item(s) as completed.

**Endpoint:** `POST /api/mcp/groceries/complete`

**Headers:**
```
X-API-Key: <your-mcp-api-key>
Content-Type: application/json
```

**Request Body (Single Item):**
```json
{
  "user_id": "user-uuid",
  "id": "grocery-uuid"
}
```

**Request Body (Multiple Items):**
```json
{
  "user_id": "user-uuid",
  "ids": ["grocery-uuid-1", "grocery-uuid-2", "grocery-uuid-3"]
}
```

**Response:**
```json
{
  "count": 3,
  "groceries": [...]
}
```

---

#### 10. Delete Grocery Item
Permanently delete a grocery item.

**Endpoint:** `DELETE /api/mcp/groceries`

**Headers:**
```
X-API-Key: <your-mcp-api-key>
Content-Type: application/json
```

**Request Body:**
```json
{
  "user_id": "user-uuid",
  "id": "grocery-uuid"
}
```

**Response:**
```json
{
  "id": "grocery-uuid"
}
```

---

## Testing with Postman

### Setup

1. **Get your API Key:**
   - Check your `.env` file for the `MCP_API_KEY` value

2. **Get a User ID:**
   - You need a valid user UUID from your database
   - Query your database: `SELECT id FROM "User" LIMIT 1;`

3. **Set up Postman Environment Variables:**
   - Create a new environment in Postman
   - Add variable: `mcp_api_key` = `<your-key-from-env>`
   - Add variable: `user_id` = `<valid-user-uuid>`
   - Add variable: `base_url` = `http://localhost:3000` (or your deployment URL)

### Example Requests

#### Example 1: Search Recipes

```
POST {{base_url}}/api/mcp/recipes/search
```

Headers:
```
X-API-Key: {{mcp_api_key}}
Content-Type: application/json
```

Body (raw JSON):
```json
{
  "user_id": "{{user_id}}",
  "filters": {
    "search": "pasta",
    "limit": 10
  }
}
```

---

#### Example 2: Get Grocery List

```
GET {{base_url}}/api/mcp/groceries?user_id={{user_id}}
```

Headers:
```
X-API-Key: {{mcp_api_key}}
```

---

#### Example 3: Add Grocery Item

```
POST {{base_url}}/api/mcp/groceries
```

Headers:
```
X-API-Key: {{mcp_api_key}}
Content-Type: application/json
```

Body (raw JSON):
```json
{
  "user_id": "{{user_id}}",
  "item": {
    "name": "Milk",
    "quantity": 1,
    "quantityUnit": "gallon"
  }
}
```

---

#### Example 4: Complete Grocery Item

```
POST {{base_url}}/api/mcp/groceries/complete
```

Headers:
```
X-API-Key: {{mcp_api_key}}
Content-Type: application/json
```

Body (raw JSON):
```json
{
  "user_id": "{{user_id}}",
  "id": "<grocery-item-id-from-previous-response>"
}
```

---

## Error Responses

All endpoints return standard error responses:

**401 Unauthorized:**
```json
{
  "error": "Missing X-API-Key header"
}
```
or
```json
{
  "error": "Invalid API key"
}
```

**400 Bad Request:**
```json
{
  "error": "Missing user_id in request body"
}
```

**404 Not Found:**
```json
{
  "error": "Recipe not found"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Failed to fetch recipes"
}
```

---

## Notes

- All recipe operations respect user ownership and public/private settings
- Grocery operations are user-scoped and verified before modification
- The `parseWithAI` parameter in recipe creation/update enables AI parsing of ingredients and instructions
- Recipe difficulty values: `EASY`, `MEDIUM`, `HARD`
- Recipe source values: `USER_CREATED`, `SCRAPED`, `AI_GENERATED`
- Grocery item status values: `ACTIVE`, `COMPLETED`, `DELETED`

---

## Development

To test locally:
1. Start your Next.js development server: `npm run dev`
2. Use `http://localhost:3000` as your base URL
3. Ensure your `.env` file has `MCP_API_KEY` set
4. Get a valid user ID from your database

For production, replace the base URL with your deployment URL.
