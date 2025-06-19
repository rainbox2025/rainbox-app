// /api/bookmarks/add/route.ts

import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

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

    // Prepare data for insertion (maps frontend camelCase to DB snake_case)
    const dataToInsert = {
      text: newBookmark.text,
      mail_id: newBookmark.mailId,
      serialized_range: JSON.stringify(newBookmark.serializedRange), // Stringify the object
    };

    const { data, error } = await supabase
      .from("bookmarks")
      .insert({
        ...dataToInsert,
        user_id: user.id,
        created_at: new Date().toISOString(),
      })
      // Select all raw data, including the joined tags, to match the GET route's structure
      .select(`*, bookmark_tags(tags(*))`)
      .single();

    if (error) throw error;
    
    // --- FIX: Return the raw database object directly ---
    // The frontend's mapApiBookmarkToLocal will handle all transformations.
    // This ensures consistency with the GET /api/bookmarks route.
    return NextResponse.json(data);

  } catch (error: any) {
    console.error("ADD BOOKMARK ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}