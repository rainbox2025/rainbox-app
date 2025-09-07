import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function requireAuth(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      user: null,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { user, supabase };
}

export async function checkPayment() {}
