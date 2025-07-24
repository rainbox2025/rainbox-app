// app/actions.ts
"use server";

import { createClient } from "@/utils/supabase/server";
import { headers, cookies } from "next/headers";
import { redirect } from "next/navigation";
import { google } from "googleapis";
import { initOauthCLient } from "@/lib/oauth";
// TODO
export const resetPasswordAction = async () => {};

// The verifyRecaptcha function remains the same.
async function verifyRecaptcha(token: string | null): Promise<boolean> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  if (!secretKey) {
    console.error("RECAPTCHA_SECRET_KEY is not set.");
    return false;
  }
  if (!token) {
    console.warn("reCAPTCHA token not provided.");
    return false;
  }
  try {
    const response = await fetch(
      `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
    const data = await response.json();
    if (!data.success) {
      console.warn("reCAPTCHA verification failed:", data["error-codes"]);
    }
    return data.success;
  } catch (error) {
    console.error("reCAPTCHA verification request failed:", error);
    return false;
  }
}

// sendOtpAction remains the same as the previous correct version.
export async function sendOtpAction(
  currentEmail: string,
  recaptchaToken: string | null
): Promise<{
  status: "success" | "error";
  message: string;
  requiresName?: boolean;
}> {
  const supabase = await createClient();
  const origin = headers().get("origin")!;
  const normalizedEmail = currentEmail.toLowerCase().trim();

  if (process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY) {
    if (!recaptchaToken) {
      return { status: "error", message: "Please complete the reCAPTCHA." };
    }
    const recaptchaVerified = await verifyRecaptcha(recaptchaToken);
    if (!recaptchaVerified) {
      return {
        status: "error",
        message: "reCAPTCHA verification failed. Please try again.",
      };
    }
  }

  if (!normalizedEmail) {
    return { status: "error", message: "Email is required." };
  }

  try {
    const { data: existingUser, error: userCheckError } = await supabase
      .from("users")
      .select("id")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (userCheckError) {
      console.error("Error checking for existing user:", userCheckError);
      return {
        status: "error",
        message: "Database error. Could not verify user status.",
      };
    }

    const isNewUser = !existingUser;

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${origin}/auth/callback`,
        data: {
          type: "otp", // Specify the type for proper verification
        },
      },
    });

    if (otpError) {
      console.error("Send OTP error:", otpError);
      return {
        status: "error",
        message: otpError.message || "Could not send OTP.",
      };
    }

    return {
      status: "success",
      message: "OTP sent to your email. Please check your inbox.",
      requiresName: isNewUser,
    };
  } catch (e: any) {
    console.error("Generic error in sendOtpAction:", e);
    return {
      status: "error",
      message: e.message || "An unexpected error occurred.",
    };
  }
}

export async function verifyOtpAndSignInAction(
  currentEmail: string,
  otp: string,
  name: string | null,
  isNewUser: boolean
): Promise<{
  status: "success" | "error";
  message: string;
}> {
  const supabase = await createClient();
  const normalizedEmail = currentEmail.toLowerCase().trim();

  if (!normalizedEmail || !otp) {
    return { status: "error", message: "Email and OTP are required." };
  }

  if (isNewUser && (!name || name.trim() === "")) {
    return { status: "error", message: "Name is required for new accounts." };
  }

  const { data, error } = await supabase.auth.verifyOtp({
    email: normalizedEmail,
    token: otp,
    type: "email",
  });

  if (error) {
    console.error("Verify OTP error:", error);
    return {
      status: "error",
      message: error.message || "Invalid OTP or it has expired.",
    };
  }

  if (!data.session) {
    return {
      status: "error",
      message: "Authentication failed. Could not create a session.",
    };
  }

  if (isNewUser && name) {
    const user = data.session.user;
    const trimmedName = name.trim();

    const { error: updateAuthError } = await supabase.auth.updateUser({
      data: { full_name: trimmedName },
    });

    if (updateAuthError) {
      console.error("Error updating user name in auth.users:", updateAuthError);
    }

    const { error: insertPublicUserError } = await supabase
      .from("users")
      .insert({
        id: user.id,
        email: user.email,
        full_name: trimmedName,
      });

    if (insertPublicUserError) {
      console.error(
        "Error inserting user into public.users:",
        insertPublicUserError.message
      );
      return { status: "error", message: "Failed to create user profile." };
    }

    redirect("/dashboard");
  }

  redirect("/dashboard");
}

// signInWithGoogleAction and signOutAction remain the same.
export const signInWithGoogleAction = async () => {
  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
      redirectTo: `${origin}/auth/callback`,
    },
  });
  if (error) {
    console.error("Google Sign-In Error: ", error.code + " " + error.message);
    return redirect(`/auth?error=${encodeURIComponent(error.message)}`);
  }
  return redirect(data.url);
};

export const signOutAction = async () => {
  const supabase = await createClient();
  const cookieStore = cookies();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    try {
      const { data: gmailTokenData } = await supabase
        .from("gmail_tokens")
        .select("tokens, email")
        .eq("user_email", user.email)
        .single();

      if (gmailTokenData) {
        const oauth2Client = initOauthCLient(
          process.env.CLIENT_ID,
          process.env.CLIENT_SECRET,
          process.env.REDIRECT_URI
        );
        oauth2Client.setCredentials(gmailTokenData.tokens);

        const gmail = google.gmail({ version: "v1", auth: oauth2Client });
        await gmail.users.stop({ userId: "me" }).catch(() => {});
        await oauth2Client
          .revokeToken(gmailTokenData.tokens.access_token)
          .catch(() => {});

        await supabase
          .from("gmail_watch")
          .delete()
          .eq("email", gmailTokenData.email);
        await supabase
          .from("gmail_tokens")
          .delete()
          .eq("user_email", user.email);
      }
    } catch (error) {}

    try {
      const { data: outlookTokenData } = await supabase
        .from("outlook_tokens")
        .select("tokens")
        .eq("user_email", user.email)
        .single();

      if (outlookTokenData) {
        const { data: watchData } = await supabase
          .from("outlook_watch")
          .select("subscription_id")
          .eq("user_email", user.email)
          .single();

        if (watchData?.subscription_id) {
          await fetch(
            `https://graph.microsoft.com/v1.0/subscriptions/${watchData.subscription_id}`,
            {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${outlookTokenData.tokens.access_token}`,
              },
            }
          ).catch(() => {});
        }
        await supabase
          .from("outlook_watch")
          .delete()
          .eq("user_email", user.email);
        await supabase
          .from("outlook_tokens")
          .delete()
          .eq("user_email", user.email);
      }
    } catch (error) {}

    cookieStore.delete("consent_tokens");
  }

  await supabase.auth.signOut();
  return redirect("/auth");
};