"use client";

import { useEffect } from "react";
import { useAuth } from "@/context/authContext";

declare global {
  interface Window {
    OneSignalDeferred: any[];
    OneSignal: any;
  }
}

const OneSignalInit = () => {
  const { user } = useAuth(); // Get authenticated user

  useEffect(() => {
    if (typeof window !== "undefined") {
      console.log("📦 Injecting OneSignal SDK...");

      // Load OneSignal SDK only once
      if (!document.getElementById("onesignal-sdk")) {
        const script = document.createElement("script");
        script.id = "onesignal-sdk";
        script.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
        script.async = true;
        document.head.appendChild(script);

        window.OneSignalDeferred = window.OneSignalDeferred || [];
      }

      window.OneSignalDeferred.push(async function (OneSignal: any) {
        try {
          await OneSignal.init({
            appId: "c6b8738b-4b30-4a48-860f-bce19d797c77",
            safari_web_id: "web.onesignal.auto.3145fc89-5d6b-4727-99ef-e9ab80472582",
            notifyButton: {
              enable: true,
              size: 'medium',
              position: 'bottom-right',
              showCredit: false,
            },
            allowLocalhostAsSecureOrigin: true,
            promptOptions: {
              slidedown: {
                prompts: [
                  {
                    type: "push",
                    autoPrompt: false,
                    text: {
                      actionMessage: "Would you like to receive mail notifications?",
                      acceptButton: "Allow",
                      cancelButton: "No Thanks"
                    }
                  }
                ]
              }
            }
          });

          console.log("✅ OneSignal initialized successfully");

          // Set external user ID if user is logged in
          if (user?.id) {
            await OneSignal.setExternalUserId(user.id);
            console.log("👤 External user ID set:", user.id);
          }

          // Log subscription status
          const isSubscribed = await OneSignal.isPushNotificationsEnabled();
          console.log("🔔 Push subscription status:", isSubscribed ? "Subscribed" : "Not subscribed");

        } catch (error) {
          console.error("❌ OneSignal initialization error:", error);
        }
      });
    }
  }, [user?.id]); // Re-run when user ID changes

  return null;
};

export default OneSignalInit;