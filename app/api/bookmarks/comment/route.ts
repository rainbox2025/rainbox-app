import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function PUT(request: Request) {
  const supabase = await createClient();

  try {
    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get request body
    const { bookmarkId, commentText } = await request.json();

    if (!bookmarkId) {
      return NextResponse.json(
        { error: "Bookmark ID is required" },
        { status: 400 }
      );
    }

    // Normalize comment text - treat empty string, null, or undefined as null
    const normalizedComment = commentText?.trim() || null;

    // First verify the bookmark belongs to the user
    const { data: bookmark, error: bookmarkError } = await supabase
      .from("bookmarks")
      .select("id")
      .eq("id", bookmarkId)
      .eq("user_id", user.id)
      .single();

    if (bookmarkError || !bookmark) {
      return NextResponse.json(
        { error: "Bookmark not found or access denied" },
        { status: 404 }
      );
    }

    // Update the comment
    const { data, error: updateError } = await supabase
      .from("bookmarks")
      .update({
        comment: normalizedComment,
        updated_at: new Date().toISOString(),
      })
      .eq("id", bookmarkId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      message: normalizedComment ? "Comment updated" : "Comment removed",
      bookmark: data,
    });
  } catch (error: any) {
    console.error("Comment update error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
