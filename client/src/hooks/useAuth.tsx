import React, { createContext, useContext, useEffect, useState } from "react";
import { API_URL } from "@/config";
import { Database } from "@/types/database.types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface AuthContextType {
  user: { id: string, email: string } | null;
  jwt: string | null;
  refreshToken: string | null;
  profile: Profile | null;
  stats: { active: number, sold: number, reviews: number, total: number, earned: number, rating: number } | null;
  isLoading: boolean;
  login: (accessToken: string, refreshToken: string, userData: any) => void;
  signOut: () => void;
  refreshAccessToken: () => Promise<string | null>;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  jwt: null,
  refreshToken: null,
  profile: null,
  stats: null,
  isLoading: true,
  login: () => {},
  signOut: () => {},
  refreshAccessToken: async () => null,
  updateProfile: async () => {},
});

const API_BASE = API_URL;

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<{ id: string, email: string } | null>(null);
  const [jwt, setJwt] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<AuthContextType['stats']>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check local storage for existing tokens
    const accessToken = localStorage.getItem("token");
    const storedRefreshToken = localStorage.getItem("refreshToken");
    
    if (accessToken) {
      setJwt(accessToken);
      setRefreshToken(storedRefreshToken);
      fetchProfile(accessToken);
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
      
      if (response.status === 403 || response.status === 401) {
        // Access token might be expired, try refreshing
        const newToken = await refreshAccessToken();
        if (newToken) {
          return fetchProfile(newToken);
        }
        throw new Error("Session expired");
      }

      if (!response.ok) {
        throw new Error("Failed to authenticate token");
      }

      const { user: userData, stats: userStats } = await response.json();
      setUser({ id: userData.id, email: userData.email });
      setProfile(userData);
      setStats(userStats || null);

    } catch (error) {
      console.error("Auth Error:", error);
      signOut();
    } finally {
      setIsLoading(false);
    }
  };

  const refreshAccessToken = async (): Promise<string | null> => {
    const storedRefreshToken = localStorage.getItem("refreshToken") || refreshToken;
    if (!storedRefreshToken) return null;

    try {
      const response = await fetch(`${API_BASE}/auth/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: storedRefreshToken })
      });

      if (!response.ok) throw new Error('Refresh failed');

      const { accessToken } = await response.json();
      localStorage.setItem("token", accessToken);
      setJwt(accessToken);
      return accessToken;
    } catch (err) {
      signOut();
      return null;
    }
  };

  const login = (accessToken: string, refreshToken: string, userData: any) => {
    localStorage.setItem("token", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    setJwt(accessToken);
    setRefreshToken(refreshToken);
    setUser({ id: userData.id, email: userData.email });
    setProfile(userData);
  };

  const signOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    setJwt(null);
    setRefreshToken(null);
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
    <AuthContext.Provider value={{ user, jwt, refreshToken, profile, stats, isLoading, login, signOut, refreshAccessToken, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
