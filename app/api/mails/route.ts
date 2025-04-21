import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// Create new mail
export const POST = async (req: Request) => {
  const { user_id, sender_id, subject, body } = await req.json();
  const supabase = await createClient();

  const { data, error } = await supabase.from("mails").insert({
    user_id,
    sender_id,
    subject,
    body,
  });

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Mail created & notification sent" });
};

