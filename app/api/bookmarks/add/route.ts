import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

// Add bookmark
export async function POST(request: Request) {
  const supabase = await createClient();

  try {
    const { newBookmark } = await request.json();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("bookmarks")
      .insert({
        ...newBookmark,
        user_id: user.id,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
