import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export const PATCH = async (
  request: Request,
  { params }: { params: { mail_id: string } }
) => {
  const supabase = await createClient();
  const { mail_id } = await params;
  const { bookmark } = await request.json();
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
      bookmarked: bookmark,
    })
    .eq("id", mail_id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
};
