import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export const POST = async (
  request: Request,
  { params }: { params: { sender_id: string } }
) => {
  const supabase = await createClient();
  const { sender_id } = await params;
  const { folder_id } = await request.json();

  const { data: folder, error: folderError } = await supabase
    .from("folders")
    .select("*")
    .eq("id", folder_id)
    .single();
  if (!folder || folderError) {
    return NextResponse.json({ error: "Folder not found" }, { status: 404 });
  }

  const { data: sender, error: senderError } = await supabase
    .from("senders")
    .select("*")
    .eq("id", sender_id)
    .single();
  if (!sender || senderError) {
    return NextResponse.json({ error: "Sender not found" }, { status: 404 });
  }

  // Update sender folder
  const { error: updateError } = await supabase
    .from("senders")
    .update({ folder_id })
    .eq("id", sender_id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Fetch and return the updated sender
  const { data: updatedSender, error: fetchError } = await supabase
    .from("senders")
    .select("*")
    .eq("id", sender_id)
    .single();
  
  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  return NextResponse.json({ sender: updatedSender });
};


export const PATCH = async (
  request: Request,
  { params }: { params: { sender_id: string } }
) => {
    
    const supabase = await createClient();
    const { sender_id } = await params;
    const {name} = await request.json();
    const { data, error } = await supabase
      .from("senders")
      .update({ name: name })
      .eq("id", sender_id)
      .select('*'); 
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
}

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
