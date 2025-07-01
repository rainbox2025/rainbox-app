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
  submitFeedback: (feedback: string) => Promise<void>;
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

    if (!user) return;

    const fetchAllSettings = async () => {
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



  }, [user?.id]);



  useEffect(() => {


    if (!isInitialFetchDone.current) {
      return;
    }


    const handler = setTimeout(() => {
      console.log("Syncing preferences to server...");
      api.put('/account/preferences', { preferences }).catch(e => console.error("Sync failed:", e));
    }, 750);

    return () => clearTimeout(handler);
  }, [preferences]);


  const updatePreferences = useCallback((newPrefs: Partial<Preferences>) => {
    setPreferences(prev => ({ ...prev, ...newPrefs }));
  }, []);


  const updateGlobalNotifications = useCallback((enabled: boolean) => {
    setGlobalNotificationsEnabled(enabled);
    api.put('/account/notifications', { type: 'global', payload: { enabled } })
      .catch(error => {
        console.error("Failed to update global notifications:", error);
        setGlobalNotificationsEnabled(!enabled);
      });
  }, [api]);

  const updateSenderNotification = useCallback((senderId: string, enabled: boolean) => {
    setSenders(currentSenders => {
      const newSenders = currentSenders.map(s =>
        s.id === senderId ? { ...s, notification: enabled } : s
      );
      api.put('/account/notifications', { type: 'sender', payload: { senderId, enabled } })
        .catch(error => {
          console.error(`Failed to update sender ${senderId} notification:`, error);
          setSenders(currentSenders);
        });
      return newSenders;
    });
  }, [api]);

  const submitFeedback = useCallback(async (feedback: string) => {
    try {
      await api.post('/account/feedback', { feedback });
    } catch (error) {
      console.error("Failed to submit feedback:", error);
      throw error;
    }
  }, [api]);

  const contextValue = {
    preferences,
    globalNotificationsEnabled,
    senders,
    updatePreferences,
    updateGlobalNotifications,
    updateSenderNotification,
    submitFeedback
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