import { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  GoogleSignin,
  isSuccessResponse,
  isNoSavedCredentialFoundResponse,
} from "@react-native-google-signin/google-signin";
import { logger } from "@/lib/utils/logger";
import { User } from "@/lib/types";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { getCurrentUser } from "@/lib/auth";
import { getEnv } from "@/lib/get-env";
import {
  getCurrentUserFromBackend,
  getUserAndTokenFromBackend,
  setPassword,
  loginWithEmail,
  registerWithEmail,
  updateUserProfile,
  updateUserPassword,
  deactivateAccount,
} from "@/lib/backend-api";
import { jwtDecode } from "jwt-decode";

WebBrowser.maybeCompleteAuthSession();

interface AuthState {
  token: string | null;
  user: any | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  signInWithGoogle: () => Promise<{ token: string; user: User } | null>;
  signInWithEmail: (
    email: string,
    password: string
  ) => Promise<{ token: string; user: User } | null>;
  signupWithEmail: (
    email: string,
    password: string,
    name: string
  ) => Promise<{ token: string; user: User } | null>;
  setPassword: (
    email: string,
    password: string
  ) => Promise<{ token: string; user: User } | null>;
  logout: () => Promise<void>;
  updateUserData: (userData: Partial<User>) => Promise<boolean>;
  updateUserDataPassword: (
    oldPassword: string,
    newPassword: string
  ) => Promise<{ success: boolean; error?: string; message?: string }>;
  deactivateDataAccount: (password: string) => Promise<{
    success: boolean;
    error?: string;
    message?: string;
  }>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

const isTokenExpired = (token: string): boolean => {
  try {
    const decoded: any = jwtDecode(token);
    return decoded.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [authState, setAuthState] = useState<AuthState>({
    token: null,
    user: null,
    isAuthenticated: false,
    isLoading: false,
  });

  useEffect(() => {
    GoogleSignin.configure({
      iosClientId: getEnv("EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID"),
      webClientId: getEnv("EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID"),
    });
  }, []);

  logger.log("state", authState);

  const signInWithGoogle = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const googleResponse = await GoogleSignin.signIn();

      if (isSuccessResponse(googleResponse)) {
        const { email } = googleResponse.data.user;

        try {
          const { token, user } = await getUserAndTokenFromBackend(email);

          // Store the session
          await Promise.all([
            AsyncStorage.setItem("user", JSON.stringify(user)),
            AsyncStorage.setItem("token", token),
          ]);

          setAuthState({
            token,
            user,
            isAuthenticated: true,
            isLoading: false,
          });

          return { token, user };
        } catch (error) {
          throw new Error("Failed to authenticate with backend");
        }
      }

      if ("type" in googleResponse && googleResponse.type === "cancelled") {
        return null; // User cancelled the sign-in
      }

      if (isNoSavedCredentialFoundResponse(googleResponse)) {
        throw new Error("No saved Google credentials found");
      }

      throw new Error("Invalid Google sign-in response");
    } catch (error) {
      logger.error("Google Sign-In Error:", error);
      throw error;
    }
  };

  const handleSetPassword = async (email: string, password: string) => {
    try {
      const { token, user } = await setPassword({ email, password });

      // Store the session
      await Promise.all([
        AsyncStorage.setItem("user", JSON.stringify(user)),
        AsyncStorage.setItem("token", token),
      ]);

      setAuthState({
        token,
        user,
        isAuthenticated: true,
        isLoading: false,
      });

      return { token, user };
    } catch (error) {
      logger.error("Set Password Error:", error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const { token, user } = await loginWithEmail({ email, password });

      // Store the session
      await Promise.all([
        AsyncStorage.setItem("user", JSON.stringify(user)),
        AsyncStorage.setItem("token", token),
      ]);

      setAuthState({
        token,
        user,
        isAuthenticated: true,
        isLoading: false,
      });

      return { token, user };
    } catch (error: any) {
      if (error.code === "PASSWORD_NOT_SET") {
        // Handle the case where a Google user needs to set a password
        throw {
          code: "PASSWORD_NOT_SET",
          message: "Please set a password for email login",
        };
      } else if (error.code === "USER_NOT_ACTIVE") {
        throw {
          code: "USER_NOT_ACTIVE",
          message:
            "Your account has been deactivated. Please contact support@getzesty.food for assistance.",
        };
      }
      throw error;
    }
  };

  const signupWithEmail = async (
    email: string,
    password: string,
    name: string
  ) => {
    try {
      const { token, user } = await registerWithEmail({
        email,
        password,
        name,
      });

      // Store the session
      await Promise.all([
        AsyncStorage.setItem("user", JSON.stringify(user)),
        AsyncStorage.setItem("token", token),
      ]);

      setAuthState({
        token,
        user,
        isAuthenticated: true,
        isLoading: false,
      });

      return { token, user };
    } catch (error) {
      logger.error("Register with Email Error:", error);
      throw error;
    }
  };

  // check login status
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        setAuthState({ ...authState, isLoading: true });
        const { user, token } = await getCurrentUser();

        if (user && token) {
          if (isTokenExpired(token)) {
            await logout();
            return;
          }

          setAuthState((prev) => ({
            ...prev,
            token,
            user,
            isAuthenticated: true,
            isLoading: false,
          }));

          // get user data from backend to update the user state
          const userData = await getCurrentUserFromBackend();
          if (userData) {
            setAuthState((prev) => ({
              ...prev,
              user: userData,
            }));
          }
        }
      } catch (error: unknown) {
        setAuthState((prev) => ({
          ...prev,
          isAuthenticated: false,
          user: null,
          isLoading: false,
          token: null,
        }));
      } finally {
        setAuthState((prev) => ({ ...prev, isLoading: false }));
      }
    };

    checkLoginStatus();
  }, []);

  // Optional: Add periodic token check
  useEffect(() => {
    if (!authState.token) return;

    const checkInterval = setInterval(() => {
      if (isTokenExpired(authState.token!)) {
        logout();
      }
    }, 60000); // Check every minute

    return () => clearInterval(checkInterval);
  }, [authState.token]);

  // get user data from backend to update the user state periodically
  useEffect(() => {
    if (!authState.token) return;

    const checkInterval = setInterval(() => {
      const fetchUser = async () => {
        const userData = await getCurrentUserFromBackend();
        if (userData) {
          setAuthState((prev) => ({ ...prev, user: userData }));

          if (userData.isAccountDisabled) {
            logout();
          }
        }
      };
      fetchUser();
    }, 600000); // Check every minute

    return () => clearInterval(checkInterval);
  }, [authState.token]);

  const logout = async () => {
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("user");
    setAuthState((prev) => ({
      ...prev,
      token: null,
      user: null,
      isAuthenticated: false,
    }));
  };

  const updateUserData = async (userData: Partial<User>) => {
    try {
      const user = await updateUserProfile(userData);
      setAuthState((prev) => ({
        ...prev,
        user,
      }));
      return true;
    } catch (error) {
      logger.error("Update User Data Error:", error);
      return false;
    }
  };

  const updateUserDataPassword = async (
    oldPassword: string,
    newPassword: string
  ) => {
    const response = await updateUserPassword({ oldPassword, newPassword });
    return response;
  };

  const deactivateDataAccount = async (password: string) => {
    const response = await deactivateAccount({ password });
    return response;
  };

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        signInWithGoogle,
        signInWithEmail,
        signupWithEmail,
        setPassword: handleSetPassword,
        logout,
        updateUserData,
        updateUserDataPassword,
        deactivateDataAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
