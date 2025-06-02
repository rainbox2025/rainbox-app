import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

const DEFAULT_PREFERENCES = {
  font_size: "medium",
  ai_prompt: "Summarize this email in a concise and clear manner",
  voice_speed: "1.0",
  selected_voice: "default",
};

export async function POST(request: Request) {
  const supabase = await createClient();

  try {
    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Check if preferences already exist
    const { data: existingPrefs } = await supabase
      .from("user_preferences")
      .select("user_id")
      .eq("user_id", user.id)
      .single();

    // Only initialize if no preferences exist
    if (!existingPrefs) {
      const { error: insertError } = await supabase
        .from("user_preferences")
        .insert({
          user_id: user.id,
          ...DEFAULT_PREFERENCES,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error("Error initializing preferences:", insertError);
        return NextResponse.json(
          { error: "Failed to initialize preferences" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: existingPrefs
        ? "Preferences already exist"
        : "Preferences initialized successfully",
    });
  } catch (error: any) {
    console.error("Preferences initialization error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
