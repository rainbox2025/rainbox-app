// app/actions.ts
"use server";

import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

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
            console.warn("reCAPTCHA verification failed:", data['error-codes']);
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
            .from('users')
            .select('id')
            .eq('email', normalizedEmail)
            .maybeSingle();

        if (userCheckError) {
            console.error("Error checking for existing user:", userCheckError);
            return { status: "error", message: "Database error. Could not verify user status." };
        }

        const isNewUser = !existingUser;

        const { error: otpError } = await supabase.auth.signInWithOtp({
            email: normalizedEmail,
            options: {
                emailRedirectTo: `${origin}/auth/callback`,
            },
        });

        if (otpError) {
            console.error("Send OTP error:", otpError);
            return { status: "error", message: otpError.message || "Could not send OTP." };
        }

        return {
            status: "success",
            message: "OTP sent to your email. Please check your inbox.",
            requiresName: isNewUser,
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
    isNewUser: boolean
): Promise<{
    status: "error";
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

    // FIX 1: Changed `type` from 'email' to 'magiclink'
    const { data: { session }, error } = await supabase.auth.verifyOtp({
        email: normalizedEmail,
        token: otp,
        type: 'magiclink', // This is the correct type for tokens from signInWithOtp
    });

    if (error) {
        console.error("Verify OTP error:", error);
        return { status: "error", message: error.message || "Invalid OTP or it has expired." };
    }

    if (!session) {
        return { status: "error", message: "Authentication failed. Could not create a session." };
    }
    
    if (isNewUser && name) {
        const user = session.user;
        const trimmedName = name.trim();

        const { error: updateAuthError } = await supabase.auth.updateUser({
            data: { full_name: trimmedName },
        });

        if (updateAuthError) {
            console.error("Error updating user name in auth.users:", updateAuthError);
        }

        // FIX 2: This `insert` will now work because you added the 'full_name' column.
        const { error: insertPublicUserError } = await supabase
            .from('users')
            .insert({
                id: user.id,
                email: user.email,
                full_name: trimmedName, 
            });

        if (insertPublicUserError) {
            console.error("Error inserting user into public.users:", insertPublicUserError.message);
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
  await supabase.auth.signOut();
  return redirect("/auth");
};