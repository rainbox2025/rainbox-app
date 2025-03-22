import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export const GET = async (
  request: Request,
  { params }: { params: { user_id: string } }
) => {
  const { user_id } = await params;
  const supabase = await createClient();
  const user = await supabase
    .from("users")
    .select("*")
    .eq("id", user_id)
    .single();
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  const { data, error } = await supabase
    .from("mails")
    .select("*")
    .eq("user_id", user_id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
};
