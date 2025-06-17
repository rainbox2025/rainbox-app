import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { google } from "googleapis";
import { initOauthCLient } from "@/lib/oauth";
import { createClient } from "@/utils/supabase/server";
// Initialize Supabase client

export async function GET(request: Request) {
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

    const cookieStore = cookies();
    const tokensCookie = cookieStore.get("consent_tokens");

    if (!tokensCookie) {
      return NextResponse.json(
        { error: "No refresh token found" },
        { status: 401 }
      );
    }

    const tokens = JSON.parse(tokensCookie.value);

    if (!tokens.refresh_token) {
      return NextResponse.json(
        { error: "No refresh token available" },
        { status: 401 }
      );
    }

    const oauth2Client = initOauthCLient(
      process.env.CLIENT_ID,
      process.env.CLIENT_SECRET,
      process.env.REDIRECT_URI
    );

    oauth2Client.setCredentials({
      refresh_token: tokens.refresh_token,
    });

    const { credentials } = await oauth2Client.refreshAccessToken();
    oauth2Client.setCredentials(credentials);

    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();

    // Update tokens for the authenticated user
    const { error: upsertError } = await supabase.from("gmail_tokens").upsert(
      {
        email: userInfo.email,
        user_email: user.email,
        tokens: credentials,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_email", // Update based on authenticated user's email
      }
    );

    if (upsertError) {
      console.error("Token storage error:", upsertError);
      throw new Error("Failed to store refreshed tokens");
    }

    const response = NextResponse.json({
      success: true,
      tokens: credentials,
      email: userInfo.email,
    });

    response.cookies.set({
      name: "consent_tokens",
      value: JSON.stringify(credentials),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error: any) {
    console.error("Token refresh error:", error);
    return NextResponse.json(
      { error: "Failed to refresh token", details: error.message },
      { status: 500 }
    );
  }
}
