from fastmcp import FastMCP
import httpx
from typing import List, Dict, Any, Optional, Union
import os
import asyncio
import json
from dotenv import load_dotenv
import sentry_sdk

# Load environment variables from .env file
load_dotenv()

# Initialize Sentry for error tracking
SENTRY_DSN = os.getenv("SENTRY_DSN", "")
if SENTRY_DSN:
    sentry_sdk.init(
        dsn=SENTRY_DSN,
        traces_sample_rate=1.0,  # Capture 100% of transactions for performance monitoring
        profiles_sample_rate=1.0,  # Capture 100% of profiles
        environment=os.getenv("SENTRY_ENVIRONMENT", "production"),
        release=os.getenv("SENTRY_RELEASE", "unknown"),
    )
    print("[MCP Server] Sentry initialized successfully")
else:
    print("[MCP Server] Sentry disabled (no SENTRY_DSN found)")

mcp = FastMCP(name="Recipe Manager MCP")

# API Configuration - use environment variables for security
API_BASE = os.getenv("API_BASE_URL", "http://localhost:8000")
API_KEY = os.getenv("MCP_API_KEY", "")
DEFAULT_USER_ID = os.getenv("DEFAULT_USER_ID", "clzej3dqz0000inntk5x0bqre")

# Debug: Print configuration on startup (remove in production)
print(f"[MCP Server] API_BASE: {API_BASE}")
print(f"[MCP Server] API_KEY loaded: {'Yes' if API_KEY else 'No'}")
print(f"[MCP Server] DEFAULT_USER_ID: {DEFAULT_USER_ID}")


def get_headers() -> Dict[str, str]:
    """Get headers for API requests."""
    return {
        "X-API-Key": API_KEY,
        "Content-Type": "application/json"
    }


def capture_exception(error: Exception, context: Dict[str, Any] = None) -> None:
    """
    Capture an exception in Sentry with additional context.

    Args:
        error: The exception to capture
        context: Additional context information (tool name, parameters, etc.)
    """
    if SENTRY_DSN:
        with sentry_sdk.push_scope() as scope:
            # Add custom context if provided
            if context:
                for key, value in context.items():
                    scope.set_context(key, value)

            # Add error details
            if isinstance(error, httpx.HTTPStatusError):
                scope.set_context("http_error", {
                    "status_code": error.response.status_code,
                    "response_text": error.response.text[:500],
                    "url": str(error.request.url)
                })

            # Capture the exception
            sentry_sdk.capture_exception(error)
    else:
        # Log to console if Sentry not configured
        print(f"[Error] {type(error).__name__}: {str(error)}")


# ============================================================================
# RECIPE TOOLS
# ============================================================================


