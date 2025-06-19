import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();

  try {
    // Get the authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get current watch subscription to delete from Microsoft
    const { data: watchData } = await supabase
      .from("outlook_watch")
      .select("subscription_id")
      .eq("user_email", user.email)
      .single();

    // Get tokens for API call
    const { data: tokenData } = await supabase
      .from("outlook_tokens")
      .select("tokens")
      .eq("user_email", user.email)
      .single();

    // If there's an active subscription, try to delete it
    if (watchData?.subscription_id && tokenData?.tokens) {
      try {
        await fetch(
          `https://graph.microsoft.com/v1.0/subscriptions/${watchData.subscription_id}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${tokenData.tokens.access_token}`,
            },
          }
        );
      } catch (error) {
        console.error("Failed to delete Microsoft subscription:", error);
        // Continue with cleanup even if Microsoft API call fails
      }
    }

    // Delete watch record
    await supabase.from("outlook_watch").delete().eq("user_email", user.email);

    // Delete tokens
    await supabase.from("outlook_tokens").delete().eq("user_email", user.email);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Disconnect error:", error);
    return NextResponse.json(
      { error: "Failed to disconnect", details: error.message },
      { status: 500 }
    );
  }
}
