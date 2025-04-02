import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

// Update name, subscribed and count
export const PATCH = async (
  request: Request,
  { params }: { params: { sender_id: string } }
) => {
  const supabase = await createClient();
  const { sender_id } = await params;
  const { name, subscribed, count } = await request.json();

  const updateData: any = {};
  if (name !== undefined) updateData.name = name;
  if (subscribed !== undefined) updateData.subscribed = subscribed;
  if (count !== undefined) updateData.count = count; 

  const { data, error } = await supabase
    .from("senders")
    .update(updateData)
    .eq("id", sender_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
};

// Get count
export const GET = async (
  request: Request,
  { params }: { params: { sender_id: string } }
) => {
  const supabase = await createClient();
  const { sender_id } = await params;

  const { data, error } = await supabase
    .from("senders")
    .select("count")
    .eq("id", sender_id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ count: data.count });
};