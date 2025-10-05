// /api/auth/gmail/status/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return NextResponse.json({ isConnected: false, email: null }, { status: 401 });
  }

  // Check if we have tokens for this user in our database
  const { data: tokenData, error } = await supabase
    .from("gmail_tokens")
    .select("email, tokens")
    .eq("user_email", user.email)
    .single();

  if (error || !tokenData) {
    return NextResponse.json({ isConnected: false, email: null });
  }

  // Check if token is expired
  const now = Date.now();
  if (tokenData.tokens.expiry_date && now >= tokenData.tokens.expiry_date) {
    // Token expired, but we still consider it connected since we can refresh
    // The senders API will handle refresh
  }

  return NextResponse.json({ isConnected: true, email: tokenData.email });
}