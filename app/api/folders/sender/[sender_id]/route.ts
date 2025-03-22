import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export const POST = async (
  request: Request,
  { params }: { params: { sender_id: string } }
) => {
  const supabase = await createClient();
  const { sender_id } = await params;
  const { folder_id } = await request.json();
  console.log(folder_id);
  console.log(sender_id);
  const folder = await supabase
    .from("folders")
    .select("*")
    .eq("id", folder_id)
    .single();
  if (!folder) {
    return NextResponse.json({ error: "Folder not found" }, { status: 404 });
  }
  const sender = await supabase
    .from("senders")
    .select("*")
    .eq("id", sender_id)
    .single();
  if (!sender) {
    return NextResponse.json({ error: "Sender not found" }, { status: 404 });
  }
  const { data, error } = await supabase
    .from("senders")
    .update({ folder_id: folder_id })
    .eq("id", sender_id);
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
  const { sender_id } = await params;
  const { data, error } = await supabase
    .from("senders")
    .update({ folder_id: null })
    .eq("id", sender_id);
  return NextResponse.json(data);
};
