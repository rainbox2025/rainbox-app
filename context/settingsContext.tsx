"use client";
import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from "react";
import { useAuth } from "./authContext";
import { useAxios } from "@/hooks/useAxios";
import { Preferences, SenderType } from '@/types/data';

const DEFAULT_PREFERENCES: Preferences = {
  font_size: "medium",
  ai_prompt: "Summarize this email in a concise and clear manner",
  voice_speed: "1.0",
  selected_voice: "Default",
};

interface SettingsContextType {
  preferences: Preferences;
  globalNotificationsEnabled: boolean;
  senders: SenderType[];
  updatePreferences: (newPrefs: Partial<Preferences>) => void;
  updateGlobalNotifications: (enabled: boolean) => void;
  updateSenderNotification: (senderId: string, enabled: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const api = useAxios();

  const [preferences, setPreferences] = useState<Preferences>(DEFAULT_PREFERENCES);
  const [globalNotificationsEnabled, setGlobalNotificationsEnabled] = useState<boolean>(true);
  const [senders, setSenders] = useState<SenderType[]>([]);
  const isInitialFetchDone = useRef(false);

  useEffect(() => {
    const fetchAllSettings = async () => {
      if (!user) return;
      try {
        const [prefsRes, notifsRes] = await Promise.all([
          api.get('/account/preferences'),
          api.get('/account/notifications')
        ]);

        if (prefsRes.data.preferences) {
          setPreferences({ ...DEFAULT_PREFERENCES, ...prefsRes.data.preferences });
        }
        if (notifsRes.data) {
          setGlobalNotificationsEnabled(notifsRes.data.global_notification);
          setSenders(notifsRes.data.senders || []);
        }
      } catch (error) {
        console.error("Failed to fetch settings:", error);
      } finally {
        isInitialFetchDone.current = true;
      }
    };
    fetchAllSettings();
  }, [user]);

  useEffect(() => {
    if (!isInitialFetchDone.current) return;
    const handler = setTimeout(() => {
      api.put('/account/preferences', { preferences }).catch(e => console.error("Sync failed:", e));
    }, 750);
    return () => clearTimeout(handler);
  }, [preferences]);

  const updatePreferences = useCallback((newPrefs: Partial<Preferences>) => {
    setPreferences(prev => ({ ...prev, ...newPrefs }));
  }, []);

  const updateGlobalNotifications = useCallback((enabled: boolean) => {
    // 1. Instantly update UI by setting state
    setGlobalNotificationsEnabled(enabled);

    // 2. Call API in background, reverting on error
    api.put('/account/notifications', { type: 'global', payload: { enabled } })
      .catch(error => {
        console.error("Failed to update global notifications:", error);
        // 3. If API fails, revert the UI state
        setGlobalNotificationsEnabled(!enabled);
      });
  }, []);

  const updateSenderNotification = useCallback((senderId: string, enabled: boolean) => {
    // We use the functional form of setState to get the most recent state
    // and avoid dependency array issues.
    setSenders(currentSenders => {
      // Create the new state for an instant UI update
      const newSenders = currentSenders.map(s =>
        s.id === senderId ? { ...s, notification: enabled } : s
      );

      // Call API in the background
      api.put('/account/notifications', { type: 'sender', payload: { senderId, enabled } })
        .catch(error => {
          console.error(`Failed to update sender ${senderId} notification:`, error);
          // If the API call fails, revert the state to the original `currentSenders`
          setSenders(currentSenders);
        });

      // Return the new state to update the UI immediately
      return newSenders;
    });
  }, []);

  const contextValue = {
    preferences,
    globalNotificationsEnabled,
    senders,
    updatePreferences,
    updateGlobalNotifications,
    updateSenderNotification,
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