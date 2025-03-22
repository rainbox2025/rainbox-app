import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export const GET = async (
  request: Request,
  { params }: { params: { sender_id: string } }
) => {
  const { sender_id } = await params;
  const supabase = await createClient();
  const sender = await supabase
    .from("senders")
    .select("*")
    .eq("id", sender_id)
    .single();
  if (!sender) {
    return NextResponse.json({ error: "Sender not found" }, { status: 404 });
  }
  const { data, error } = await supabase
    .from("mails")
    .select("*")
    .eq("sender_id", sender_id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
};
