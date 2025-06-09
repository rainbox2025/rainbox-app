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
      console.warn("reCAPTCHA verification failed:", data['error-codes']);
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

  if (process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY && !recaptchaToken) { // Check if site key exists
    return { status: "error", message: "Please complete the reCAPTCHA." };
  }
  if (process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY) { // Only verify if site key exists
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

  let requiresName = false;

  try {
    // Check if user exists (Supabase might send OTP anyway, this is more for requiresName logic)
    const { data: existingUser, error: getUserError } = await supabase
      .from('users') // Assuming you have a public.users table
      .select('id')
      .eq('email', currentEmail)
      .maybeSingle();

    // This check is a bit indirect. A more direct way is to let signInWithOtp try without creating user.
    // The previous logic with trying signInWithOtp({shouldCreateUser:false}) first was better.

    // Attempt to send OTP. If user doesn't exist and shouldCreateUser is false, it errors.
    // If shouldCreateUser is true (default), it sends OTP and creates user if not existing.
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: currentEmail,
      options: {
        // shouldCreateUser: true, // Default, set to false if you ONLY want to log in existing users
        emailRedirectTo: `${origin}/auth/callback`, // Fallback redirect, not primary for OTP flow
      },
    });

    if (otpError) {
        // If error indicates "Signups not allowed for otp" or similar, it means user doesn't exist
        // and shouldCreateUser might be implicitly false or an issue with project settings.
        // For simplicity now, we assume shouldCreateUser:true is default & handles new/existing.
        // We need a reliable way to determine if it's a new user.
        // The most robust way is to check the user object *after* successful OTP verification,
        // comparing created_at with last_sign_in_at or checking if a profile exists.
        // For now, let's make a simplified assumption or rely on client hint
        // Forcing 'requiresName' logic here is tricky without a definitive check.
        // A common pattern is:
        // 1. Send OTP.
        // 2. After user enters OTP & it's verified, check if user's profile (e.g., in 'users' table) has a name.
        // 3. If not, THEN prompt for name (either on auth page or on first dashboard visit).

        // The previous approach for requiresName was better:
        const { error: existingUserCheckError } = await supabase.auth.signInWithOtp({
            email: currentEmail,
            options: { shouldCreateUser: false },
        });

        if (existingUserCheckError instanceof AuthApiError &&
            (existingUserCheckError.message.toLowerCase().includes("user not found") ||
             existingUserCheckError.status === 400 || existingUserCheckError.status === 404 )) {
            requiresName = true;
        } else if (existingUserCheckError) {
            // Some other error with the check itself, but proceed to send OTP for creation
            console.warn("Pre-check for user existence failed, proceeding to send OTP:", existingUserCheckError.message);
        }
        // Now send the OTP with shouldCreateUser: true
        const { error: finalOtpError } = await supabase.auth.signInWithOtp({
            email: currentEmail,
            options: { shouldCreateUser: true, emailRedirectTo: `${origin}/auth/callback` }
        });

        if (finalOtpError) {
            console.error("Send OTP error:", finalOtpError);
            return { status: "error", message: finalOtpError.message || "Could not send OTP." };
        }

    }


    return {
      status: "success",
      message: "OTP sent to your email. Please check your inbox (and spam folder).",
      requiresName, // This will be determined by the pre-check logic
    };
  } catch (e: any) {
    console.error("Generic error in sendOtpAction:", e);
    return { status: "error", message: e.message || "An unexpected error occurred." };
  }
}

export async function verifyOtpAndSignInAction(
  currentEmail: string,
  otp: string,
  name: string | null,
  isNewUserFlow: boolean
): Promise<{ // This return type is for client-side error handling. Success results in redirect.
  status: "success" | "error";
  message: string;
  redirectTo?: string; // Not strictly needed if redirect() is used directly
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
    type: 'magiclink', // Or 'email'. 'magiclink' is common for signInWithOtp tokens. Test this!
  });

  if (error) {
    console.error("Verify OTP error:", error);
    return {
      status: "error",
      message: error.message || "Invalid OTP or it has expired. Please try again.",
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
        .from('users')
        .select('id')
        .eq('id', session.user.id)
        .maybeSingle();

    if (publicUserError) console.error("Error checking public.users:", publicUserError.message);

    if (!publicUser && !publicUserError) { // If user not in public.users and no error checking
        const { error: insertPublicUserError } = await supabase
            .from('users')
            .insert({
                id: session.user.id,
                email: session.user.email,
                full_name: name.trim(), // Or however you store name
                // avatar_url: session.user.user_metadata.avatar_url, // If available
            });
        if (insertPublicUserError) {
            console.error("Error inserting user into public.users:", insertPublicUserError.message);
        }
    } else if (publicUser) { // If user exists, update their name if it's different
        const { error: updatePublicUserError } = await supabase
            .from('users')
            .update({ full_name: name.trim() })
            .eq('id', session.user.id);
        if (updatePublicUserError) {
            console.error("Error updating name in public.users:", updatePublicUserError.message);
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