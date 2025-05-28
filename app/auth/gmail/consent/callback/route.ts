import { google } from "googleapis";
import { NextResponse } from "next/server";
// cookies import is not directly needed here if createClient handles it
import { initOauthCLient } from "@/lib/oauth";
import { createClient } from "@/utils/supabase/server"; // Ensure this path is correct

export async function GET(request: Request) {
  // Correctly await the Supabase client initialization
  const supabase = await createClient(); // <--- ADD await HERE

  const oauth2Client: any = initOauthCLient(
    process.env.CLIENT_ID!,
    process.env.CLIENT_SECRET!,
    process.env.REDIRECT_URI!
  );

  try {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");

    if (!code) {
      const errorRedirectUrl = new URL("/dashboard", url.origin);
      errorRedirectUrl.searchParams.set("gmail_error", "true");
      errorRedirectUrl.searchParams.set("error_message", "No authorization code provided.");
      return NextResponse.redirect(errorRedirectUrl.toString());
    }

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();
    

    if (!userInfo || !userInfo.email) {
        const errorRedirectUrl = new URL("/dashboard", url.origin);
        errorRedirectUrl.searchParams.set("gmail_error", "true");
        errorRedirectUrl.searchParams.set("error_message", "Failed to retrieve user info from Google.");
        return NextResponse.redirect(errorRedirectUrl.toString());
    }

    console.log("Attempting to store tokens for email:", userInfo.email);

    // Get current user ID from Supabase auth session
    // This is crucial for associating the token with the correct user in your system
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        console.error("No authenticated user found to associate Gmail token.");
        const errorRedirectUrl = new URL("/dashboard", url.origin); // Or login page
        errorRedirectUrl.searchParams.set("gmail_error", "true");
        errorRedirectUrl.searchParams.set("error_message", "User authentication required to link Gmail account.");
        return NextResponse.redirect(errorRedirectUrl.toString());
    }

    const { error: upsertError } = await supabase.from("gmail_tokens").upsert(
      {
        email: userInfo.email as string,
        user_id: user.id, //  <--- ASSOCIATE WITH LOGGED IN USER
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
        onConflict: "email, user_id", // Adjust onConflict if a user can link multiple accounts or if email should be unique across all users.
                                     // If one email can only be linked to one user, 'email' is fine.
                                     // If one user can link only one gmail, 'user_id' might be part of a composite key.
                                     // For 'user_id' and 'email' as primary key, use: { onConflict: 'user_id, email' }
                                     // Ensure your table `gmail_tokens` has a `user_id` column.
      }
    );

    if (upsertError) {
      console.error("Token storage error:", upsertError);
      const errorRedirectUrl = new URL("/dashboard", url.origin);
      errorRedirectUrl.searchParams.set("gmail_error", "true");
      errorRedirectUrl.searchParams.set("error_message", `Failed to store Gmail tokens: ${upsertError.message}`);
      return NextResponse.redirect(errorRedirectUrl.toString());
    }
    
    console.log("Tokens stored successfully for:", userInfo.email, "user:", user.id);

    const successRedirectUrl = new URL("/dashboard", url.origin);
    successRedirectUrl.searchParams.set("gmail_success", "true");
    successRedirectUrl.searchParams.set("email", userInfo.email);

    const response = NextResponse.redirect(successRedirectUrl.toString());

    if (tokens.refresh_token) {
        response.cookies.set({
            name: "consent_tokens",
            value: JSON.stringify({ refresh_token: tokens.refresh_token, email: userInfo.email, user_id: user.id }),
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24 * 30,
        });
    } else {
        console.warn("No refresh_token received from Google for user:", user.id);
    }
    
    return response;

  } catch (error: any) {
    const url = new URL(request.url);

const errorRedirectUrl = new URL("/dashboard", url.origin);
errorRedirectUrl.searchParams.set("gmail_error", "true");
errorRedirectUrl.searchParams.set("error_message", error.message || "Something went wrong");

return NextResponse.redirect(errorRedirectUrl.toString());

  }
}