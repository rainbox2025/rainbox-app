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

    const serializedRangeString = JSON.stringify(newBookmark.serializedRange);

    // First, check if an identical bookmark already exists to prevent duplicates.
    const { data: existingBookmark, error: checkError } = await supabase
      .from("bookmarks")
      .select(`*, bookmark_tags(tags(*))`)
      .eq("user_id", user.id)
      .eq("mail_id", newBookmark.mailId)
      .eq("serialized_range", serializedRangeString)
      .maybeSingle();

    if (checkError) {
      console.error("Error checking for existing bookmark:", checkError.message);
      // We can still proceed, but this indicates a potential issue.
    }

    if (existingBookmark) {
      // If a duplicate is found, return the existing one.
      return NextResponse.json(existingBookmark);
    }
    
    // If no duplicate exists, insert the new bookmark.
    const dataToInsert = {
      text: newBookmark.text,
      mail_id: newBookmark.mailId,
      serialized_range: serializedRangeString,
      user_id: user.id,
    };

    const { data, error } = await supabase
      .from("bookmarks")
      .insert(dataToInsert)
      .select(`*, bookmark_tags(tags(*))`)
      .single();

    if (error) throw error;
    
    // Return the newly created bookmark data.
    return NextResponse.json(data);

  } catch (error: any) {
    console.error("ADD BOOKMARK ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}