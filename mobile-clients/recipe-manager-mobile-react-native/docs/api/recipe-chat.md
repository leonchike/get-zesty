# Recipe Chat API Documentation

## Overview
The Recipe Chat API allows mobile and web clients to interact with an AI assistant for creating, modifying, and discussing recipes. The API maintains conversation context and enforces a single recipe per chat session.

## Authentication
All endpoints require JWT authentication via Bearer token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### 1. Send Chat Message
Send a message to the AI assistant and receive a response.

**Endpoint:** `POST /api/mobile/recipe-chat`

**Headers:**
```json
{
  "Authorization": "Bearer <your-jwt-token>",
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "message": "Create a spicy chicken pot pie recipe",
  "chatHistory": [
    {
      "id": "msg-1",
      "role": "user",
      "content": "Hi, I want to make something spicy",
      "type": "text",
      "timestamp": "2025-01-06T10:00:00Z"
    },
    {
      "id": "msg-2",
      "role": "assistant",
      "content": "I'd be happy to help you create a spicy dish! What type of cuisine or main ingredient are you interested in?",
      "type": "text",
      "timestamp": "2025-01-06T10:00:05Z"
    }
  ]
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "type": "recipe",
    "content": "Here's a delicious spicy chicken pot pie recipe:",
    "recipeData": {
      "title": "Spicy Chicken Pot Pie",
      "description": "A comforting chicken pot pie with a spicy kick",
      "difficulty": "MEDIUM",
      "prepTime": 30,
      "cookTime": 40,
      "totalTime": 70,
      "servings": 6,
      "ingredients": "• 2 cups chicken thighs...",
      "instructions": "1. Preheat oven to 425°F...",
      "cuisineType": "American",
      "mealType": "Dinner",
      "dietaryRestrictions": [],
      "tags": ["comfort food", "spicy", "chicken", "pie"],
      "source": "GEN_AI"
    }
  }
}
```

**Response Types:**
- `conversation`: General cooking advice or discussion
- `recipe`: New recipe creation
- `recipe-modification`: Updates to existing recipe

**Error Responses:**
```json
{
  "error": "Unauthorized",
  "status": 401
}
```

```json
{
  "error": "Message is required and must be a string",
  "status": 400
}
```

### 2. Save Recipe from Chat
Save a recipe that was generated in the chat session.

**Endpoint:** `PUT /api/mobile/recipe-chat`

**Headers:**
```json
{
  "Authorization": "Bearer <your-jwt-token>",
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "recipe": {
    "title": "Spicy Chicken Pot Pie",
    "description": "A comforting chicken pot pie with a spicy kick",
    "difficulty": "MEDIUM",
    "prepTime": 30,
    "cookTime": 40,
    "totalTime": 70,
    "servings": 6,
    "ingredients": "• 2 cups chicken thighs...",
    "instructions": "1. Preheat oven to 425°F...",
    "equipment": "Oven, large skillet, pie plate",
    "cuisineType": "American",
    "mealType": "Dinner",
    "dietaryRestrictions": [],
    "tags": ["comfort food", "spicy", "chicken", "pie"]
  }
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "id": "recipe-id-123"
  }
}
```

**Note:** The API will automatically trigger background image generation for the saved recipe.

## Usage Examples

### Example 1: Starting a New Recipe Chat
```javascript
const response = await fetch('https://your-api.com/api/mobile/recipe-chat', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    message: "I want to make a vegetarian pasta dish",
    chatHistory: []
  })
});

const data = await response.json();
```

### Example 2: Modifying an Existing Recipe
```javascript
const response = await fetch('https://your-api.com/api/mobile/recipe-chat', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    message: "Can you make this recipe gluten-free?",
    chatHistory: [...previousMessages]
  })
});
```

### Example 3: Saving a Recipe
```javascript
const saveResponse = await fetch('https://your-api.com/api/mobile/recipe-chat', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    recipe: recipeData
  })
});

const { data } = await saveResponse.json();
console.log(`Recipe saved with ID: ${data.id}`);
```

## Important Notes

1. **Single Recipe Per Session**: Only one recipe can be created per chat session. Attempts to create a second recipe will receive a message directing users to start a new session.

2. **Chat History**: Always include the full chat history to maintain context. The AI uses this to understand recipe modifications and maintain conversation flow.

3. **Recipe Modifications**: When requesting modifications (e.g., "make it vegan", "scale to 8 servings"), the AI will return the complete updated recipe, not just the changes.

4. **Image Generation**: Recipe images are generated automatically in the background after saving. This is non-blocking and doesn't affect the save response time.

5. **Rate Limiting**: Consider implementing rate limiting on your client to prevent excessive API calls.

## Error Handling

Always check the response status and handle errors appropriately:

```javascript
try {
  const response = await fetch('/api/mobile/recipe-chat', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ message, chatHistory })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Request failed');
  }

  const data = await response.json();
  // Handle successful response
} catch (error) {
  console.error('Chat error:', error);
  // Handle error appropriately
}
```