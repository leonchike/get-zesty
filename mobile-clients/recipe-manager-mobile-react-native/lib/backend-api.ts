import axios from "axios";
import { getEnv } from "@/lib/get-env";
import { User } from "@/lib/types";
import AsyncStorage from "@react-native-async-storage/async-storage";

// export const BACKEND_URL = getEnv("EXPO_PUBLIC_BACKEND_URL");
export const BACKEND_URL_DEV = "http://192.168.1.184:3000"; // Leon's home IP

export const BACKEND_URL_PROD = "https://www.getzesty.food"; // Production URL

const BACKEND_URL = __DEV__ ? BACKEND_URL_PROD : BACKEND_URL_PROD;

const backendApi = axios.create({
  baseURL: BACKEND_URL,
});

backendApi.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

backendApi.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log(error);
    return Promise.reject(error);
  }
);

export default backendApi;

export const ROUTES = {
  LOGIN: "/api/mobile-auth/login",
  REGISTER: "/api/mobile-auth/register",
  GOOGLE_LOGIN: "/api/mobile-auth/google",
  EMAIL_LOGIN: "/api/mobile-auth/login",
  SET_PASSWORD: "/api/mobile-auth/set-password",
  GET_CURRENT_USER: "/api/mobile/user-get-current",
  GET_USER_GROCERIES: "/api/mobile-groceries",
  GET_MOBILE_GROCERY_UPDATES: "/api/mobile-groceries-updates",
  GET_GROCERY_SECTIONS: "/api/grocery-sections",
  UPDATE_GROCERY_ITEM: "/api/mobile-grocery-update",
  SEARCH_RECIPES: "/api/mobile/recipe-search",
  PINNED_RECIPES: "/api/mobile/pinned-recipes",
  SEARCH_FILTER_OPTIONS: "/api/mobile/search-filter-options",
  RECIPE: "/api/mobile/recipe",
  RECIPE_SCRAPER: "/api/mobile/recipe-scraper",
  RECIPE_AI_GENERATE: "/api/mobile/recipe-ai-generate",
  UPLOAD_RECIPE_IMAGE_FROM_URL: "/api/mobile/upload-recipe-image-from-url",
  ADD_GROCERIES_FROM_RECIPE: "/api/mobile/add-groceries-from-recipe",
  CLOUDFLARE_UPLOAD_URL: "/api/mobile/cloudflare-upload-url",
  DEACTIVATE_ACCOUNT: "/api/mobile/user-deactivate",
  UPDATE_USER_PROFILE: "/api/mobile/user-profile-update",
  UPDATE_USER_PASSWORD: "/api/mobile/user-password-update",
};

interface AuthResponse {
  token: string;
  user: User;
}

export const getCurrentUserFromBackend = async (): Promise<User | null> => {
  try {
    const response = await backendApi.get(ROUTES.GET_CURRENT_USER);
    return response.data;
  } catch (error) {
    console.error("Error fetching current user:", error);
    return null;
  }
};

export const getUserAndTokenFromBackend = async (
  email: string
): Promise<AuthResponse> => {
  const response = await backendApi.post(ROUTES.GOOGLE_LOGIN, {
    data: { email },
  });
  console.log("response", response.data);
  return response.data;
};

interface AuthResponse {
  token: string;
  user: User;
}

interface AuthError {
  error: string;
  code?: string;
}

export const setPassword = async (data: {
  email: string;
  password: string;
}): Promise<AuthResponse> => {
  const response = await backendApi.post(ROUTES.SET_PASSWORD, {
    data,
  });
  return response.data;
};

export const loginWithEmail = async (data: {
  email: string;
  password: string;
}): Promise<AuthResponse> => {
  try {
    const response = await backendApi.post(ROUTES.EMAIL_LOGIN, {
      data,
    });
    return response.data;
  } catch (error: any) {
    if (error.response?.data?.code === "PASSWORD_NOT_SET") {
      // Special case for Google auth users who haven't set a password
      throw {
        code: "PASSWORD_NOT_SET",
        message: "Please set a password for email login",
      };
    }
    if (error.response?.data?.code === "USER_NOT_ACTIVE") {
      throw {
        code: "USER_NOT_ACTIVE",
        message:
          "Your account has been deactivated. Please contact support@getzesty.food for assistance.",
      };
    }
    throw error;
  }
};

export const registerWithEmail = async (data: {
  email: string;
  password: string;
  name: string;
}): Promise<AuthResponse> => {
  try {
    const response = await backendApi.post(ROUTES.REGISTER, {
      data,
    });
    return response.data;
  } catch (error) {
    console.error("Error registering with email:", error);
    throw error;
  }
};

export const updateUserProfile = async (data: Partial<User>): Promise<User> => {
  const response = await backendApi.patch(ROUTES.UPDATE_USER_PROFILE, {
    data,
  });
  return response.data as User;
};

export const updateUserPassword = async (data: {
  oldPassword: string;
  newPassword: string;
}): Promise<{ success: boolean; error?: string; message?: string }> => {
  const response = await backendApi.patch(ROUTES.UPDATE_USER_PASSWORD, {
    data,
  });
  return response.data;
};

export const deactivateAccount = async (data: {
  password: string;
}): Promise<{
  success: boolean;
  error?: string;
  message?: string;
}> => {
  const response = await backendApi.post(ROUTES.DEACTIVATE_ACCOUNT, {
    data,
  });
  return response.data;
};

export const getUserGroceries = async () => {
  try {
    const response = await backendApi.get(ROUTES.GET_MOBILE_GROCERY_UPDATES);
    return response.data;
  } catch (error) {
    console.error("Error fetching user groceries:", error);
    throw error;
  }
};

export const addGroceryItem = async (item: {
  name: string;
  quantity?: number | null;
  quantityUnit?: string | null;
  recipeId?: string | null;
}) => {
  try {
    const response = await backendApi.post(ROUTES.UPDATE_GROCERY_ITEM, {
      data: item,
    });
    return response.data;
  } catch (error) {
    console.error("Error adding grocery item:", error);
    throw error;
  }
};

export const updateGroceryItem = async (item: {
  id: string;
  name?: string;
  quantity?: number | null;
  quantityUnit?: string | null;
  status?: "ACTIVE" | "COMPLETED" | "DELETED";
  sectionId?: string | null;
}) => {
  console.log(item);

  try {
    const response = await backendApi.patch(ROUTES.UPDATE_GROCERY_ITEM, {
      data: item,
    });
    return response.data;
  } catch (error) {
    console.error("Error updating grocery item:", error);
    throw error;
  }
};

export const deleteGroceryItem = async (id: string) => {
  try {
    const response = await backendApi.delete(ROUTES.UPDATE_GROCERY_ITEM, {
      data: { id },
    });
    return response.data;
  } catch (error) {
    console.error("Error deleting grocery item:", error);
    throw error;
  }
};

export const getGrocerySections = async () => {
  try {
    const response = await backendApi.get(ROUTES.GET_GROCERY_SECTIONS);
    return response.data;
  } catch (error) {
    console.error("Error fetching grocery sections:", error);
    throw error;
  }
};
