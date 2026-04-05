# Recipe Manager MCP Server

A Model Context Protocol (MCP) server for interacting with the Recipe Manager application. This MCP server provides AI assistants with tools to search recipes, manage recipes, and interact with grocery lists.

**Version:** 1.0.3 (Updated 2025-10-20)
**Status:** ✅ All 11 tools fully functional + Sentry error tracking

> **Recent Updates:**
> - v1.0.3: Added Sentry error tracking for all tools. See [SENTRY.md](./SENTRY.md) for setup.
> - v1.0.2: Fixed delete operations and search array parameters. See [BUGFIXES.md](./BUGFIXES.md).

## Overview

This MCP server uses **fastMCP** with **StreamingHTTP** transport to provide real-time access to your recipe database and grocery lists. It's designed to be used with Claude Desktop, Claude Code, or any MCP-compatible client.

## Features

### Recipe Management Tools
- **search_recipes** - Search and filter recipes with advanced options
- **get_recipe** - Get detailed recipe information by ID
- **create_recipe** - Create new recipes with AI parsing
- **update_recipe** - Update existing recipe details
- **delete_recipe** - Soft delete recipes

### Grocery List Tools
- **get_grocery_list** - Retrieve active and completed grocery items
- **add_grocery_item** - Add items to the grocery list
- **add_multiple_grocery_items** - Add multiple items at once (bulk operation)
- **update_grocery_item** - Update grocery item details
- **complete_grocery_items** - Mark items as completed (supports batch)
- **delete_grocery_item** - Permanently remove grocery items

## Installation

### Prerequisites
- Python 3.8 or higher
- Recipe Manager Next.js app running (default: `http://localhost:3000`)
- Valid MCP API key configured in your Next.js app

### Setup

1. **Navigate to the MCP directory:**
   ```bash
   cd mcp
   ```

2. **Create a virtual environment (recommended):**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables:**

   Copy `.env.example` to `.env` and update the values:
   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your configuration:
   ```env
   API_BASE_URL=http://localhost:3000
   MCP_API_KEY=your-mcp-api-key-here
   DEFAULT_USER_ID=your-user-id-here
   DATABASE_URL=your-supabase-connection-string
   ```

   **Important:** The `MCP_API_KEY` must match the key in your Next.js app's `.env` file.

5. **Get your User ID:**

   Query your database to get a valid user ID:
   ```sql
   SELECT id FROM "User" LIMIT 1;
   ```

## Usage

### Running the MCP Server

**Development Mode:**
```bash
python main.py
```

The server will start with StreamingHTTP transport and be ready to accept MCP connections.

### Configuring with Claude Desktop

Add this to your Claude Desktop configuration file:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`

**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "recipe-manager": {
      "command": "python",
      "args": ["/absolute/path/to/mcp/main.py"],
      "env": {
        "API_BASE_URL": "http://localhost:3000",
        "MCP_API_KEY": "your-mcp-api-key-here",
        "DEFAULT_USER_ID": "your-user-id-here"
      },
      "timeout": 60000
    }
  }
}
```

Replace `/absolute/path/to/mcp/main.py` with the actual path to your `main.py` file.

### Configuring with Claude Code

The `mcp.config.json` file in this directory can be used as a reference. Copy the configuration to your Claude Code settings.

## Tool Documentation

### Recipe Tools

#### `search_recipes`
Search and filter recipes with various criteria.

**Parameters:**
- `search` (optional): Text to search in title/description
- `is_favorite` (bool): Filter favorite recipes
- `is_pinned` (bool): Filter pinned recipes
- `is_personal` (bool): Filter user's personal recipes
- `is_public` (bool): Filter public recipes
- `cuisine_types` (optional): List of cuisine types
- `meal_types` (optional): List of meal types
- `page` (int): Page number (default: 1)
- `limit` (int): Results per page (default: 20, max: 64)
- `user_id` (optional): User ID (defaults to DEFAULT_USER_ID)

**Example:**
```python
search_recipes(
    search="pasta",
    cuisine_types=["Italian"],
    meal_types=["Dinner"],
    limit=10
)
```

#### `get_recipe`
Get complete recipe details including ingredients and instructions.

**Parameters:**
- `recipe_id` (required): Recipe UUID
- `user_id` (optional): User ID

**Example:**
```python
get_recipe(recipe_id="abc123...")
```

#### `create_recipe`
Create a new recipe with AI-powered ingredient and instruction parsing.

**Parameters:**
- `title` (required): Recipe title
- `ingredients` (required): Ingredients as text
- `instructions` (required): Instructions as text
- `description` (optional): Brief description
- `prep_time` (optional): Prep time in minutes
- `cook_time` (optional): Cook time in minutes
- `servings` (optional): Number of servings
- `cuisine_type` (optional): Cuisine type
- `meal_type` (optional): Meal type
- `difficulty` (optional): "EASY", "MEDIUM", or "HARD"
- `is_public` (bool): Public visibility (default: True)
- `parse_with_ai` (bool): Use AI parsing (default: True)
- `user_id` (optional): User ID

**Example:**
```python
create_recipe(
    title="Spaghetti Carbonara",
    ingredients="1 lb spaghetti\n4 eggs\n1 cup parmesan",
    instructions="1. Boil pasta\n2. Mix eggs and cheese\n3. Combine",
    cuisine_type="Italian",
    meal_type="Dinner",
    difficulty="MEDIUM"
)
```

#### `update_recipe`
Update an existing recipe. Only provided fields will be updated.

**Parameters:**
- `recipe_id` (required): Recipe UUID
- All fields from `create_recipe` as optional
- `user_id` (optional): User ID

**Example:**
```python
update_recipe(
    recipe_id="abc123...",
    servings=6,
    difficulty="EASY"
)
```

