"use client";

import { createContext, useState, useEffect, useContext, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { User } from "@/types/data";
import axios from "axios";
import { config } from "@/config";
import { getSecondaryEmails } from "@/app/(actions)/mailbox/actions";

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  setUser: (user: User | null) => void;
  setAccessToken: (accessToken: string | null) => void;
  logout: () => Promise<void>;
  secondaryEmails: string[];
  setSecondaryEmails: (secondaryEmails: string[]) => void;
  updateAvatar: (file: File) => Promise<void>;
  deleteAccount: (feedback: string) => Promise<void>;
  deleteSecondaryEmail: (email: string, userId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const supabase = createClient();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [secondaryEmails, setSecondaryEmails] = useState<string[]>([]);

  const authApi = useMemo(() => {
    const instance = axios.create({
      baseURL: config.api.baseURL,
    });
    instance.interceptors.request.use(
      (config) => {
        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
    return instance;
  }, [accessToken]);

  const fetchUser = async () => {
    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (authUser) {
        const { data: userProfile } = await supabase
          .from("users")
          .select("avatar_url, full_name, user_name")
          .eq("id", authUser.id)
          .single();

        const fullName =
          userProfile?.full_name || authUser.user_metadata?.full_name || "";

        setUser({
          id: authUser.id,
          email: authUser.email || "",
          avatar_url:
            userProfile?.avatar_url || authUser.user_metadata?.avatar_url || "",
          full_name: fullName,
          user_name: userProfile?.user_name || "user_name",
        });

        const { data: sessionData } = await supabase.auth.getSession();
        setAccessToken(sessionData.session?.access_token || null);
      } else {
        setUser(null);
        setAccessToken(null);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      setUser(null);
      setAccessToken(null);
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();
        if (authUser) {
          const { data: userProfile } = await supabase
            .from("users")
            .select("avatar_url, full_name, user_name")
            .eq("id", authUser.id)
            .single();

          const fullName =
            userProfile?.full_name || authUser.user_metadata?.full_name || "";


          setUser({
            id: authUser.id,
            email: authUser.email || "",
            avatar_url:
              userProfile?.avatar_url ||
              authUser.user_metadata?.avatar_url ||
              "",
            full_name: fullName,
            user_name: userProfile?.user_name || "user_name",
          });

          const { data: sessionData } = await supabase.auth.getSession();
          setAccessToken(sessionData.session?.access_token || null);
          const { data: secondaryEmailsData, error: secondaryEmailsError } =
            await getSecondaryEmails(authUser.id);
          if (secondaryEmailsError) {
            console.error(secondaryEmailsError);
          } else {
            setSecondaryEmails(secondaryEmailsData || []);
          }
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };

    fetchUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (_event === "SIGNED_OUT") {
        setUser(null);
        setAccessToken(null);
        router.push("/auth");
      } else if (session) {
        fetchUser();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const updateAvatar = async (file: File) => {
    if (!user) throw new Error("User not authenticated");

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const response = await authApi.post("/avatar", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const { avatarUrl } = response.data;
      setUser({ ...user, avatar_url: avatarUrl });
    } catch (error) {
      console.error("Axios avatar upload error:", error);
      throw new Error("Failed to upload avatar.");
    }
  };

  const deleteAccount = async (feedback: string) => {
    try {
      await authApi.delete("/account/delete", {
        data: { feedback },
      });

      await logout();
    } catch (error) {
      console.error("Axios delete account error:", error);
      throw new Error("Failed to delete account.");
    }
  };
  const deleteSecondaryEmail = async (email: string, userId: string) => {
    try {
      await authApi.delete(
        `/settings/secondary-email-id?userId=${userId}&email=${email}`
      );
    } catch (error) {
      console.error("Failed to delete secondary email:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        setUser,
        setAccessToken,
        logout,
        secondaryEmails,
        setSecondaryEmails,
        updateAvatar,
        deleteAccount,
        deleteSecondaryEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
