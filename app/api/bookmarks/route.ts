import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const supabase = await createClient();

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Select all raw data from the database
    const { data, error } = await supabase
      .from("bookmarks")
      .select(`*, bookmark_tags(tags(*))`)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // --- FIX: Return the raw database objects directly ---
    // No transformation should happen here.
    return NextResponse.json(data);
    
  } catch (error: any) {
    console.error("GET BOOKMARKS ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
