import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export const DELETE = async (
  request: Request,
  { params }: { params: { folder_id: string } }
) => {
  const supabase = await createClient();
  const { folder_id } = await params;
  console.log(folder_id);
  const { data: senders_in_folder } = await supabase
    .from("senders")
    .select("*")
    .eq("folder_id", folder_id);

  if (senders_in_folder && senders_in_folder.length > 0) {
    senders_in_folder.map(async () => {
      await supabase
        .from("senders")
        .update({ folder_id: null })
        .eq("folder_id", folder_id);
    });
  }
  const { data, error } = await supabase
    .from("folders")
    .delete()
    .eq("id", params.folder_id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
};
export const PATCH = async (
  request: Request,
  { params }: { params: { folder_id: string } }
) => {
  const supabase = await createClient();
  const { folder_id } = await params;
  const body = await request.json();
  const { name } = body;
  const { data, error } = await supabase
    .from("folders")
    .update({ name: name })
    .eq("id", folder_id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
};
