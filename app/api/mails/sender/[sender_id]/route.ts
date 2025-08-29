import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export const GET = async (
  request: Request,
  { params }: { params: { sender_id: string } }
) => {
  const { sender_id } = params;
  const supabase = await createClient();

  // Auth check
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Get query parameters
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const pageSize = parseInt(url.searchParams.get("pageSize") || "20");

  // Calculate range
  const start = (page - 1) * pageSize;
  const end = start + pageSize - 1;

  // First check if sender exists and belongs to the user
  const { data: sender, error: senderError } = await supabase
    .from("senders")
    .select("*")
    .eq("id", sender_id)
    .eq("user_id", user.id)
    .single();

  if (senderError || !sender) {
    return NextResponse.json(
      { error: "Sender not found or not authorized" },
      { status: 404 }
    );
  }

  // Get total count first
  const { count: totalCount, error: countError } = await supabase
    .from("mails")
    .select("*", { count: "exact", head: true })
    .eq("sender_id", sender_id);

  if (countError) {
    return NextResponse.json({ error: countError.message }, { status: 500 });
  }

  // Validate page number
  const safeTotalCount = totalCount ?? 0;
  const totalPages = Math.ceil(safeTotalCount / pageSize);
  if (page > totalPages && safeTotalCount > 0) {
    return NextResponse.json(
      {
        error: `Page ${page} exceeds available range. Maximum page is ${totalPages}`,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount: safeTotalCount,
        },
      },
      { status: 400 }
    );
  }

  // Get paginated mails
 // Get paginated mails with sender details
const { data, error } = await supabase
  .from("mails")
  .select(
    `
      id,
      created_at,
      subject,
      body,
      read,
      bookmarked,
      is_public,
      sender_id,
      senders (
        name,
        domain,
        image_url
      )
    `
  )
  .eq("sender_id", sender_id)
  .order("created_at", { ascending: false })
  .range(start, end);


  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    data,
    pagination: {
      page,
      pageSize,
      totalCount,
      totalPages,
      hasMore: start + pageSize < (totalCount || 0),
    },
  });
};