@mcp.tool()
async def search_recipes(
    search: Optional[str] = None,
    is_favorite: bool = False,
    is_pinned: bool = False,
    is_personal: bool = True,
    is_public: bool = False,
    cuisine_types: Optional[List[str]] = None,
    meal_types: Optional[List[str]] = None,
    page: int = 1,
    limit: int = 20,
) -> Dict[str, Any]:
    """
    Search and filter recipes in the recipe database.

    Args:
        search: Text search query for recipe title or description
        is_favorite: Filter for favorite recipes only
        is_pinned: Filter for pinned recipes only
        is_personal: Filter for user's personal recipes only
        is_public: Filter for public recipes only
        cuisine_types: List of cuisine types to filter by (e.g., ["Italian", "Mexican"])
        meal_types: List of meal types to filter by (e.g., ["Dinner", "Lunch"])
        page: Page number for pagination (default: 1)
        limit: Number of results per page (default: 20, max: 64)

    Returns:
        Dictionary containing recipe results, pagination info, and metadata
    """
    try:
        url = f"{API_BASE}/api/mcp/recipes/search"

        # Build filters object, only include array fields if they have values
        filters = {
            "search": search,
            "isFavorite": is_favorite,
            "isPinned": is_pinned,
            "isPersonal": is_personal,
            "isPublic": is_public,
            "page": page,
            "limit": min(limit, 64)  # Cap at 64
        }

        # Only include array filters if they have values
        if cuisine_types:
            filters["cuisineTypes"] = cuisine_types
        if meal_types:
            filters["mealTypes"] = meal_types

        payload = {
            "user_id": DEFAULT_USER_ID,
            "filters": filters
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, headers=get_headers(), timeout=30.0)
            response.raise_for_status()
            data = response.json()

        # Format recipes for better LLM consumption
        recipes = data.get("recipes", [])
        formatted_recipes = []

        for recipe in recipes:
            formatted_recipe = {
                "id": recipe.get("id"),
                "title": recipe.get("title"),
                "description": recipe.get("description", ""),
                "cuisine_type": recipe.get("cuisineType"),
                "meal_type": recipe.get("mealType"),
                "difficulty": recipe.get("difficulty"),
                "prep_time": recipe.get("prepTime"),
                "cook_time": recipe.get("cookTime"),
                "servings": recipe.get("servings"),
                "is_public": recipe.get("isPublic"),
                "source": recipe.get("source"),
                "image_url": recipe.get("imageUrl"),
            }
            formatted_recipes.append(formatted_recipe)

        return {
            "content": formatted_recipes,
            "metadata": {
                "total_count": data.get("totalCount", 0),
                "current_page": page,
                "next_page": data.get("nextPage"),
                "results_count": len(formatted_recipes)
            },
            "isError": False
        }

    except httpx.HTTPStatusError as e:
        capture_exception(e, {
            "tool": "search_recipes",
            "params": {"search": search, "page": page, "limit": limit, "user_id": user_id},
            "status_code": e.response.status_code,
            "response": e.response.text[:500]  # First 500 chars
        })
        return {
            "content": [],
            "error": f"HTTP error occurred: {e.response.status_code} - {e.response.text}",
            "isError": True
        }
    except Exception as e:
        capture_exception(e, {
            "tool": "search_recipes",
            "params": {"search": search, "page": page, "limit": limit, "user_id": user_id}
        })
        return {
            "content": [],
            "error": f"An error occurred: {str(e)}",
            "isError": True
        }


@mcp.tool()
async def get_recipe(
    recipe_id: str,
) -> Dict[str, Any]:
    """
    Get detailed information for a specific recipe by ID.

    Args:
        recipe_id: The unique identifier of the recipe

    Returns:
        Dictionary containing complete recipe details including ingredients and instructions
    """
    try:
        url = f"{API_BASE}/api/mcp/recipes?id={recipe_id}&user_id={DEFAULT_USER_ID}"

        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=get_headers(), timeout=30.0)
            response.raise_for_status()
            recipe = response.json()

        # Format recipe with all details
        formatted_recipe = {
            "id": recipe.get("id"),
            "title": recipe.get("title"),
            "description": recipe.get("description"),
            "ingredients": recipe.get("ingredients"),
            "instructions": recipe.get("instructions"),
            "parsed_ingredients": recipe.get("parsedIngredients"),
            "parsed_instructions": recipe.get("parsedInstructions"),
            "cuisine_type": recipe.get("cuisineType"),
            "meal_type": recipe.get("mealType"),
            "difficulty": recipe.get("difficulty"),
            "prep_time": recipe.get("prepTime"),
            "cook_time": recipe.get("cookTime"),
            "rest_time": recipe.get("restTime"),
            "servings": recipe.get("servings"),
            "notes": recipe.get("notes"),
            "utensils": recipe.get("utensils"),
            "nutrition": recipe.get("nutrition"),
            "is_public": recipe.get("isPublic"),
            "source": recipe.get("source"),
            "source_url": recipe.get("sourceUrl"),
            "image_url": recipe.get("imageUrl"),
            "created_at": recipe.get("createdAt"),
            "updated_at": recipe.get("updatedAt")
        }

        return {
            "content": formatted_recipe,
            "isError": False
        }

    except httpx.HTTPStatusError as e:
        return {
            "content": {},
            "error": f"HTTP error occurred: {e.response.status_code} - {e.response.text}",
            "isError": True
        }
    except Exception as e:
        return {
            "content": {},
            "error": f"An error occurred: {str(e)}",
            "isError": True
        }


