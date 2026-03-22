import React, { createContext, useContext, useEffect, useState } from "react";
import { Database } from "@/types/database.types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface AuthContextType {
  user: { id: string, email: string } | null;
  jwt: string | null;
  profile: Profile | null;
  stats: { active: number, sold: number, reviews: number, total: number, earned: number, rating: number } | null;
  isLoading: boolean;
  login: (token: string, userData: any) => void;
  signOut: () => void;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  jwt: null,
  profile: null,
  stats: null,
  isLoading: true,
  login: () => {},
  signOut: () => {},
  updateProfile: async () => {},
});

const API_BASE = "http://localhost:3001/api";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<{ id: string, email: string } | null>(null);
  const [jwt, setJwt] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<AuthContextType['stats']>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check local storage for an existing token
    const token = localStorage.getItem("token");
    if (token) {
      setJwt(token);
      fetchProfile(token);
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchProfile = async (token: string) => {
    try {
      const response = await fetch(`${API_BASE}/auth/me`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error("Failed to authenticate token");
      }

      const { user: userData, stats: userStats } = await response.json();
      setUser({ id: userData.id, email: userData.email });
      setProfile(userData);
      setStats(userStats || null);

    } catch (error) {
      console.error("Auth Error:", error);
      // Clean up invalid session
      localStorage.removeItem("token");
      setJwt(null);
      setUser(null);
      setProfile(null);
      setStats(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = (token: string, userData: any) => {
    localStorage.setItem("token", token);
    setJwt(token);
    setUser({ id: userData.id, email: userData.email });
    setProfile(userData);
  };

  const signOut = () => {
    localStorage.removeItem("token");
    setJwt(null);
    setUser(null);
    setProfile(null);
    setStats(null);
  };

  const updateProfile = async (data: Partial<Profile>) => {
    if (!jwt) return;
    const response = await fetch(`${API_BASE}/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwt}`
      },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to update profile');
    
    // Optimistic update
    setProfile(prev => prev ? { ...prev, ...data } : null);
  };

  return (
    <AuthContext.Provider value={{ user, jwt, profile, stats, isLoading, login, signOut, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
