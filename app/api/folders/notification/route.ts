import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export const PATCH = async (
  request: Request,
) => {
  const supabase = await createClient();
  const body = await request.json();
  const { folder_id, notification } = body;
  const { data, error } = await supabase
    .from("folders")
    .update({ notification: notification })
    .eq("id", folder_id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
};