@mcp.tool()
async def create_recipe(
    title: str,
    ingredients: str,
    instructions: str,
    description: Optional[str] = None,
    prep_time: Union[int, float, str, None] = None,
    cook_time: Union[int, float, str, None] = None,
    servings: Union[int, float, str, None] = None,
    cuisine_type: Optional[str] = None,
    meal_type: Optional[str] = None,
    difficulty: str = "EASY",
    is_public: bool = False,
    parse_with_ai: bool = True,
) -> Dict[str, Any]:
    """
    Create a new recipe in the database.

    Args:
        title: Recipe title (required)
        ingredients: Recipe ingredients as text (required)
        instructions: Recipe instructions as text (required)
        description: Brief description of the recipe
        prep_time: Preparation time in minutes (accepts int, float, or string)
        cook_time: Cooking time in minutes (accepts int, float, or string)
        servings: Number of servings (accepts int, float, or string)
        cuisine_type: Type of cuisine (e.g., "Italian", "Mexican")
        meal_type: Type of meal (e.g., "Dinner", "Lunch", "Breakfast")
        difficulty: Recipe difficulty - "EASY", "MEDIUM", or "HARD" (default: "EASY")
        is_public: Whether recipe is publicly visible (default: False)
        parse_with_ai: Use AI to parse ingredients and instructions (default: True)

    Returns:
        Dictionary containing the created recipe ID
    """
    try:
        url = f"{API_BASE}/api/mcp/recipes"

        # Convert numeric values to int
        prep_time_int = None
        if prep_time is not None:
            try:
                prep_time_int = int(float(prep_time))
            except (ValueError, TypeError):
                pass

        cook_time_int = None
        if cook_time is not None:
            try:
                cook_time_int = int(float(cook_time))
            except (ValueError, TypeError):
                pass

        servings_int = None
        if servings is not None:
            try:
                servings_int = int(float(servings))
            except (ValueError, TypeError):
                pass

        payload = {
            "user_id": DEFAULT_USER_ID,
            "recipe": {
                "title": title,
                "description": description,
                "ingredients": ingredients,
                "instructions": instructions,
                "prepTime": prep_time_int,
                "cookTime": cook_time_int,
                "servings": servings_int,
                "cuisineType": cuisine_type,
                "mealType": meal_type,
                "difficulty": difficulty,
                "isPublic": is_public,
                "source": "USER"  # Fixed: Changed from "USER_CREATED" to match RecipeSource enum
            },
            "parseWithAI": parse_with_ai
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, headers=get_headers(), timeout=60.0)
            response.raise_for_status()
            data = response.json()

        return {
            "content": {
                "recipe_id": data.get("id"),
                "message": f"Recipe '{title}' created successfully"
            },
            "isError": False
        }

    except httpx.HTTPStatusError as e:
        capture_exception(e, {
            "tool": "create_recipe",
            "params": {"title": title, "cuisine_type": cuisine_type, "user_id": user_id}
        })
        return {
            "content": {},
            "error": f"HTTP error occurred: {e.response.status_code} - {e.response.text}",
            "isError": True
        }
    except Exception as e:
        capture_exception(e, {
            "tool": "create_recipe",
            "params": {"title": title, "cuisine_type": cuisine_type, "user_id": user_id}
        })
        return {
            "content": {},
            "error": f"An error occurred: {str(e)}",
            "isError": True
        }


