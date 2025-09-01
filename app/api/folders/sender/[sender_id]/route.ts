// api/folder/sender/[sender_id]/route.ts

import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export const POST = async (
  request: Request,
  { params }: { params: { sender_id: string } }
) => {
  const supabase = await createClient();
  const { sender_id } = params;
  const { folder_id } = await request.json();

  if (!folder_id) {
    return NextResponse.json({ error: "Folder ID is required" }, { status: 400 });
  }

  const { data: folder, error: folderError } = await supabase
    .from("folders")
    .select("id")
    .eq("id", folder_id)
    .single();

  if (folderError || !folder) {
    return NextResponse.json({ error: "Folder not found" }, { status: 404 });
  }

  const { error: updateError, data: updatedSender } = await supabase
    .from("senders")
    .update({ folder_id })
    .eq("id", sender_id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ sender: updatedSender });
};

export const PATCH = async (
  request: Request,
  { params }: { params: { sender_id: string } }
) => {
  const supabase = await createClient();
  const { sender_id } = params;
  const { name } = await request.json();
  const { data, error } = await supabase
    .from("senders")
    .update({ name: name })
    .eq("id", sender_id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
};

export const DELETE = async (
  request: Request,
  { params }: { params: { sender_id: string } }
) => {
  const supabase = await createClient();
  const { sender_id } = params;

  const { data, error } = await supabase
    .from("senders")
    .update({ folder_id: null })
    .eq("id", sender_id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ sender: data });
};