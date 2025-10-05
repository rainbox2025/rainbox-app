// /api/outlook/status/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return NextResponse.json({ isConnected: false, email: null }, { status: 401 });
  }

  // Check if we have Outlook tokens for this user in our database
  const { data: tokenData, error } = await supabase
    .from("outlook_tokens")
    .select("email, tokens")
    .eq("user_email", user.email)
    .single();

  if (error || !tokenData) {
    return NextResponse.json({ isConnected: false, email: null });
  }

  // Check if token is expired
  const now = Math.floor(Date.now() / 1000);
  if (tokenData.tokens.expires_in && now >= tokenData.tokens.expires_in) {
    // Token expired, but we still consider it connected since we can refresh
    // The senders API will handle refresh
  }

  return NextResponse.json({ isConnected: true, email: tokenData.email });
}