@mcp.tool()
async def update_recipe(
    recipe_id: str,
    title: Optional[str] = None,
    description: Optional[str] = None,
    ingredients: Optional[str] = None,
    instructions: Optional[str] = None,
    prep_time: Union[int, float, str, None] = None,
    cook_time: Union[int, float, str, None] = None,
    servings: Union[int, float, str, None] = None,
    cuisine_type: Optional[str] = None,
    meal_type: Optional[str] = None,
    difficulty: Optional[str] = None,
    is_public: Optional[bool] = None,
    parse_with_ai: bool = True,
) -> Dict[str, Any]:
    """
    Update an existing recipe. Only provided fields will be updated.

    Args:
        recipe_id: The unique identifier of the recipe to update (required)
        title: New recipe title
        description: New description
        ingredients: New ingredients text
        instructions: New instructions text
        prep_time: New preparation time in minutes (accepts int, float, or string)
        cook_time: New cooking time in minutes (accepts int, float, or string)
        servings: New number of servings (accepts int, float, or string)
        cuisine_type: New cuisine type
        meal_type: New meal type
        difficulty: New difficulty ("EASY", "MEDIUM", or "HARD")
        is_public: New public visibility setting
        parse_with_ai: Use AI to parse ingredients and instructions (default: True)

    Returns:
        Dictionary containing the updated recipe information
    """
    try:
        url = f"{API_BASE}/api/mcp/recipes"

        # Build recipe update object with only provided fields
        recipe_update = {}
        if title is not None:
            recipe_update["title"] = title
        if description is not None:
            recipe_update["description"] = description
        if ingredients is not None:
            recipe_update["ingredients"] = ingredients
        if instructions is not None:
            recipe_update["instructions"] = instructions
        if prep_time is not None:
            try:
                recipe_update["prepTime"] = int(float(prep_time))
            except (ValueError, TypeError):
                pass
        if cook_time is not None:
            try:
                recipe_update["cookTime"] = int(float(cook_time))
            except (ValueError, TypeError):
                pass
        if servings is not None:
            try:
                recipe_update["servings"] = int(float(servings))
            except (ValueError, TypeError):
                pass
        if cuisine_type is not None:
            recipe_update["cuisineType"] = cuisine_type
        if meal_type is not None:
            recipe_update["mealType"] = meal_type
        if difficulty is not None:
            recipe_update["difficulty"] = difficulty
        if is_public is not None:
            recipe_update["isPublic"] = is_public

        payload = {
            "user_id": DEFAULT_USER_ID,
            "id": recipe_id,
            "recipe": recipe_update,
            "parseWithAI": parse_with_ai
        }

        async with httpx.AsyncClient() as client:
            response = await client.put(url, json=payload, headers=get_headers(), timeout=60.0)
            response.raise_for_status()
            data = response.json()

        return {
            "content": {
                "recipe_id": data.get("id"),
                "message": "Recipe updated successfully"
            },
            "isError": False
        }

    except httpx.HTTPStatusError as e:
        capture_exception(e, {
            "tool": "update_recipe",
            "params": {"recipe_id": recipe_id, "user_id": user_id}
        })
        return {
            "content": {},
            "error": f"HTTP error occurred: {e.response.status_code} - {e.response.text}",
            "isError": True
        }
    except Exception as e:
        capture_exception(e, {
            "tool": "update_recipe",
            "params": {"recipe_id": recipe_id, "user_id": user_id}
        })
        return {
            "content": {},
            "error": f"An error occurred: {str(e)}",
            "isError": True
        }


@mcp.tool()
async def delete_recipe(
    recipe_id: str,
) -> Dict[str, Any]:
    """
    Delete a recipe (soft delete - marks as deleted but doesn't remove from database).

    Args:
        recipe_id: The unique identifier of the recipe to delete (required)

    Returns:
        Dictionary confirming the deletion
    """
    try:
        url = f"{API_BASE}/api/mcp/recipes"

        payload = {
            "user_id": DEFAULT_USER_ID,
            "id": recipe_id
        }

        # Use request() method for DELETE with JSON body (delete() has limited parameter support)
        async with httpx.AsyncClient() as client:
            response = await client.request(
                "DELETE",
                url,
                json=payload,
                headers=get_headers(),
                timeout=30.0
            )
            response.raise_for_status()
            data = response.json()

        return {
            "content": {
                "recipe_id": data.get("id"),
                "message": "Recipe deleted successfully"
            },
            "isError": False
        }

    except httpx.HTTPStatusError as e:
        capture_exception(e, {
            "tool": "delete_recipe",
            "params": {"recipe_id": recipe_id, "user_id": user_id}
        })
        return {
            "content": {},
            "error": f"HTTP error occurred: {e.response.status_code} - {e.response.text}",
            "isError": True
        }
    except Exception as e:
        capture_exception(e, {
            "tool": "delete_recipe",
            "params": {"recipe_id": recipe_id, "user_id": user_id}
        })
        return {
            "content": {},
            "error": f"An error occurred: {str(e)}",
            "isError": True
        }


