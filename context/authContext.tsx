"use client";
import { createContext, useState, useEffect, useContext } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

// Updated User interface to match Supabase user metadata and additional properties
export interface User {
  id: string;
  email: string;
  avatar_url?: string;
  user_name?: string;
  plan: 'free' | 'pro' | 'enterprise';
  usedFeeds: number;
  totalFeeds: number;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  setUser: (user: User | null) => void;
  setAccessToken: (accessToken: string | null) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const supabase = createClient();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();

        if (userData.user) {
          // Fetch additional user details from your database
          const { data: userProfile, error: profileError } = await supabase
            .from('user_profiles')
            .select('plan, used_feeds, total_feeds')
            .eq('user_id', userData.user.id)
            .single();

          const userObject: User = {
            id: userData.user.id,
            email: userData.user.email || "",
            avatar_url: userData.user.user_metadata?.avatar_url || "",
            user_name: userData.user.user_metadata?.user_name || "",
            plan: userProfile?.plan || 'free',
            usedFeeds: userProfile?.used_feeds || 0,
            totalFeeds: userProfile?.total_feeds || 10 // Default to a base number if not set
          };

          setUser(userObject);

          const { data: sessionData } = await supabase.auth.getSession();
          setAccessToken(sessionData.session?.access_token || null);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN') {
          await fetchUser();
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setAccessToken(null);
        }
      }
    );

    fetchUser();

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    try {
      console.log("logout clicked")
      await supabase.auth.signOut();
      setUser(null);
      setAccessToken(null);
      router.push('/sign-in');
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        setUser,
        setAccessToken,
        logout
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