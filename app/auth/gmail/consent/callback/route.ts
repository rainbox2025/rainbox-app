// app/api/auth/callback/gmail/route.ts (or your actual path)
import { google } from "googleapis";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { initOauthCLient } from "@/lib/oauth"; // Make sure this path is correct
import { createClient } from "@/utils/supabase/server"; // Make sure this path is correct

export async function GET(request: Request) {
  const supabase = await createClient();
  // Ensure your environment variables are prefixed with NEXT_PUBLIC_ if they need to be available client-side
  // For server-side, regular process.env is fine.
  const oauth2Client: any = initOauthCLient(
    process.env.CLIENT_ID!, // Or GOOGLE_CLIENT_ID if you named it that
    process.env.CLIENT_SECRET!, // Or GOOGLE_CLIENT_SECRET
    process.env.REDIRECT_URI! // This should be the full URL to THIS API route
  );

  try {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");

    if (!code) {
      // Redirect to an error page or login page with an error message
      const errorRedirectUrl = new URL(
        "/login",
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      );
      errorRedirectUrl.searchParams.set("error", "oauth_no_code");
      return NextResponse.redirect(errorRedirectUrl.toString(), 302);
    }

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();

    if (!userInfo || !userInfo.email) {
      // Handle case where email is not retrieved
      const errorRedirectUrl = new URL(
        "/login",
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      );
      errorRedirectUrl.searchParams.set("error", "oauth_no_email");
      return NextResponse.redirect(errorRedirectUrl.toString(), 302);
    }

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

    console.log("Attempting to store tokens for email:", userInfo.email);

    await supabase.from("gmail_tokens").upsert(
      {
        email: userInfo.email as string,
        user_email: user.email, // Add the authenticated user's email
        tokens: {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          scope: tokens.scope,
          token_type: tokens.token_type,
          expiry_date: tokens.expiry_date,
        },
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "email",
      }
    );

    // Verify token storage (optional, but good for debugging)
    const { data: verifyData, error: verifyError } = await supabase
      .from("gmail_tokens")
      .select("tokens")
      .eq("email", userInfo.email)
      .single();

    if (verifyError || !verifyData) {
      console.error("Token verification error:", verifyError);
      // You might want to redirect to an error page here too,
      // but for now, let's assume success if upsert didn't throw.
    }

    // Set cookies (this part is fine)
    const cookieStore = cookies();
    cookieStore.set({
      name: "consent_tokens", // You might want a more specific name like "gmail_consent_tokens"
      value: JSON.stringify(tokens),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/", // Good to specify path
    });

    // --- KEY CHANGE: REDIRECT ---
    // Construct the redirect URL to your dashboard
    // Make sure NEXT_PUBLIC_APP_URL is set in your .env.local (e.g., NEXT_PUBLIC_APP_URL=http://localhost:3000)
    const dashboardUrl = new URL(
      "/dashboard",
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    );
    dashboardUrl.searchParams.set("gmail_connected", "true");
    dashboardUrl.searchParams.set("email", userInfo.email as string);

    return NextResponse.redirect(dashboardUrl.toString(), 302); // 302 for temporary redirect
  } catch (error: any) {
    console.error("OAuth Callback Error:", error.message);
    console.error("Full error object:", error);

    // Redirect to an error page or login page with an error message
    const errorRedirectUrl = new URL(
      "/login",
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    );
    errorRedirectUrl.searchParams.set("error", "oauth_failed");
    if (error.message) {
      errorRedirectUrl.searchParams.set("error_message", error.message);
    }
    return NextResponse.redirect(errorRedirectUrl.toString(), 302);
  }
}
