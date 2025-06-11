// /api/mails/user/[user_id]/route.ts

import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export const GET = async (
  request: Request,
  { params }: { params: { user_id: string } }
) => {
  const { user_id } = params;
  const supabase = await createClient();

  // Get query parameters for pagination
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const pageSize = parseInt(url.searchParams.get("pageSize") || "20");

  // Calculate range
  const start = (page - 1) * pageSize;
  const end = start + pageSize - 1;

  // First check if user exists
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id")
    .eq("id", user_id)
    .single();

  if (userError || !user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Get total count of mails for the user
  const { count: totalCount, error: countError } = await supabase
    .from("mails")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user_id);

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

  // Get the paginated mails for the user
  const { data, error } = await supabase
    .from("mails")
    .select("*")
    .eq("user_id", user_id)
    .order("created_at", { ascending: false })
    .range(start, end);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Return data with pagination info
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