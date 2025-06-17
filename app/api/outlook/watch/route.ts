import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  try {
    // Get the authenticated user first
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get tokens using authenticated user's email
    const { data: tokenData, error: tokenError } = await supabase
      .from("outlook_tokens")
      .select("tokens, email")
      .eq("user_email", user.email)
      .single();

    if (tokenError || !tokenData) {
      return NextResponse.json(
        { error: "No Outlook account connected" },
        { status: 401 }
      );
    }

    // Verify token format and refresh if needed
    if (!tokenData.tokens.access_token?.includes(".")) {
      // Token needs refresh
      const refreshResponse = await fetch(
        "https://login.microsoftonline.com/common/oauth2/v2.0/token",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            client_id: process.env.OUTLOOK_CLIENT_ID!,
            client_secret: process.env.OUTLOOK_CLIENT_SECRET!,
            refresh_token: tokenData.tokens.refresh_token,
            grant_type: "refresh_token",
          }),
        }
      );

      if (!refreshResponse.ok) {
        return NextResponse.json(
          { error: "Failed to refresh token" },
          { status: 401 }
        );
      }

      const newTokens = await refreshResponse.json();

      // Update tokens in database
      await supabase
        .from("outlook_tokens")
        .update({
          tokens: newTokens,
          updated_at: new Date().toISOString(),
        })
        .eq("user_email", user.email); // Use user_email instead of email

      // Use new access token
      tokenData.tokens = newTokens;
    }

    // Check for existing watch record
    const { data: existingWatch, error: watchError } = await supabase
      .from("outlook_watch")
      .select("subscription_id")
      .eq("user_email", user.email)
      .single();

    console.log("Existing watch record:", existingWatch);

    if (existingWatch) {
      // Delete existing subscription in Microsoft Graph
      const deleteResponse = await fetch(
        `https://graph.microsoft.com/v1.0/subscriptions/${existingWatch.subscription_id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${tokenData.tokens.access_token}`,
          },
        }
      );

      if (!deleteResponse.ok && deleteResponse.status !== 404) {
        console.error(
          "Failed to delete existing subscription:",
          await deleteResponse.text()
        );
      }
    }

    // Create new subscription using Microsoft Graph API
    const notificationUrl = process.env.OUTLOOK_WEBHOOK_URI;
    const response = await fetch(
      "https://graph.microsoft.com/v1.0/subscriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokenData.tokens.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          changeType: "created", // Only listen for created events
          notificationUrl,
          resource: "/me/mailFolders/inbox/messages",
          expirationDateTime: new Date(Date.now() + 4230 * 60000).toISOString(),
          clientState: user.id,
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

    // Update or create watch record
    const { error: upsertError } = await supabase.from("outlook_watch").upsert(
      {
        email: tokenData.email,
        user_email: user.email,
        subscription_id: subscriptionData.id,
        expiration: subscriptionData.expirationDateTime,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_email",
      }
    );

    if (upsertError) {
      console.error("Watch upsert error:", upsertError);
      throw new Error("Failed to store watch data");
    }

    // Verify storage
    const { data: verifyData, error: verifyError } = await supabase
      .from("outlook_watch")
      .select("subscription_id, expiration, user_email")
      .eq("user_email", user.email) // Only check by user_email
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
