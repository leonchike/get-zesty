import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromJwt } from "@/lib/helpers/get-user-id-from-jwt";
import { generateAIImage } from "@/features/recipe-chat/lib/image-generator";
import { uploadImageFromUrl } from "@/lib/image-upload/cloudflare-images";

interface ImageGenerationRequest {
  recipeTitle: string;
  recipeId?: string; // Optional: if provided, will update the recipe with the generated image
}

export async function POST(req: NextRequest) {
  const token = req.headers.get("Authorization")?.split(" ")[1];
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userId = getUserIdFromJwt(token);
    // const userId = "clzefyp8z0000gdusw0ii4med"; // TODO: Remove hardcoded user ID
    if (!userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { recipeTitle, recipeId }: ImageGenerationRequest = await req.json();

    if (!recipeTitle || typeof recipeTitle !== "string") {
      return NextResponse.json(
        { error: "Recipe title is required and must be a string" },
        { status: 400 }
      );
    }

    // Generate image using AI
    console.log(`Generating image for: ${recipeTitle}`);
    const result = await generateAIImage(recipeTitle);

    // Check what type of result we got
    const isUrl = result.startsWith('http://') || result.startsWith('https://');
    const isFilesystemPath = result.startsWith('/tmp/');
    const isCloudflareId = !isUrl && !isFilesystemPath;
    
    let cloudflareUrl = null;
    let aiImageUrl = result;
    
    if (isCloudflareId) {
      // Already uploaded to Cloudflare (new API)
      cloudflareUrl = result;
      console.log(`Image already uploaded to Cloudflare: ${cloudflareUrl}`);
    } else if (isUrl) {
      // Standard DALL-E API returned a URL, upload to Cloudflare
      console.log(`Uploading DALL-E image to Cloudflare...`);
      cloudflareUrl = await uploadImageFromUrl(result);
    } else if (isFilesystemPath) {
      console.log(`Test mode: Image saved to filesystem at ${result}`);
    }

    // If recipeId is provided, update the recipe
    if (recipeId && cloudflareUrl) {
      const { default: prisma } = await import("@/lib/prisma-client");

      // Verify the recipe belongs to the user
      const recipe = await prisma.recipe.findFirst({
        where: {
          id: recipeId,
          userId: userId,
        },
      });

      if (!recipe) {
        return NextResponse.json(
          { error: "Recipe not found or unauthorized" },
          { status: 404 }
        );
      }

      // Update recipe with the new image
      await prisma.recipe.update({
        where: { id: recipeId },
        data: { imageUrl: cloudflareUrl },
      });

      console.log(`Recipe ${recipeId} updated with image`);
    }

    return NextResponse.json({
      success: true,
      data: {
        result,
        cloudflareUrl,
        recipeId: recipeId || null,
        resultType: isCloudflareId ? 'cloudflare_id' : isUrl ? 'url' : 'filesystem',
        message: isFilesystemPath 
          ? `Test mode: Image saved to ${result}`
          : isCloudflareId
            ? `Image generated and uploaded to Cloudflare: ${cloudflareUrl}`
            : recipeId && cloudflareUrl
              ? "Image generated and recipe updated successfully"
              : "Image generated successfully",
      },
    });
  } catch (error) {
    console.error("Image generation error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate image",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