# ============================================================================
# GROCERY LIST TOOLS
# ============================================================================

@mcp.tool()
async def get_grocery_list(include_completed: bool = False) -> Dict[str, Any]:
    """
    Get the user's grocery list.

    Args:
        include_completed: If True, includes completed items from last 7 days. Default is False (active items only).

    Returns:
        Dictionary containing grocery items organized by section
    """
    try:
        include_completed_param = "true" if include_completed else "false"
        url = f"{API_BASE}/api/mcp/groceries?user_id={DEFAULT_USER_ID}&includeCompleted={include_completed_param}"

        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=get_headers(), timeout=30.0)
            response.raise_for_status()
            data = response.json()

        groceries = data.get("groceries", [])

        # Organize by section and status
        active_items = []
        completed_items = []

        for item in groceries:
            formatted_item = {
                "id": item.get("id"),
                "name": item.get("name"),
                "quantity": item.get("quantity"),
                "quantity_unit": item.get("quantityUnit"),
                "status": item.get("status"),
                "section": item.get("section", {}).get("name") if item.get("section") else None,
                "recipe": item.get("recipe", {}).get("title") if item.get("recipe") else None,
                "recipe_id": item.get("recipeId")
            }

            if item.get("status") == "ACTIVE":
                active_items.append(formatted_item)
            else:
                completed_items.append(formatted_item)

        return {
            "content": {
                "active_items": active_items,
                "completed_items": completed_items,
                "total_active": len(active_items),
                "total_completed": len(completed_items)
            },
            "isError": False
        }

    except httpx.HTTPStatusError as e:
        return {
            "content": {},
            "error": f"HTTP error occurred: {e.response.status_code} - {e.response.text}",
            "isError": True
        }
    except Exception as e:
        return {
            "content": {},
            "error": f"An error occurred: {str(e)}",
            "isError": True
        }


