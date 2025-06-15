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
    const { tagId, newTag } = await request.json();

    if (!tagId || !newTag?.trim()) {
      return NextResponse.json(
        { error: "Tag ID and new tag name are required" },
        { status: 400 }
      );
    }

    // Check if tag exists and belongs to user
    const { data: existingTag, error: tagError } = await supabase
      .from("tags")
      .select("id")
      .eq("id", tagId)
      .eq("user_id", user.id)
      .single();

    if (tagError || !existingTag) {
      return NextResponse.json(
        { error: "Tag not found or access denied" },
        { status: 404 }
      );
    }

    // Check if new tag name already exists for this user
    const { data: duplicateTag, error: duplicateError } = await supabase
      .from("tags")
      .select("id")
      .eq("user_id", user.id)
      .eq("name", newTag.trim())
      .not("id", "eq", tagId)
      .single();

    if (duplicateTag) {
      return NextResponse.json(
        { error: "Tag name already exists" },
        { status: 409 }
      );
    }

    // Update tag name
    const { data: updatedTag, error: updateError } = await supabase
      .from("tags")
      .update({
        name: newTag.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", tagId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({
      message: "Tag renamed successfully",
      tag: updatedTag,
    });
  } catch (error: any) {
    console.error("Tag rename error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
