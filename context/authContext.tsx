"use client";
import { createContext, useState, useEffect, useContext } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { User } from '@/types/data';
import { useAxios } from "@/hooks/useAxios"; // Adjust this path if your hook is elsewhere

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  setUser: (user: User | null) => void;
  setAccessToken: (accessToken: string | null) => void;
  logout: () => Promise<void>;
  updateAvatar: (file: File) => Promise<void>;
  deleteAccount: (feedback: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const supabase = createClient();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Initialize the custom axios instance.
  // It must be called at the top level of the component.
  const api = useAxios();

  const fetchUser = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { data: userProfile } = await supabase
          .from('users')
          .select('avatar_url, full_name')
          .eq('id', authUser.id)
          .single();

        const fullName = userProfile?.full_name || authUser.user_metadata?.full_name || "";

        setUser({
          id: authUser.id,
          email: authUser.email || "",
          avatar_url: userProfile?.avatar_url || authUser.user_metadata?.avatar_url || "",
          full_name: fullName,
          user_name: fullName.split(" ")[0] || "",
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
    fetchUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (_event === 'SIGNED_OUT') {
        setUser(null);
        setAccessToken(null);
        router.push('/auth');
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
    formData.append('avatar', file);

    try {
      // Use the custom axios instance. The base URL is already configured in useAxios.
      const response = await api.post('/avatar', formData, {
        headers: {
          // Important for file uploads with FormData
          'Content-Type': 'multipart/form-data',
        },
      });

      const { avatarUrl } = response.data;
      setUser({ ...user, avatar_url: avatarUrl });
    } catch (error) {
      console.error("Axios avatar upload error:", error);
      throw new Error('Failed to upload avatar.');
    }
  };

  const deleteAccount = async (feedback: string) => {
    try {
      // Use the custom axios instance. For axios.delete, the payload is in the `data` property.
      await api.delete('/account/delete', {
        data: { feedback }
      });

      await logout();
    } catch (error) {
      console.error("Axios delete account error:", error);
      throw new Error('Failed to delete account.');
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        setUser,
        setAccessToken,
        logout,
        updateAvatar,
        deleteAccount,
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