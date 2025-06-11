import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { email, code } = await request.json();
    const supabase = await createClient();

    if (!email || !code) {
      return NextResponse.json(
        { error: "Email and code are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: "email",
    });

    if (error) {
      console.error("OTP verification error:", error);
      return NextResponse.json(
        {
          error: error.message,
          code: error.status,
        },
        { status: error.status || 401 }
      );
    }

    if (!data.user || !data.session) {
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      user: data.user,
      session: data.session,
    });
  } catch (error: any) {
    console.error("OTP authentication failed:", error);
    return NextResponse.json(
      { error: "Failed to authenticate OTP" },
      { status: 500 }
    );
  }
}
