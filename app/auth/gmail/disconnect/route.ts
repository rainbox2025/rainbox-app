// /api/auth/gmail/disconnect/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Delete the tokens from the database
  const { error } = await supabase
    .from("gmail_tokens")
    .delete()
    .eq("user_email", user.email);
    
  if (error) {
    console.error("Error deleting gmail tokens:", error);
    return NextResponse.json({ error: "Failed to disconnect" }, { status: 500 });
  }

  // Clear the cookie
  cookies().delete("consent_tokens");

  return NextResponse.json({ success: true, message: "Successfully disconnected." });
}