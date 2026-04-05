# Image Generation API Documentation

## Overview
The Image Generation API allows testing and triggering of AI-powered recipe image generation. This endpoint is useful for generating images for existing recipes or testing the image generation pipeline.

## Authentication
Requires JWT authentication via Bearer token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Endpoint

### Generate Recipe Image
Generate an AI image for a recipe based on its title.

**Endpoint:** `POST /api/mobile/test-image-generation`

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
  "recipeTitle": "Spicy Chicken Pot Pie",
  "recipeId": "optional-recipe-id"
}
```

**Parameters:**
- `recipeTitle` (required): The title of the recipe to generate an image for
- `recipeId` (optional): If provided, the generated image will be saved to this recipe

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "aiImageUrl": "https://oaidalleapi.../generated-image.png",
    "cloudflareUrl": "https://imagedelivery.net/.../image.jpg",
    "recipeId": "recipe-id-123",
    "message": "Image generated and recipe updated successfully"
  }
}
```

**Error Responses:**
```json
{
  "error": "Recipe title is required and must be a string",
  "status": 400
}
```

```json
{
  "error": "Recipe not found or unauthorized",
  "status": 404
}
```

```json
{
  "error": "Failed to generate image",
  "details": "OpenAI API error message",
  "status": 500
}
```

## Usage Examples

### Example 1: Generate Image Without Saving
```javascript
const response = await fetch('https://your-api.com/api/mobile/test-image-generation', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    recipeTitle: "Chocolate Lava Cake with Raspberry Sauce"
  })
});

const data = await response.json();
console.log('AI Image URL:', data.data.aiImageUrl);
console.log('Cloudflare URL:', data.data.cloudflareUrl);
```

### Example 2: Generate and Save to Recipe
```javascript
const response = await fetch('https://your-api.com/api/mobile/test-image-generation', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    recipeTitle: "Grilled Salmon with Lemon Butter",
    recipeId: "clzefyp8z0000gdusw0ii4med"
  })
});

const data = await response.json();
if (data.success) {
  console.log('Image generated and saved to recipe');
}
```

## Image Generation Process

1. **AI Generation**: Uses OpenAI's DALL-E 3 to generate a high-quality food photograph
2. **Prompt Enhancement**: The API automatically enhances the recipe title with photography-specific prompts
3. **Cloudflare Upload**: The generated image is uploaded to Cloudflare Images for CDN delivery
4. **Recipe Update**: If a recipeId is provided, the recipe is updated with the new image URL

## Generated Prompt Format

The API enhances recipe titles with professional food photography prompts:

```
Professional food photography of [Recipe Title], 
appetizing presentation on a beautiful plate, 
natural lighting from a window, 
high quality restaurant style, 
styled for a cookbook or food magazine, 
shallow depth of field, 
warm and inviting atmosphere,
garnished appropriately
```

## Important Notes

1. **Rate Limiting**: Image generation is resource-intensive. Implement appropriate rate limiting on your client.

2. **Processing Time**: Image generation typically takes 5-15 seconds depending on OpenAI's response time.

3. **Cost Considerations**: Each image generation incurs costs for both OpenAI DALL-E 3 and Cloudflare Images storage.

4. **Recipe Ownership**: When providing a recipeId, the API verifies that the recipe belongs to the authenticated user.

5. **Image Quality**: Generated images are 1024x1024 pixels in standard quality.

## Error Handling

```javascript
try {
  const response = await fetch('/api/mobile/test-image-generation', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      recipeTitle: "Delicious Chocolate Cake",
      recipeId: recipeId // optional
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Image generation failed');
  }

  const data = await response.json();
  // Use the generated image URLs
} catch (error) {
  console.error('Image generation error:', error);
  // Handle error appropriately
}
```

## Testing the Endpoint

You can test the endpoint using curl:

```bash
# Generate image without saving
curl -X POST https://your-api.com/api/mobile/test-image-generation \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"recipeTitle": "Spicy Thai Green Curry"}'

# Generate and save to recipe
curl -X POST https://your-api.com/api/mobile/test-image-generation \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"recipeTitle": "Classic Margherita Pizza", "recipeId": "recipe-123"}'
```