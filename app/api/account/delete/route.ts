import { createAdminClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { google } from "googleapis";
import { initOauthCLient } from "@/lib/oauth";
import { log } from "console";

export async function DELETE(request: Request) {
  const supabase = await createAdminClient();

  try {
    const { feedback } = await request.json();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (feedback?.trim()) {
      const { error: feedbackError } = await supabase.from("feedbacks").insert({
        email: user.email,
        username: user.user_metadata?.full_name,
        feedback: feedback.trim(),
      });

      if (feedbackError) {
        console.error("Error saving feedback:", feedbackError);
      }
    }

    const { data: tokenData } = await supabase
      .from("gmail_tokens")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (tokenData) {
      const oauth2Client = initOauthCLient(
        process.env.CLIENT_ID,
        process.env.CLIENT_SECRET,
        process.env.REDIRECT_URI
      );
      oauth2Client.setCredentials(tokenData.tokens);

      const gmail = google.gmail({ version: "v1", auth: oauth2Client });

      try {
        await gmail.users.stop({
          userId: "me",
        });
      } catch (error) {
        console.error("Error stopping Gmail watch:", error);
      }

      try {
        await oauth2Client.revokeToken(tokenData.tokens.access_token);
      } catch (error) {
        console.error("Error revoking token:", error);
      }
    }

    // Delete from all tables in correct order
    await supabase.from("gmail_watch").delete().eq("user_id", user.id);
    await supabase.from("gmail_tokens").delete().eq("user_id", user.id);
    await supabase.from("mails").delete().eq("user_id", user.id);
    await supabase.from("senders").delete().eq("user_id", user.id);
    await supabase.from("users").delete().eq("id", user.id); // Delete from rainbox.users

    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      console.error("Error signing out user:", signOutError);
      throw new Error("Failed to sign out user");
    }

    const { error: deleteError } = await supabase.auth.admin.deleteUser(
      user.id,
      true
    );

    if (deleteError) {
      console.error("Error deleting user:", deleteError);
      throw new Error("Failed to delete user account");
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
