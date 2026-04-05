import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateAIImage(recipeTitle: string): Promise<string> {
  const startTime = Date.now();
  
  try {
    // Validate input
    if (!recipeTitle || typeof recipeTitle !== 'string') {
      throw new Error('Invalid recipe title provided');
    }
    
    // Generate a detailed prompt based on the recipe title
    const prompt = `Professional food photography of ${recipeTitle}, 
      appetizing presentation on a beautiful plate, 
      natural lighting from a window, 
      high quality restaurant style, 
      styled for a cookbook or food magazine, 
      shallow depth of field, 
      warm and inviting atmosphere,
      garnished appropriately`;

    console.log(`[Image Generation] Starting generation for: "${recipeTitle}"`);

    // Check if the new API is available, otherwise fall back to the standard API
    if ((openai as any).responses?.create) {
      console.log('[Image Generation] Using new responses.create API');
      
      // Using the new API pattern with responses.create
      const response = await (openai as any).responses.create({
        model: "gpt-4.1-mini",
        input: prompt,
        tools: [{ type: "image_generation" }],
      });

      // Extract the image data from the response
      const imageData = response.output
        .filter((output: any) => output.type === "image_generation_call")
        .map((output: any) => output.result);

      if (!imageData || imageData.length === 0) {
        throw new Error("No image data returned from OpenAI responses API");
      }

      // Get the base64 image data
      const imageBase64 = imageData[0];
      
      if (!imageBase64) {
        throw new Error("Empty base64 data received from OpenAI");
      }

      console.log('[Image Generation] Base64 image received, processing...');
      
      // Convert base64 to buffer
      const imageBuffer = Buffer.from(imageBase64, "base64");
      console.log(`[Image Generation] Image size: ${(imageBuffer.length / 1024).toFixed(2)}KB`);
      
      // Upload to Cloudflare using the new buffer upload function
      const { uploadImageFromBuffer } = await import("@/lib/image-upload/cloudflare-images");
      
      const filename = `${recipeTitle.replace(/[^a-zA-Z0-9]/g, "-")}-${Date.now()}.png`;
      
      console.log('[Image Generation] Uploading to Cloudflare...');
      const cloudflareId = await uploadImageFromBuffer(imageBuffer, filename, {
        source: "ai_generated",
        recipe: recipeTitle,
      });
      
      const duration = Date.now() - startTime;
      console.log(`[Image Generation] Successfully completed in ${duration}ms. Cloudflare ID: ${cloudflareId}`);
      
      return cloudflareId;
    } else {
      console.log('[Image Generation] Using standard DALL-E API');
      
      // Fall back to standard DALL-E API
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
        style: "natural",
      });

      if (!response.data) {
        throw new Error("No data returned from DALL-E API");
      }

      const imageUrl = response.data[0]?.url;
      if (!imageUrl) {
        throw new Error("No image URL returned from DALL-E API");
      }

      console.log('[Image Generation] Image URL received from DALL-E');
      
      const duration = Date.now() - startTime;
      console.log(`[Image Generation] Successfully completed in ${duration}ms`);
      
      return imageUrl;
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[Image Generation] Failed after ${duration}ms:`, {
      recipeTitle,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    // Re-throw with more context
    if (error instanceof Error) {
      throw new Error(`Image generation failed: ${error.message}`);
    }
    throw new Error("Image generation failed: Unknown error");
  }
}
