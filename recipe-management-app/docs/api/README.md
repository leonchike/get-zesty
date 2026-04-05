# Recipe Management API Documentation

## Overview
This documentation covers the mobile and web API endpoints for the Recipe Management application. All mobile endpoints are prefixed with `/api/mobile/` and require JWT authentication.

## Authentication

### JWT Token Authentication
All API endpoints require authentication using JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Obtaining a Token

#### 1. Email/Password Login
```bash
POST /api/mobile-auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "your-password"
}
```

Response:
```json
{
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "User Name"
  },
  "token": "jwt-token-here"
}
```

#### 2. Google OAuth
```bash
POST /api/mobile-auth/google
Content-Type: application/json

{
  "idToken": "google-id-token"
}
```

#### 3. Registration
```bash
POST /api/mobile-auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secure-password",
  "name": "User Name"
}
```

## Available APIs

### Recipe Management
- [Recipe Chat API](./recipe-chat.md) - AI-powered recipe creation and modification through chat
- [Image Generation API](./image-generation.md) - Generate AI images for recipes
- `POST /api/mobile/recipe-ai-generate` - Generate a recipe from a single prompt
- `POST /api/mobile/recipe-scraper` - Scrape recipe from URL
- `GET /api/mobile/recipe-search` - Search recipes
- `GET/POST/PUT/DELETE /api/mobile/recipe` - CRUD operations for recipes

### User Management
- `GET /api/mobile/user-get-current` - Get current user info
- `PUT /api/mobile/user-profile-update` - Update user profile
- `PUT /api/mobile/user-password-update` - Update password
- `POST /api/mobile/user-deactivate` - Deactivate account

### Grocery Management
- `POST /api/mobile/add-groceries-from-recipe` - Add recipe ingredients to grocery list
- `GET /api/mobile-groceries-updates` - SSE endpoint for real-time updates
- `POST /api/mobile-grocery-update` - Update grocery items

### Other Features
- `GET /api/mobile/pinned-recipes` - Get user's pinned recipes
- `GET /api/mobile/search-filter-options` - Get available search filters
- `GET /api/mobile/cloudflare-upload-url` - Get upload URL for images

## Common Response Formats

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  }
}
```

### Error Response
```json
{
  "error": "Error message",
  "details": "Additional error details (optional)",
  "status": 400
}
```

## HTTP Status Codes

- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request parameters
- `401 Unauthorized` - Missing or invalid authentication
- `403 Forbidden` - Authenticated but not authorized
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

## Rate Limiting

While not currently implemented, clients should be prepared for rate limiting responses:

```json
{
  "error": "Rate limit exceeded",
  "retryAfter": 60,
  "status": 429
}
```

## Testing with cURL

### Basic authenticated request:
```bash
curl -X GET https://your-api.com/api/mobile/user-get-current \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### POST request with JSON body:
```bash
curl -X POST https://your-api.com/api/mobile/recipe-chat \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Create a pasta recipe", "chatHistory": []}'
```

## SDK Examples

### JavaScript/TypeScript
```typescript
class RecipeAPI {
  private baseURL: string;
  private token: string;

  constructor(baseURL: string, token: string) {
    this.baseURL = baseURL;
    this.token = token;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  async chatWithAI(message: string, chatHistory: any[]) {
    return this.request('/api/mobile/recipe-chat', {
      method: 'POST',
      body: JSON.stringify({ message, chatHistory }),
    });
  }

  async generateImage(recipeTitle: string, recipeId?: string) {
    return this.request('/api/mobile/test-image-generation', {
      method: 'POST',
      body: JSON.stringify({ recipeTitle, recipeId }),
    });
  }
}
```

### Python
```python
import requests

class RecipeAPI:
    def __init__(self, base_url, token):
        self.base_url = base_url
        self.headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
    
    def chat_with_ai(self, message, chat_history):
        response = requests.post(
            f'{self.base_url}/api/mobile/recipe-chat',
            headers=self.headers,
            json={'message': message, 'chatHistory': chat_history}
        )
        response.raise_for_status()
        return response.json()
    
    def generate_image(self, recipe_title, recipe_id=None):
        data = {'recipeTitle': recipe_title}
        if recipe_id:
            data['recipeId'] = recipe_id
        
        response = requests.post(
            f'{self.base_url}/api/mobile/test-image-generation',
            headers=self.headers,
            json=data
        )
        response.raise_for_status()
        return response.json()
```

## Best Practices

1. **Always handle errors gracefully** - Network requests can fail
2. **Include proper error messages** for users
3. **Implement retry logic** for transient failures
4. **Cache responses** where appropriate
5. **Validate input** before sending to API
6. **Use HTTPS** in production
7. **Store tokens securely** - Never in plain text
8. **Implement token refresh** logic
9. **Log errors** for debugging but not sensitive data
10. **Follow REST conventions** for resource operations

## Support

For API issues or questions:
- Check the specific API documentation
- Review error messages and status codes
- Ensure authentication is properly configured
- Verify request format matches documentation

## Version

Current API Version: 1.0.0
Last Updated: January 2025