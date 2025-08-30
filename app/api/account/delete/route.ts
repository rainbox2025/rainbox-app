import { createAdminClient, createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { google } from "googleapis";
import { initOauthCLient } from "@/lib/oauth";
import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const databaseId = process.env.NOTION_DB_ID!;

async function createFeedbackEntry({
  username,
  email,
  message,
}: {
  username: string;
  email: string;
  message: string;
}) {
  return await notion.pages.create({
    parent: { database_id: databaseId },
    properties: {
      username: { title: [{ text: { content: username } }] },
      email: { email },
      message: { rich_text: [{ text: { content: message } }] },
      type: { select: { name: "Delete" } },
      timestamp: { date: { start: new Date().toISOString() } },
    },
  });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const supabaseAdmin = await createAdminClient();

  try {
    const { feedback } = await request.json();

    // get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const username = await supabase
      .from("users")
      .select("user_name")
      .eq("id", user.id)
      .single()
      .then(({ data }) => data?.user_name || "Unknown");

    const email = user.email!;
    const name =
      user.user_metadata?.full_name ||
      user.user_metadata?.username ||
      "Anonymous";

    // save feedback to Notion
    if (feedback?.trim()) {
      try {
        await createFeedbackEntry({
          username: name,
          email,
          message: feedback.trim(),
        });
      } catch (e) {
        console.error("Error saving feedback to Notion:", e);
      }
    }

    // === Gmail cleanup ===
    const { data: gmailTokenData } = await supabase
      .from("gmail_tokens")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (gmailTokenData) {
      const oauth2Client = initOauthCLient(
        process.env.CLIENT_ID,
        process.env.CLIENT_SECRET,
        process.env.REDIRECT_URI
      );
      oauth2Client.setCredentials(gmailTokenData.tokens);

      const gmail = google.gmail({ version: "v1", auth: oauth2Client });

      try {
        await gmail.users.stop({ userId: "me" });
      } catch (error) {
        console.error("Error stopping Gmail watch:", error);
      }

      try {
        await oauth2Client.revokeToken(gmailTokenData.tokens.access_token);
      } catch (error) {
        console.error("Error revoking Gmail token:", error);
      }
    }

    // === Outlook cleanup ===
    const { data: outlookWatch } = await supabase
      .from("outlook_watch")
      .select("subscription_id")
      .eq("user_email", user.email)
      .single();

    const { data: outlookToken } = await supabase
      .from("outlook_tokens")
      .select("tokens")
      .eq("user_email", user.email)
      .single();

    if (outlookWatch?.subscription_id && outlookToken?.tokens) {
      try {
        await fetch(
          `https://graph.microsoft.com/v1.0/subscriptions/${outlookWatch.subscription_id}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${outlookToken.tokens.access_token}`,
            },
          }
        );
      } catch (error) {
        console.error("Failed to delete Microsoft subscription:", error);
      }
    }

    await supabase.from("outlook_watch").delete().eq("user_email", user.email);
    await supabase.from("outlook_tokens").delete().eq("user_email", user.email);

    // === App DB cleanup ===
    const { error } = await supabase.from("deleted_usernames").insert({
      username: username,
    });
    if (error) {
      console.error("Error saving username to Supabase:", error);
    }

    const deletePromises = [supabase.from("users").delete().eq("id", user.id)];
    const deleteResults = await Promise.allSettled(deletePromises);
    deleteResults.forEach((result, index) => {
      if (result.status === "rejected") {
        console.error(`Error deleting from table ${index}:`, result.reason);
      }
    });

    // === Auth cleanup ===
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(
      user.id
    );
    if (deleteError) {
      console.error("Error deleting user from auth:", deleteError);
      throw new Error(
        "Failed to delete user account from authentication system"
      );
    }

    return NextResponse.json({
      success: true,
      message: "Account deleted successfully",
      feedback: !!feedback,
    });
  } catch (error: any) {
    console.error("Delete account error:", error);
    return NextResponse.json(
      { error: "Failed to delete account", details: error.message },
      { status: 500 }
    );
  }
}
