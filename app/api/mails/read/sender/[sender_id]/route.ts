import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { sender_id: string } }
) {
  const { sender_id } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("mails")
    .update({ read: true })
    .eq("sender_id", sender_id)
    .eq("read", false);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  await supabase.from("senders").update({ count: 0 }).eq("id", sender_id);
  return NextResponse.json({ data, error });
}
