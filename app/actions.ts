// app/actions.ts
"use server";

import { createClient } from "@/utils/supabase/server";
import { AuthApiError } from "@supabase/supabase-js";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

// ... (verifyRecaptcha function remains the same)
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

  if (process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY && !recaptchaToken) {
    // Check if site key exists
    return { status: "error", message: "Please complete the reCAPTCHA." };
  }
  if (process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY) {
    // Only verify if site key exists
    const recaptchaVerified = await verifyRecaptcha(recaptchaToken);
    if (!recaptchaVerified) {
      return {
        status: "error",
        message: "reCAPTCHA verification failed. Please try again.",
      };
    }
  }

  if (!currentEmail) {
    return { status: "error", message: "Email is required." };
  }

  try {
    // First try to get existing user
    const {
      data: { user },
      error: getUserError,
    } = await supabase.auth.getUser();

    // Send OTP with correct type and options
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: currentEmail,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${origin}/auth/callback`,
        // Specify OTP settings
        data: {
          type: "otp",
          action: "signin",
        },
      },
    });

    if (otpError) {
      console.error("OTP error:", otpError);
      return {
        status: "error",
        message: otpError.message || "Could not send OTP.",
      };
    }

    return {
      status: "success",
      message: "OTP sent to your email. Please check your inbox.",
      requiresName: !user, // require name if no existing user
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
  isNewUserFlow: boolean
): Promise<{
  status: "success" | "error";
  message: string;
}> {
  const supabase = await createClient();

  if (!currentEmail || !otp) {
    return { status: "error", message: "Email and OTP are required." };
  }

  if (isNewUserFlow && (!name || name.trim() === "")) {
    return { status: "error", message: "Name is required for new accounts." };
  }

  const {
    data: { session },
    error,
  } = await supabase.auth.verifyOtp({
    email: currentEmail,
    token: otp,
    type: "email", // Change this from 'magiclink' to 'email'
  });

  if (error) {
    console.error("Verify OTP error:", error);
    return {
      status: "error",
      message:
        error.message || "Invalid OTP or it has expired. Please try again.",
    };
  }

  if (!session) {
    return {
      status: "error",
      message: "Could not sign you in. Session not established.",
    };
  }

  // User is signed in. Now, handle name update if it's a new user.
  // A more robust check for "new user" could be to see if their profile name is empty.
  if (session.user && isNewUserFlow && name && name.trim() !== "") {
    const { error: updateError } = await supabase.auth.updateUser({
      data: { full_name: name.trim() }, // Supabase user_metadata
    });
    if (updateError) {
      console.error("Error updating user name in auth.users:", updateError);
      // Decide if this is a critical error. For now, log and proceed.
      // You might also want to update your public.users table here if you have one.
    }

    // Optionally, update your public.users table if you maintain one separately
    // This assumes `session.user.id` and `currentEmail` are available
    // and that your public.users table links to auth.users via id or email.
    // Check if user exists in public.users first to avoid duplicate errors if triggers handle it
    const { data: publicUser, error: publicUserError } = await supabase
      .from("users")
      .select("id")
      .eq("id", session.user.id)
      .maybeSingle();

    if (publicUserError)
      console.error("Error checking public.users:", publicUserError.message);

    if (!publicUser && !publicUserError) {
      // If user not in public.users and no error checking
      const { error: insertPublicUserError } = await supabase
        .from("users")
        .insert({
          id: session.user.id,
          email: session.user.email,
          full_name: name.trim(), // Or however you store name
          // avatar_url: session.user.user_metadata.avatar_url, // If available
        });
      if (insertPublicUserError) {
        console.error(
          "Error inserting user into public.users:",
          insertPublicUserError.message
        );
      }
    } else if (publicUser) {
      // If user exists, update their name if it's different
      const { error: updatePublicUserError } = await supabase
        .from("users")
        .update({ full_name: name.trim() })
        .eq("id", session.user.id);
      if (updatePublicUserError) {
        console.error(
          "Error updating name in public.users:",
          updatePublicUserError.message
        );
      }
    }
  }

  return redirect("/dashboard");
}

// signInWithGoogleAction and signOutAction remain the same
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
  await supabase.auth.signOut();
  return redirect("/auth");
};
