// lib/cloudflare-images.ts

import axios from "axios";
import FormData from "form-data";

const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CLOUDFLARE_IMAGES_KEY = process.env.CLOUDFLARE_IMAGES_KEY;

export async function generateUploadUrl() {
  const form = new FormData();
  form.append("requireSignedURLs", "true");
  form.append("metadata", JSON.stringify({ key: "value" }));

  const response = await axios.post(
    `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/images/v2/direct_upload`,
    form,
    {
      headers: {
        Authorization: `Bearer ${CLOUDFLARE_IMAGES_KEY}`,
      },
    }
  );

  // console.log("response", response);

  if (response.data.success) {
    return response.data.result;
  } else {
    throw new Error("Failed to generate upload URL");
  }
}

export function getImageUrl(id: string) {
  return `https://imagedelivery.net/${process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH}/${id}/largeartwork`;
}

// Helper to check if a string is a Cloudflare image ID or a full URL
export function isCloudflareImageId(value: string): boolean {
  // Cloudflare IDs are UUIDs
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

// Get the full image URL from either a Cloudflare ID or existing URL
export function formatImageUrl(imageUrlOrId: string | null | undefined): string | null {
  if (!imageUrlOrId) return null;
  
  // If it's already a full URL, return as is
  if (imageUrlOrId.startsWith('http://') || imageUrlOrId.startsWith('https://')) {
    return imageUrlOrId;
  }
  
  // If it's a Cloudflare ID, convert to full URL
  if (isCloudflareImageId(imageUrlOrId)) {
    return getImageUrl(imageUrlOrId);
  }
  
  // Otherwise, assume it's a Cloudflare ID (backward compatibility)
  return getImageUrl(imageUrlOrId);
}

export async function uploadImageFromUrl(imageUrl: string) {
  try {
    const formData = new FormData();
    formData.append("url", imageUrl);
    formData.append("metadata", JSON.stringify({ source: "recipe_scrape" }));
    formData.append("requireSignedURLs", "false");

    const response = await axios.post(
      `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/images/v1`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${CLOUDFLARE_IMAGES_KEY}`,
        },
      }
    );

    if (response.data.success) {
      return response.data.result.id;
    } else {
      throw new Error("Failed to upload image to Cloudflare");
    }
  } catch (error) {
    console.error("Error uploading image from URL:", error);
    throw error;
  }
}

export async function uploadImageFromBuffer(imageBuffer: Buffer, filename: string, metadata: Record<string, any> = {}) {
  try {
    const formData = new FormData();
    
    // Cloudflare expects the file to be appended with proper metadata
    formData.append("file", imageBuffer, {
      filename: filename,
      contentType: 'image/png',
    });
    
    formData.append("metadata", JSON.stringify({
      ...metadata,
      uploadedAt: new Date().toISOString(),
    }));
    
    formData.append("requireSignedURLs", "false");

    const response = await axios.post(
      `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/images/v1`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${CLOUDFLARE_IMAGES_KEY}`,
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      }
    );

    if (response.data.success && response.data.result?.id) {
      return response.data.result.id;
    } else {
      const errorMessage = response.data.errors?.[0]?.message || 'Unknown error';
      throw new Error(`Failed to upload image to Cloudflare: ${errorMessage}`);
    }
  } catch (error) {
    console.error("Error uploading image buffer to Cloudflare:", error);
    if (axios.isAxiosError(error) && error.response?.data?.errors) {
      console.error("Cloudflare API errors:", error.response.data.errors);
    }
    throw error;
  }
}
