import { Preferences } from "@/types/data";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

// ! Bootstrap User preference during bootstrap
// ? Is user preference being bootstrapped?
export async function PUT(request: Request) {
  const supabase = await createClient();

  try {
    const { preferences } = (await request.json()) as {
      preferences: Preferences;
    };

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { error: updateError } = await supabase
      .from("user_preferences")
      .upsert(
        {
          user_id: user.id,
          font_size: preferences.font_size,
          ai_prompt: preferences.ai_prompt,
          voice_speed: preferences.voice_speed,
          selected_voice: preferences.selected_voice,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
        }
      );

    if (updateError) {
      console.error("Error updating preferences:", updateError);
      return NextResponse.json(
        { error: "Failed to update preferences" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Preferences updated successfully",
    });
  } catch (error: any) {
    console.error("Preferences update error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const supabase = await createClient();

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data: preferences, error: fetchError } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      // Ignore not found error
      console.error("Error fetching preferences:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch preferences" },
        { status: 500 }
      );
    }
    delete preferences?.user_id; // Remove user_id from response
    return NextResponse.json({
      preferences: preferences || {},
    });
  } catch (error: any) {
    console.error("Preferences fetch error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
