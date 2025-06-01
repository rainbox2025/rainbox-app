import { createAdminClient, createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { google } from "googleapis";
import { initOauthCLient } from "@/lib/oauth";

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const supabaseAdmin = await createAdminClient();

  try {
    const { feedback } = await request.json();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Save feedback if provided
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

    // Handle Gmail integration cleanup
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

    // Delete from custom tables first (in dependency order)
    const deletePromises = [
      supabase.from("gmail_watch").delete().eq("email", user.email),
      supabase.from("gmail_tokens").delete().eq("email", user.email),
      supabase.from("mails").delete().eq("user_id", user.id),
      supabase.from("senders").delete().eq("user_id", user.id),
      supabase.from("users").delete().eq("id", user.id),
    ];

    // Wait for all custom table deletions to complete
    const deleteResults = await Promise.allSettled(deletePromises);

    // Log any errors but don't fail the whole operation
    deleteResults.forEach((result, index) => {
      if (result.status === "rejected") {
        console.error(`Error deleting from table ${index}:`, result.reason);
      }
    });

    // Now delete from auth.users using admin client
    // The admin client needs to target the auth schema specifically
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
