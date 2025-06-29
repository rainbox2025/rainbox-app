import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const clientId = process.env.OUTLOOK_CLIENT_ID!;
  const clientSecret = process.env.OUTLOOK_CLIENT_SECRET!;
  const redirectUri = process.env.OUTLOOK_REDIRECT_URI!;

  try {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");

    if (!code) {
      const errorRedirectUrl = new URL(
        "/login",
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      );
      errorRedirectUrl.searchParams.set("error", "outlook_no_code");
      return NextResponse.redirect(errorRedirectUrl.toString(), 302);
    }

    // Exchange code for tokens
    const tokenResponse = await fetch(
      "https://login.microsoftonline.com/common/oauth2/v2.0/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      }
    );

    const tokens = await tokenResponse.json();

    if (!tokenResponse.ok) {
      throw new Error(`Token exchange failed: ${tokens.error_description}`);
    }

    // Get user info from Microsoft Graph
    const userResponse = await fetch("https://graph.microsoft.com/v1.0/me", {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    const userInfo = await userResponse.json();

    if (!userInfo.mail && !userInfo.userPrincipalName) {
      const errorRedirectUrl = new URL(
        "/login",
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      );
      errorRedirectUrl.searchParams.set("error", "outlook_no_email");
      return NextResponse.redirect(errorRedirectUrl.toString(), 302);
    }

    const email = userInfo.mail || userInfo.userPrincipalName;
    console.log("Attempting to store tokens for email:", email);

    // Get the authenticated user from Supabase
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      const errorRedirectUrl = new URL(
        "/login",
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      );
      errorRedirectUrl.searchParams.set("error", "not_authenticated");
      return NextResponse.redirect(errorRedirectUrl.toString(), 302);
    }

    // Check for existing tokens
    const { data: existingTokens, error: existingTokensError } = await supabase
      .from("outlook_tokens")
      .select("id")
      .eq("user_email", user.email)
      .single();

    // Store or update tokens in Supabase
    await supabase.from("outlook_tokens").upsert(
      {
        email,
        user_email: user.email,
        tokens: {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          scope: tokens.scope,
          token_type: tokens.token_type,
          expires_in: tokens.expires_in,
          ext_expires_in: tokens.ext_expires_in,
        },
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_email", // Update based on user's email
      }
    );

    // Verify token storage
    const { data: verifyData, error: verifyError } = await supabase
      .from("outlook_tokens")
      .select("tokens")
      .eq("user_email", user.email) // Check using user's email
      .single();

    if (verifyError || !verifyData) {
      console.error("Token verification error:", verifyError);
    }

    // Set cookies
    const cookieStore = cookies();
    cookieStore.set({
      name: "outlook_consent_tokens",
      value: JSON.stringify(tokens),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    // Redirect to dashboard
    const dashboardUrl = new URL(
      "/dashboard",
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    );
    dashboardUrl.searchParams.set("outlook_connected", "true");
    dashboardUrl.searchParams.set("email", email);

    return NextResponse.redirect(dashboardUrl.toString(), 302);
  } catch (error: any) {
    console.error("Outlook OAuth Callback Error:", error.message);
    console.error("Full error object:", error);

    const errorRedirectUrl = new URL(
      "/login",
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    );
    errorRedirectUrl.searchParams.set("error", "outlook_oauth_failed");
    if (error.message) {
      errorRedirectUrl.searchParams.set("error_message", error.message);
    }
    return NextResponse.redirect(errorRedirectUrl.toString(), 302);
  }
}
