import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// GET handler to check the onboarding status
export async function GET(request: Request) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const { data, error } = await supabase
      .from("users")
      .select("onboarding_complete")
      .eq("id", user.id)
      .single();

    if (error) {
      // This can happen if the user row doesn't exist yet, which is a valid "not complete" state
      if (error.code === 'PGRST116') {
        return NextResponse.json({ isComplete: false });
      }
      throw error;
    }

    return NextResponse.json({ isComplete: data?.onboarding_complete || false });

  } catch (error: any) {
    console.error("Error fetching onboarding status:", error.message);
    return NextResponse.json({ error: "Failed to fetch onboarding status" }, { status: 500 });
  }
}

// PATCH handler to mark onboarding as complete
export async function PATCH(request: Request) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const { error } = await supabase
      .from("users")
      .update({ onboarding_complete: true })
      .eq("id", user.id); // Security: Only update the currently logged-in user

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, message: "Onboarding marked as complete." });

  } catch (error: any) {
    console.error("Error updating onboarding status:", error.message);
    return NextResponse.json({ error: "Failed to update onboarding status" }, { status: 500 });
  }
}