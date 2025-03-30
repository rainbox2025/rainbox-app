import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export const PATCH = async (
  request: Request,
  { params }: { params: { senderId: string } }
) => {
  const supabase = await createClient();
  const { senderId } = await params;
  const { name, subscribed } = await request.json();
  const sender = await supabase
    .from("senders")
    .select("*")
    .eq("id", senderId)
    .single();
    
  if (!sender) {
    return NextResponse.json({ error: "Sender not found" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("senders")
    .update({ name: name, subscribed: subscribed })
    .eq("id", senderId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
};
