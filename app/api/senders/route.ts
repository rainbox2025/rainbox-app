import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
export const POST = async (req: Request) => {
  const { name, email, domain, user_id } = await req.json();
  const supabase = await createClient();
  const { data, error } = await supabase.from("senders").insert({
    name,
    email,
    domain,
    user_id,
  });
  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
  return NextResponse.json({ message: "Email sent successfully" });
};
