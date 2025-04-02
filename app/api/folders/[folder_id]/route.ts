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
    await supabase
      .from("senders")
      .update({ folder_id: null })
      .eq("folder_id", folder_id);
  }
  const { data, error } = await supabase
    .from("folders")
    .delete()
    .eq("id", folder_id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
};

// Update name and count
export const PATCH = async (
  request: Request,
  { params }: { params: { folder_id: string } }
) => {
  const supabase = await createClient();
  const { folder_id } = await params;
  const { name, count } = await request.json();

  const updateData: any = {};
  if (name !== undefined) updateData.name = name;
  if (count !== undefined) updateData.count = count;

  const { data, error } = await supabase
    .from("folders")
    .update(updateData)
    .eq("id", folder_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
};

// Get count
export const GET = async (
  request: Request,
  { params }: { params: { folder_id: string } }
) => {
  const supabase = await createClient();
  const { folder_id } = await params;

  const { data, error } = await supabase
    .from("folders")
    .select("count")
    .eq("id", folder_id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ count: data.count });
};
