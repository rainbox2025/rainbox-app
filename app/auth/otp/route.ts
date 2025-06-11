import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { headers } from "next/headers";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    const origin = headers().get("origin");
    const supabase = await createClient();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
        // Set OTP expiry to 10 minutes
        data: {
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        },
      },
    });

    if (error) {
      console.error("OTP error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: error.status || 500 }
      );
    }

    return NextResponse.json({
      message: "Check your email for the login link",
    });
  } catch (error: any) {
    console.error("OTP request failed:", error);
    return NextResponse.json(
      { error: "Failed to process OTP request" },
      { status: 500 }
    );
  }
}
