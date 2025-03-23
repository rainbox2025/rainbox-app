import { createBrowserClient } from "@supabase/ssr";
import { config } from "@/config";
export const createClient = () =>
  createBrowserClient(config.supabase.url!, config.supabase.anonKey!, {
    db: {
      schema: "rainbox",
    },
  });