@mcp.tool()
async def add_grocery_item(
    name: str,
    quantity: Union[int, float, str, None] = None,
    quantity_unit: Optional[str] = None,
    recipe_id: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Add a new item to the grocery list.

    Args:
        name: Name of the grocery item (required)
        quantity: Quantity of the item (accepts int, float, or string that can be converted to int)
        quantity_unit: Unit of measurement (e.g., "lbs", "cups", "pieces")
        recipe_id: Associated recipe ID if item is from a recipe

    Returns:
        Dictionary containing the created grocery item
    """
    try:
        url = f"{API_BASE}/api/mcp/groceries"

        # Cast quantity to int if provided (handles int, float, or string)
        quantity_value = None
        if quantity is not None:
            try:
                # Convert via float to handle both int and float strings
                quantity_value = int(float(quantity))
            except (ValueError, TypeError):
                quantity_value = None

        payload = {
            "user_id": DEFAULT_USER_ID,
            "item": {
                "name": name,
                "quantity": quantity_value,
                "quantityUnit": quantity_unit,
                "recipeId": recipe_id
            }
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, headers=get_headers(), timeout=30.0)
            response.raise_for_status()
            data = response.json()

        grocery = data.get("grocery", {})
        formatted_item = {
            "id": grocery.get("id"),
            "name": grocery.get("name"),
            "quantity": grocery.get("quantity"),
            "quantity_unit": grocery.get("quantityUnit"),
            "status": grocery.get("status"),
            "section": grocery.get("section", {}).get("name") if grocery.get("section") else None
        }

        return {
            "content": {
                "item": formatted_item,
                "message": f"Added '{name}' to grocery list"
            },
            "isError": False
        }

    except httpx.HTTPStatusError as e:
        capture_exception(e, {
            "tool": "add_grocery_item",
            "params": {"name": name, "user_id": user_id}
        })
        return {
            "content": {},
            "error": f"HTTP error occurred: {e.response.status_code} - {e.response.text}",
            "isError": True
        }
    except Exception as e:
        capture_exception(e, {
            "tool": "add_grocery_item",
            "params": {"name": name, "user_id": user_id}
        })
        return {
            "content": {},
            "error": f"An error occurred: {str(e)}",
            "isError": True
        }


@mcp.tool()
async def add_multiple_grocery_items(
    items: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """
    Add multiple items to the grocery list at once (bulk operation).

    Args:
        items: List of items to add. Each item should be a dict with:
            - name (required): Item name
            - quantity (optional): Quantity as number
            - quantity_unit (optional): Unit of measurement
            - recipe_id (optional): Associated recipe ID

    Returns:
        Dictionary containing summary of added items and any errors

    Example:
        items = [
            {"name": "Tomatoes", "quantity": 5, "quantity_unit": "pieces"},
            {"name": "Milk", "quantity": 1, "quantity_unit": "gallon"},
            {"name": "Bread"}
        ]
    """
    try:
        url = f"{API_BASE}/api/mcp/groceries"

        # Create tasks for parallel execution
        async def add_single_item(item: Dict[str, Any]):
            try:
                # Validate required field
                if "name" not in item:
                    return {"success": False, "error": "Missing 'name' field", "item": item}

                # Cast quantity to int if provided (handles int, float, or string)
                quantity_value = None
                if item.get("quantity") is not None:
                    try:
                        quantity_value = int(float(item["quantity"]))
                    except (ValueError, TypeError):
                        quantity_value = None

                payload = {
                    "user_id": DEFAULT_USER_ID,
                    "item": {
                        "name": item["name"],
                        "quantity": quantity_value,
                        "quantityUnit": item.get("quantity_unit"),
                        "recipeId": item.get("recipe_id")
                    }
                }

                async with httpx.AsyncClient() as client:
                    response = await client.post(url, json=payload, headers=get_headers(), timeout=30.0)
                    response.raise_for_status()
                    data = response.json()

                grocery = data.get("grocery", {})
                return {
                    "success": True,
                    "item": {
                        "id": grocery.get("id"),
                        "name": grocery.get("name"),
                        "quantity": grocery.get("quantity"),
                        "quantity_unit": grocery.get("quantityUnit")
                    }
                }
            except Exception as e:
                return {
                    "success": False,
                    "error": str(e),
                    "item": item.get("name", "unknown")
                }

        # Execute all additions in parallel
        results = await asyncio.gather(*[add_single_item(item) for item in items])

        # Separate successful and failed additions
        successful = [r for r in results if r.get("success")]
        failed = [r for r in results if not r.get("success")]

        return {
            "content": {
                "added_items": [r["item"] for r in successful],
                "failed_items": failed,
                "total_requested": len(items),
                "total_added": len(successful),
                "total_failed": len(failed),
                "message": f"Added {len(successful)} of {len(items)} items to grocery list"
            },
            "isError": False
        }

    except Exception as e:
        return {
            "content": {},
            "error": f"An error occurred: {str(e)}",
            "isError": True
        }


@mcp.tool()
async def update_grocery_item(
    item_id: str,
    name: Optional[str] = None,
    quantity: Union[int, float, str, None] = None,
    quantity_unit: Optional[str] = None,
    status: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Update an existing grocery item. Only provided fields will be updated.

    Args:
        item_id: The unique identifier of the grocery item (required)
        name: New name for the item
        quantity: New quantity (accepts int, float, or string that can be converted to int)
        quantity_unit: New unit of measurement
        status: New status - "ACTIVE" or "COMPLETED"

    Returns:
        Dictionary containing the updated grocery item
    """
    try:
        url = f"{API_BASE}/api/mcp/groceries"

        # Build item update object with only provided fields
        item_update = {"id": item_id}
        if name is not None:
            item_update["name"] = name
        if quantity is not None:
            try:
                item_update["quantity"] = int(
                    float(quantity))  # Cast to int via float
            except (ValueError, TypeError):
                pass  # Skip if conversion fails
        if quantity_unit is not None:
            item_update["quantityUnit"] = quantity_unit
        if status is not None:
            item_update["status"] = status

        payload = {
            "user_id": DEFAULT_USER_ID,
            "item": item_update
        }

        async with httpx.AsyncClient() as client:
            response = await client.patch(url, json=payload, headers=get_headers(), timeout=30.0)
            response.raise_for_status()
            data = response.json()

        grocery = data.get("grocery", {})
        formatted_item = {
            "id": grocery.get("id"),
            "name": grocery.get("name"),
            "quantity": grocery.get("quantity"),
            "quantity_unit": grocery.get("quantityUnit"),
            "status": grocery.get("status")
        }

        return {
            "content": {
                "item": formatted_item,
                "message": "Grocery item updated successfully"
            },
            "isError": False
        }

    except httpx.HTTPStatusError as e:
        return {
            "content": {},
            "error": f"HTTP error occurred: {e.response.status_code} - {e.response.text}",
            "isError": True
        }
    except Exception as e:
        capture_exception(e, {
            "tool": "add_multiple_grocery_items",
            "params": {"item_count": len(items), "user_id": user_id}
        })
        return {
            "content": {},
            "error": f"An error occurred: {str(e)}",
            "isError": True
        }


@mcp.tool()
async def complete_grocery_items(
    item_ids: List[str],
) -> Dict[str, Any]:
    """
    Mark one or more grocery items as completed.

    Args:
        item_ids: List of grocery item IDs to mark as completed (required)

    Returns:
        Dictionary containing count of completed items
    """
    try:
        url = f"{API_BASE}/api/mcp/groceries/complete"

        payload = {
            "user_id": DEFAULT_USER_ID,
            "ids": item_ids
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, headers=get_headers(), timeout=30.0)
            response.raise_for_status()
            data = response.json()

        return {
            "content": {
                "count": data.get("count", 0),
                "message": f"Marked {data.get('count', 0)} item(s) as completed"
            },
            "isError": False
        }

    except httpx.HTTPStatusError as e:
        return {
            "content": {},
            "error": f"HTTP error occurred: {e.response.status_code} - {e.response.text}",
            "isError": True
        }
    except Exception as e:
        return {
            "content": {},
            "error": f"An error occurred: {str(e)}",
            "isError": True
        }


@mcp.tool()
async def delete_grocery_item(
    item_id: str,
) -> Dict[str, Any]:
    """
    Permanently delete a grocery item from the list.

    Args:
        item_id: The unique identifier of the grocery item to delete (required)

    Returns:
        Dictionary confirming the deletion
    """
    try:
        url = f"{API_BASE}/api/mcp/groceries"

        payload = {
            "user_id": DEFAULT_USER_ID,
            "id": item_id
        }

        # Use request() method for DELETE with JSON body (delete() has limited parameter support)
        async with httpx.AsyncClient() as client:
            response = await client.request(
                "DELETE",
                url,
                json=payload,
                headers=get_headers(),
                timeout=30.0
            )
            response.raise_for_status()
            data = response.json()

        return {
            "content": {
                "item_id": data.get("id"),
                "message": "Grocery item deleted successfully"
            },
            "isError": False
        }

    except httpx.HTTPStatusError as e:
        capture_exception(e, {
            "tool": "delete_grocery_item",
            "params": {"item_id": item_id, "user_id": user_id}
        })
        return {
            "content": {},
            "error": f"HTTP error occurred: {e.response.status_code} - {e.response.text}",
            "isError": True
        }
    except Exception as e:
        capture_exception(e, {
            "tool": "delete_grocery_item",
            "params": {"item_id": item_id, "user_id": user_id}
        })
        return {
            "content": {},
            "error": f"An error occurred: {str(e)}",
            "isError": True
        }


if __name__ == "__main__":
    mcp.run(transport="streamable-http")
