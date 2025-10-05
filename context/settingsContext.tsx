"use client";
import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { useAuth } from "./authContext";
import { useAxios } from "@/hooks/useAxios";
import { Preferences, SenderType } from "@/types/data";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

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
  submitFeedback: (feedback: FormData) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export const SettingsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { user } = useAuth();
  const api = useAxios();

  const [preferences, setPreferences] =
    useState<Preferences>(DEFAULT_PREFERENCES);
  const [globalNotificationsEnabled, setGlobalNotificationsEnabled] =
    useState<boolean>(true);
  const [senders, setSenders] = useState<SenderType[]>([]);

  const isInitialFetchDone = useRef(false);

  const queryClient = useQueryClient();

  const { data: preferencesData, isLoading: isPreferencesLoading } = useQuery({
    queryKey: ["settings", "preferences"],
    queryFn: async () => {
      const { data } = await api.get("/account/preferences");
      return data.preferences;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const { data: notificationsData, isLoading: isNotificationsLoading } =
    useQuery({
      queryKey: ["settings", "notifications"],
      queryFn: async () => {
        const { data } = await api.get("/account/notifications");
        return data;
      },
      enabled: !!user,
      staleTime: 5 * 60 * 1000,
    });

  useEffect(() => {
    if (preferencesData) {
      setPreferences({ ...DEFAULT_PREFERENCES, ...preferencesData });
      isInitialFetchDone.current = true;
    }
  }, [preferencesData]);

  useEffect(() => {
    if (notificationsData) {
      setGlobalNotificationsEnabled(notificationsData.global_notification);
      setSenders(notificationsData.senders || []);
      isInitialFetchDone.current = true;
    }
  }, [notificationsData]);

  const lastSynced = useRef<Preferences | null>(null);

  useEffect(() => {
    if (!isInitialFetchDone.current) {
      return;
    }

    if (JSON.stringify(preferences) === JSON.stringify(lastSynced.current)) {
      return;
    }

    lastSynced.current = preferences;

    const handler = setTimeout(() => {
      console.log("Syncing preferences to server...");
      api
        .put("/account/preferences", { preferences })
        .catch((e) => console.error("Sync failed:", e));
    }, 750);

    return () => clearTimeout(handler);
  }, [preferences, api]);

  const updatePreferences = useCallback((newPrefs: Partial<Preferences>) => {
    setPreferences((prev) => ({ ...prev, ...newPrefs }));
  }, []);

  const updateGlobalNotificationsMutation = useMutation({
    mutationFn: (enabled: boolean) =>
      api.put("/account/notifications", {
        type: "global",
        payload: { enabled },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["settings", "notifications"],
      });
    },
  });

  const updateGlobalNotifications = useCallback(
    (enabled: boolean) => {
      const previous = globalNotificationsEnabled;
      setGlobalNotificationsEnabled(enabled);
      updateGlobalNotificationsMutation.mutate(enabled, {
        onError: () => {
          setGlobalNotificationsEnabled(previous);
        },
      });
    },
    [globalNotificationsEnabled, updateGlobalNotificationsMutation]
  );

  const updateSenderNotificationMutation = useMutation({
    mutationFn: ({
      senderId,
      enabled,
    }: {
      senderId: string;
      enabled: boolean;
    }) =>
      api.put("/account/notifications", {
        type: "sender",
        payload: { senderId, enabled },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["settings", "notifications"],
      });
    },
  });

  const updateSenderNotification = useCallback(
    (senderId: string, enabled: boolean) => {
      const previousSenders = senders;
      setSenders((currentSenders) =>
        currentSenders.map((s) =>
          s.id === senderId ? { ...s, notification: enabled } : s
        )
      );
      updateSenderNotificationMutation.mutate(
        { senderId, enabled },
        {
          onError: () => {
            setSenders(previousSenders);
          },
        }
      );
    },
    [senders, updateSenderNotificationMutation]
  );

  const submitFeedbackMutation = useMutation({
    mutationFn: (formData: FormData) => api.post("/account/feedback", formData),
  });

  const submitFeedback = useCallback(
    async (formData: FormData) => {
      try {
        await submitFeedbackMutation.mutateAsync(formData);
      } catch (error) {
        console.error("Failed to submit feedback:", error);
        throw error;
      }
    },
    [submitFeedbackMutation]
  );

  const contextValue = {
    preferences,
    globalNotificationsEnabled,
    senders,
    updatePreferences,
    updateGlobalNotifications,
    updateSenderNotification,
    submitFeedback,
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
