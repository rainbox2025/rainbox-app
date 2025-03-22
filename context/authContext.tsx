"use client";
import { createContext, useState, useEffect, useContext } from "react";
import { User } from "@/types/data";
import { createClient } from "@/utils/supabase/client";

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    const fetchUser = async () => {
      const { data: user } = await supabase.auth.getUser();
      if (user?.user) {
        setUser({
          id: user.user.id,
          email: user.user.email || "",
          avatar_url: user.user.user_metadata?.avatar_url || "",
          user_name: user.user.user_metadata?.user_name || "",
        });
      }
    };
    fetchUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser }}>
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
