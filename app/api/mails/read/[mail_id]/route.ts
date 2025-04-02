import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export const PATCH = async (
  request: Request,
  { params }: { params: { mail_id: string } }
) => {
  const supabase = await createClient();
  const { mail_id } = await params;
  const { read } = await request.json();
  const mail = await supabase
    .from("mails")
    .select("*")
    .eq("id", mail_id)
    .single();
  if (!mail) {
    return NextResponse.json({ error: "Mail not found" }, { status: 404 });
  }
  const { data, error } = await supabase
    .from("mails")
    .update({
      read: read,
    })
    .eq("id", mail_id);
  // decrease the count of unread mails for the sender
  const sender = await supabase
    .from("senders")
    .select("count")
    .eq("id", mail.data.sender_id)
    .single();
  console.log("sender", sender);
  sender &&
    sender.data &&
    (await supabase
      .from("senders")
      .update({
        count: read ? sender.data.count + 1 : sender.data.count - 1,
      })
      .eq("id", mail.data.sender_id));
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
};
