import { SupabaseUpsertResponse, UpsertedTag } from "@/types/data";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function PUT(request: Request) {
  const supabase = await createClient();

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { bookmarkId, newTags }: { bookmarkId: string; newTags: string[] } =
      await request.json();

    if (!bookmarkId) {
      return NextResponse.json(
        { error: "Bookmark ID is required" },
        { status: 400 }
      );
    }

    // Verify bookmark ownership
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

    // If newTags is empty, delete all tags
    if (!newTags?.length) {
      const { error: deleteError } = await supabase
        .from("bookmark_tags")
        .delete()
        .eq("bookmark_id", bookmarkId);

      if (deleteError) throw deleteError;

      return NextResponse.json({
        message: "Tags removed",
        tags: [],
      });
    }

    // First get existing tags that match the new tag names
    const { data: existingTags, error: existingTagsError } = await supabase
      .from("tags")
      .select("id, name")
      .eq("user_id", user.id)
      .in("name", newTags);

    if (existingTagsError) throw existingTagsError;

    // Find which tags need to be created
    const existingTagNames = existingTags?.map((tag) => tag.name) || [];
    const tagsToCreate = newTags.filter(
      (tag) => !existingTagNames.includes(tag)
    );

    // Create only new tags
    let allTags = [...(existingTags || [])];
    if (tagsToCreate.length > 0) {
      const { data: newTagsData, error: createError } = await supabase
        .from("tags")
        .insert(
          tagsToCreate.map((name) => ({
            user_id: user.id,
            name,
          }))
        )
        .select("id, name");

      if (createError) throw createError;
      allTags = [...allTags, ...(newTagsData || [])];
    }

    // Delete existing bookmark_tags
    await supabase.from("bookmark_tags").delete().eq("bookmark_id", bookmarkId);

    // Create bookmark_tags relationships
    const { error: relationError } = await supabase
      .from("bookmark_tags")
      .insert(
        allTags.map((tag) => ({
          bookmark_id: bookmarkId,
          tag_id: tag.id,
        }))
      );

    if (relationError) throw relationError;

    return NextResponse.json({
      message: "Tags updated successfully",
      tags: allTags,
    });
  } catch (error: any) {
    console.error("Tags update error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Add GET handler to fetch all tags
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

    // Get all tags with usage count
    const { data: tags, error: tagsError } = await supabase
      .from("tags")
      .select(
        `
        id,
        name,
        bookmark_tags (
          count
        )
      `
      )
      .eq("user_id", user.id)
      .order("name");

    if (tagsError) throw tagsError;

    // Transform data to include count
    const transformedTags = tags.map((tag) => ({
      id: tag.id,
      name: tag.name,
      count: tag.bookmark_tags.length,
    }));

    return NextResponse.json(transformedTags);
  } catch (error: any) {
    console.error("Fetch tags error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
