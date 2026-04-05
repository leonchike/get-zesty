import axios from "axios";
import backendApi, { ROUTES } from "@/lib/backend-api";
import {
  CreateRecipeParams,
  UpdateRecipeParams,
  DeleteRecipeParams,
  ScrapeRecipeParams,
  GetRecipeParams,
  Recipe,
} from "@/lib/types";
import { processImageForCloudflare } from "@/lib/image-processing";

export const getRecipe = async ({ recipeId }: GetRecipeParams) => {
  const response = await backendApi.get<Recipe>(ROUTES.RECIPE, {
    params: {
      id: recipeId,
    },
  });
  return response.data;
};

export const createRecipe = async ({ recipe }: CreateRecipeParams) => {
  const response = await backendApi.post<{ id: string }>(ROUTES.RECIPE, {
    recipe,
  });
  return response.data;
};

export const updateRecipe = async ({ id, recipe }: UpdateRecipeParams) => {
  const response = await backendApi.put<Recipe>(ROUTES.RECIPE, {
    id,
    recipe,
  });
  return response.data;
};

export const deleteRecipe = async ({ recipeId }: DeleteRecipeParams) => {
  try {
    const response = await backendApi.delete<{ id: string }>(ROUTES.RECIPE, {
      params: {
        id: recipeId,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error deleting recipe", error);
    throw error;
  }
};

export const scrapeRecipe = async ({ url }: ScrapeRecipeParams) => {
  const response = await backendApi.post<{ data: Recipe }>(
    ROUTES.RECIPE_SCRAPER,
    {
      url,
    }
  );

  console.log("response", response);
  return response?.data?.data;
};

interface UploadImageToBackendParams {
  imageUrl: string;
}
interface UploadImageToBackendFromURLReturn {
  success: boolean;
  imageUrl: string;
  error?: string;
}

export const uploadImageToBackendFromUrl = async ({
  imageUrl,
}: UploadImageToBackendParams): Promise<UploadImageToBackendFromURLReturn> => {
  const response = await backendApi.post<UploadImageToBackendFromURLReturn>(
    ROUTES.UPLOAD_RECIPE_IMAGE_FROM_URL,
    {
      imageUrl,
    }
  );
  console.log("response", response);
  return response.data;
};

export const uploadImageToCloudflare = async (localUri: string) => {
  // 1) Process the image to ensure it meets Cloudflare limits
  const { uri, type } = await processImageForCloudflare(localUri);

  // 2) Get the upload URL from the backend
  let uploadUrl: string | null = null;
  let id: string | null = null;
  try {
    const cloudflareUploadUrlResponse = await backendApi.get(
      ROUTES.CLOUDFLARE_UPLOAD_URL
    );

    if (
      !cloudflareUploadUrlResponse?.data?.url ||
      !cloudflareUploadUrlResponse?.data?.id
    ) {
      throw new Error("No upload URL returned from backend");
    }

    uploadUrl = cloudflareUploadUrlResponse.data.url;
    id = cloudflareUploadUrlResponse.data.id;
  } catch (error) {
    console.error("Error getting upload URL from backend", error);
    throw error;
  }

  // 3) Build form data
  try {
    if (!uploadUrl) {
      throw new Error("No upload URL returned from backend");
    }

    const formData = new FormData();
    formData.append("file", {
      uri,
      type, // e.g. 'image/jpeg'
      name: "file", // or 'somefile.jpg'
    } as any);

    // 4) Upload directly to Cloudflare
    const response = await axios.post(uploadUrl, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    if (response.status !== 200) {
      throw new Error("Failed to upload image to Cloudflare");
    }

    const cloudflareaccount = "camphNQlX5poswEZJbu_Cw";
    const imageURL = `https://imagedelivery.net/${cloudflareaccount}/${id}/largeartwork`;

    return imageURL;
  } catch (error) {
    console.error("Error building form data", error);
    throw error;
  }

  return new Error("Not implemented");
};
