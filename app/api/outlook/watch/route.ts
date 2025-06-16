import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Get tokens and user_email from database
    const { data: tokenData, error: tokenError } = await supabase
      .from("outlook_tokens")
      .select("tokens, user_email")
      .eq("email", email)
      .single();

    if (tokenError || !tokenData) {
      return NextResponse.json(
        { error: "No tokens found for this email" },
        { status: 401 }
      );
    }

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("email", tokenData.user_email)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create subscription using Microsoft Graph API
    const notificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/outlook/webhook`;
    const response = await fetch(
      "https://graph.microsoft.com/v1.0/subscriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokenData.tokens.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          changeType: "created,updated",
          notificationUrl,
          resource: "/me/mailFolders/inbox/messages",
          expirationDateTime: new Date(Date.now() + 4230 * 60000).toISOString(), // Max 4230 minutes (3 days)
          clientState: userData.id, // Used to verify webhook authenticity
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        `Failed to create subscription: ${JSON.stringify(error)}`
      );
    }

    const subscriptionData = await response.json();

    // Store subscription data
    await supabase.from("outlook_watch").upsert({
      email,
      user_email: tokenData.user_email,
      user_id: userData.id,
      subscription_id: subscriptionData.id,
      expiration: subscriptionData.expirationDateTime,
      updated_at: new Date().toISOString(),
    });

    // Verify storage
    const { data: verifyData, error: verifyError } = await supabase
      .from("outlook_watch")
      .select("subscription_id, expiration, user_email, user_id")
      .eq("email", email)
      .eq("user_email", tokenData.user_email)
      .single();

    if (verifyError || !verifyData) {
      console.error("Watch verification error:", verifyError);
      throw new Error("Failed to verify subscription storage");
    }

    return NextResponse.json({
      success: true,
      subscriptionId: subscriptionData.id,
      expiration: subscriptionData.expirationDateTime,
      stored: {
        subscriptionId: verifyData.subscription_id,
        expiration: verifyData.expiration,
        user_email: verifyData.user_email,
      },
    });
  } catch (error: any) {
    console.error("Subscription setup error:", {
      message: error.message,
      details: error.details,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: "Failed to setup subscription", details: error.message },
      { status: 500 }
    );
  }
}
