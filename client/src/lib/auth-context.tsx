import React, { createContext, useContext, ReactNode } from "react";
import { useLocation } from "wouter";
import { useSupabaseAuth, SupabaseAuthProvider } from "./supabase-auth";

interface AuthContextType {
  isAuthenticated: boolean;
  username: string | null;
  role: string | null;
  userId: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
  logout: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <SupabaseAuthProvider>
      <AuthContextBridge>{children}</AuthContextBridge>
    </SupabaseAuthProvider>
  );
}

function AuthContextBridge({ children }: { children: ReactNode }) {
  const [, setLocation] = useLocation();
  const supabaseAuth = useSupabaseAuth();

  const handleSignOut = async () => {
    await supabaseAuth.signOut();
    setLocation("/");
  };

  const handleLogin = async (email: string, password: string) => {
    const { error } = await supabaseAuth.signIn(email, password);
    if (error) {
      throw new Error(error.message);
    }
    setLocation("/admin");
  };

  const role = supabaseAuth.isAuthenticated ? "admin" : "user";

  const value: AuthContextType = {
    isAuthenticated: supabaseAuth.isAuthenticated,
    username: supabaseAuth.user?.email || supabaseAuth.user?.user_metadata?.name || null,
    role,
    userId: supabaseAuth.user?.id || null,
    loading: supabaseAuth.loading,
    signOut: handleSignOut,
    logout: handleSignOut,
    login: handleLogin,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

export function useIsAdmin() {
  const { role } = useAuth();
  return role === "admin" || role === "editor";
}
