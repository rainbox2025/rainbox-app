"use client";
import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from "react";
import { useAuth } from "./authContext";
import { useAxios } from "@/hooks/useAxios";
import { Preferences } from '@/types/data';

const DEFAULT_PREFERENCES: Preferences = {
  font_size: "medium",
  ai_prompt: "Summarize this email in a concise and clear manner",
  voice_speed: "1.0",
  selected_voice: "Default",
};

interface SettingsContextType {
  preferences: Preferences;
  updatePreferences: (newPrefs: Partial<Preferences>) => void;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const api = useAxios();

  // Initialize state with defaults, not null. This is crucial for an instant UI.
  const [preferences, setPreferences] = useState<Preferences>(DEFAULT_PREFERENCES);

  const isInitialFetchDone = useRef(false);

  // Effect to fetch initial settings when user is available
  useEffect(() => {
    const fetchSettings = async () => {
      if (!user) return;

      try {
        const { data } = await api.get('/account/preferences');
        if (data.preferences && Object.keys(data.preferences).length > 0) {
          setPreferences({ ...DEFAULT_PREFERENCES, ...data.preferences });
        }
      } catch (error) {
        console.error("Failed to fetch user preferences:", error);
      } finally {
        isInitialFetchDone.current = true;
      }
    };

    fetchSettings();
  }, [user]);

  // Effect to sync changes to the backend
  useEffect(() => {
    // Don't sync on the initial render or before the first fetch is complete.
    if (!isInitialFetchDone.current) {
      return;
    }

    const handler = setTimeout(async () => {
      try {
        await api.put('/account/preferences', { preferences });
      } catch (error) {
        console.error("Failed to sync preferences:", error);
      }
    }, 750); // Debounce API calls by 750ms

    return () => {
      clearTimeout(handler);
    };
  }, [preferences]);

  const updatePreferences = useCallback((newPrefs: Partial<Preferences>) => {
    setPreferences(prev => ({ ...prev, ...newPrefs }));
  }, []);

  const contextValue = {
    preferences,
    updatePreferences,
  };

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};