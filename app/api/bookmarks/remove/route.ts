import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

// Delete bookmark
export async function DELETE(request: Request) {
  const supabase = await createClient();

  try {
    const { bookmarkId } = await request.json();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    console.log(bookmarkId);

    const { error } = await supabase
      .from("bookmarks")
      .delete()
      .eq("id", bookmarkId)
      .eq("user_id", user.id);

    if (error) throw error;

    return NextResponse.json({ message: "Bookmark deleted successfully" });
  } catch (error: any) {
    console.log(error);

    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
