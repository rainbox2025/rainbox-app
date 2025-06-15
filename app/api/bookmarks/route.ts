import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

// Get all bookmarks
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

    const { data, error } = await supabase
      .from("bookmarks")
      .select(
        `
        *,
        bookmark_tags (
          tags (
            id,
            name
          )
        )
      `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Transform the response to flatten the tags array
    const transformedData = data.map((bookmark) => ({
      ...bookmark,
      tags: bookmark.bookmark_tags.map((bt: any) => bt.tags),
    }));

    return NextResponse.json(transformedData);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
