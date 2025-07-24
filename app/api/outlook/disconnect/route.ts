import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  const supabase = await createClient();

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data: watchData } = await supabase
      .from("outlook_watch")
      .select("subscription_id")
      .eq("user_email", user.email)
      .single();

    const { data: tokenData } = await supabase
      .from("outlook_tokens")
      .select("tokens")
      .eq("user_email", user.email)
      .single();

    if (watchData?.subscription_id && tokenData?.tokens) {
      await fetch(
        `https://graph.microsoft.com/v1.0/subscriptions/${watchData.subscription_id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${tokenData.tokens.access_token}`,
          },
        }
      ).catch((error) => {
        console.error("Failed to delete Microsoft subscription:", error);
      });
    }

    await supabase.from("outlook_watch").delete().eq("user_email", user.email);

    await supabase.from("outlook_tokens").delete().eq("user_email", user.email);

    cookies().delete("consent_tokens");

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Disconnect error:", error);
    return NextResponse.json(
      { error: "Failed to disconnect", details: error.message },
      { status: 500 }
    );
  }
}