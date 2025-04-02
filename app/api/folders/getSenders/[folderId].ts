import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export const GET = async (
  request: Request,
  { params }: { params: { folderId: string } }
) => {
  const supabase = await createClient();
  const { folderId } = await params;
  const { data, error } = await supabase
    .from("senders")
    .select("*")
    .eq("folder_id", folderId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
};
