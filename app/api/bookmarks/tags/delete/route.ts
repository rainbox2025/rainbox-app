import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function DELETE(request: Request) {
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
    const { tagId } = await request.json();

    if (!tagId) {
      return NextResponse.json(
        { error: "Tag ID is required" },
        { status: 400 }
      );
    }

    // First verify the tag belongs to the user
    const { data: tag, error: tagError } = await supabase
      .from("tags")
      .select("id")
      .eq("id", tagId)
      .eq("user_id", user.id)
      .single();

    if (tagError || !tag) {
      return NextResponse.json(
        { error: "Tag not found or access denied" },
        { status: 404 }
      );
    }

    // Delete the tag (bookmark_tags will be automatically deleted due to CASCADE)
    const { error: deleteError } = await supabase
      .from("tags")
      .delete()
      .eq("id", tagId)
      .eq("user_id", user.id);

    if (deleteError) throw deleteError;

    return NextResponse.json({
      message: "Tag deleted successfully",
    });
  } catch (error: any) {
    console.error("Delete tag error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
