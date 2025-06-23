import { google } from "googleapis";
import { NextResponse } from "next/server";
import { initOauthCLient } from "@/lib/oauth";
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
      .from("gmail_tokens")
      .select("tokens, email")
      .eq("user_email", user.email)
      .single();

    if (tokenError || !tokenData) {
      return NextResponse.json(
        { error: "No Gmail account connected" },
        { status: 401 }
      );
    }

    const oauth2Client = initOauthCLient(
      process.env.CLIENT_ID,
      process.env.CLIENT_SECRET,
      process.env.REDIRECT_URI
    );
    oauth2Client.setCredentials(tokenData.tokens);

    const gmail = google.gmail({ version: "v1", auth: oauth2Client });
    const topicName = process.env.PUBSUB_TOPIC_NAME;

    // Check for existing watch
    const { data: existingWatch, error: watchError } = await supabase
      .from("gmail_watch")
      .select("history_id")
      .eq("user_id", user.id)
      .eq("email", tokenData.email)
      .single();

    if (existingWatch) {
      // Stop existing watch
      try {
        await gmail.users.stop({
          userId: "me",
        });
        console.log("Stopped existing watch for user:", user.id);
      } catch (stopError) {
        console.error("Error stopping existing watch:", stopError);
        // Continue even if stop fails - might be already expired
      }
    }

    console.log("Setting up new watch with topic:", topicName);

    // Set up new watch
    const response = await gmail.users.watch({
      userId: "me",
      requestBody: {
        topicName: topicName,
        labelIds: ["INBOX"],
        labelFilterAction: "INCLUDE",
      },
    });

    console.log("Watch response:", {
      historyId: response.data.historyId,
      expiration: response.data.expiration,
      topicName: topicName,
    });

    // Update or create watch record using user_id as unique key
    await supabase.from("gmail_watch").upsert(
      {
        email: tokenData.email,
        user_id: user.id,
        history_id: response.data.historyId,
        expiration: new Date(Number(response.data.expiration)),
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id", // user_id is unique
      }
    );

    // Verify storage using user_id
    const { data: verifyData, error: verifyError } = await supabase
      .from("gmail_watch")
      .select("history_id, expiration")
      .eq("user_id", user.id)
      .single();

    if (verifyError || !verifyData) {
      console.error("Watch verification error:", verifyError);
      throw new Error("Failed to verify watch storage");
    }

    return NextResponse.json({
      success: true,
      historyId: response.data.historyId,
      expiration: response.data.expiration,
      stored: {
        historyId: verifyData.history_id,
        expiration: verifyData.expiration,
      },
    });
  } catch (error: any) {
    console.error("Watch setup error:", {
      message: error.message,
      details: error.details,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: "Failed to setup watch", details: error.message },
      { status: 500 }
    );
  }
}
