import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();

  try {
    const cookieStore = cookies();
    const tokensCookie = cookieStore.get("outlook_consent_tokens");

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

    // Refresh the token using Microsoft's token endpoint
    const tokenResponse = await fetch(
      "https://login.microsoftonline.com/common/oauth2/v2.0/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: process.env.OUTLOOK_CLIENT_ID!,
          client_secret: process.env.OUTLOOK_CLIENT_SECRET!,
          refresh_token: tokens.refresh_token,
          grant_type: "refresh_token",
        }),
      }
    );

    if (!tokenResponse.ok) {
      throw new Error("Failed to refresh token");
    }

    const newTokens = await tokenResponse.json();

    // Get user info to verify email
    const userResponse = await fetch("https://graph.microsoft.com/v1.0/me", {
      headers: {
        Authorization: `Bearer ${newTokens.access_token}`,
      },
    });

    if (!userResponse.ok) {
      throw new Error("Failed to get user info");
    }

    const userInfo = await userResponse.json();
    const email = userInfo.mail || userInfo.userPrincipalName;

    // Store refreshed tokens in Supabase
    const { error: upsertError } = await supabase.from("outlook_tokens").upsert(
      {
        email,
        tokens: newTokens,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "email",
        ignoreDuplicates: false,
      }
    );

    if (upsertError) {
      console.error("Token storage error:", upsertError);
      throw new Error("Failed to store refreshed tokens");
    }

    const response = NextResponse.json({
      success: true,
      tokens: newTokens,
      email,
    });

    response.cookies.set({
      name: "outlook_consent_tokens",
      value: JSON.stringify(newTokens),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
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