#### `delete_recipe`
Soft delete a recipe (marks as deleted, doesn't remove from database).

**Parameters:**
- `recipe_id` (required): Recipe UUID
- `user_id` (optional): User ID

**Example:**
```python
delete_recipe(recipe_id="abc123...")
```

### Grocery List Tools

#### `get_grocery_list`
Get all grocery items (active + completed from last 7 days).

**Parameters:**
- `user_id` (optional): User ID

**Example:**
```python
get_grocery_list()
```

**Returns:**
```json
{
  "content": {
    "active_items": [...],
    "completed_items": [...],
    "total_active": 10,
    "total_completed": 5
  }
}
```

#### `add_grocery_item`
Add a new item to the grocery list.

**Parameters:**
- `name` (required): Item name
- `quantity` (optional): Quantity
- `quantity_unit` (optional): Unit (e.g., "lbs", "cups")
- `recipe_id` (optional): Associated recipe ID
- `user_id` (optional): User ID

**Example:**
```python
add_grocery_item(
    name="Tomatoes",
    quantity=5,
    quantity_unit="pieces"
)
```

#### `add_multiple_grocery_items`
Add multiple items to the grocery list at once (bulk operation).

**Parameters:**
- `items` (required): List of item dictionaries. Each item should have:
  - `name` (required): Item name
  - `quantity` (optional): Quantity as number
  - `quantity_unit` (optional): Unit of measurement
  - `recipe_id` (optional): Associated recipe ID
- `user_id` (optional): User ID

**Example:**
```python
add_multiple_grocery_items(
    items=[
        {"name": "Tomatoes", "quantity": 5, "quantity_unit": "pieces"},
        {"name": "Milk", "quantity": 1, "quantity_unit": "gallon"},
        {"name": "Bread"},
        {"name": "Chicken", "quantity": 2, "quantity_unit": "lbs"}
    ]
)
```

**Returns:**
```json
{
  "content": {
    "added_items": [...],
    "failed_items": [...],
    "total_requested": 4,
    "total_added": 4,
    "total_failed": 0,
    "message": "Added 4 of 4 items to grocery list"
  }
}
```

#### `update_grocery_item`
Update an existing grocery item.

**Parameters:**
- `item_id` (required): Grocery item UUID
- `name` (optional): New name
- `quantity` (optional): New quantity
- `quantity_unit` (optional): New unit
- `status` (optional): "ACTIVE" or "COMPLETED"
- `user_id` (optional): User ID

**Example:**
```python
update_grocery_item(
    item_id="xyz789...",
    quantity=3,
    status="COMPLETED"
)
```

#### `complete_grocery_items`
Mark one or more items as completed.

**Parameters:**
- `item_ids` (required): List of item UUIDs
- `user_id` (optional): User ID

**Example:**
```python
complete_grocery_items(
    item_ids=["xyz789...", "abc123..."]
)
```

#### `delete_grocery_item`
Permanently delete a grocery item.

**Parameters:**
- `item_id` (required): Grocery item UUID
- `user_id` (optional): User ID

**Example:**
```python
delete_grocery_item(item_id="xyz789...")
```

## Error Handling

All tools return a consistent response format:

**Success:**
```json
{
  "content": { ... },
  "metadata": { ... },
  "isError": false
}
```

**Error:**
```json
{
  "content": {},
  "error": "Error message here",
  "isError": true
}
```

## Development

### Testing Tools

You can test individual tools using the Python REPL:

```python
import asyncio
from main import search_recipes

async def test():
    result = await search_recipes(search="pasta", limit=5)
    print(result)

asyncio.run(test())
```

### Adding New Tools

To add a new tool:

1. Define the function with the `@mcp.tool()` decorator
2. Add comprehensive docstrings (used by AI assistants)
3. Implement error handling with try/except
4. Return consistent response format
5. Update this README with documentation

### Project Structure

```
mcp/
├── main.py              # Main MCP server implementation
├── requirements.txt     # Python dependencies
├── mcp.config.json     # MCP client configuration
├── .env                # Environment variables (not in git)
├── .env.example        # Environment template
└── README.md           # This file
```

## Troubleshooting

### Connection Issues

**Problem:** MCP server can't connect to Next.js API

**Solution:**
1. Ensure Next.js app is running: `npm run dev`
2. Check `API_BASE_URL` in `.env` matches your server
3. Verify firewall isn't blocking localhost connections

### Authentication Errors

**Problem:** "Invalid API key" or "Unauthorized"

**Solution:**
1. Check `MCP_API_KEY` in `mcp/.env` matches the key in `recipe-management-app/.env`
2. Ensure `X-API-Key` header is being sent correctly
3. Verify the API key in the Next.js app is properly configured

### User Not Found

**Problem:** "User not found" error

**Solution:**
1. Query your database to get a valid user ID
2. Update `DEFAULT_USER_ID` in `.env`
3. Or pass a valid `user_id` parameter to each tool

### Timeout Issues

**Problem:** Requests timing out

**Solution:**
1. Increase timeout in `mcp.config.json` (default: 60000ms)
2. Check database connection in Next.js app
3. Ensure Supabase/database is accessible

## Security Notes

- Never commit `.env` file to version control
- Keep your `MCP_API_KEY` secret
- Use environment variables for all sensitive data
- The API key provides full access to user data - treat it like a password
- Consider implementing rate limiting for production use

## License

This MCP server is part of the Recipe Manager application.

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review the Next.js API documentation at `/api/mcp/README.md`
3. Ensure all dependencies are up to date

## Version

**Current Version:** 1.0.0

**fastMCP Version:** Latest

**Transport:** StreamingHTTP
