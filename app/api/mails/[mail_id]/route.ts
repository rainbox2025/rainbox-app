import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export const DELETE = async (
  request: Request,
  { params }: { params: { mail_id: string } }
) => {
  const supabase = await createClient();
  const { mail_id } = await params;
  const { data, error } = await supabase
    .from("mails")
    .delete()
    .eq("id", mail_id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
};

export async function GET(
  request: Request,
  { params }: { params: { mail_id: string } }
) {
  const { mail_id } = params;
  const supabase = await createClient();

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (!mail_id) {
      return NextResponse.json({ error: "Mail ID is required" }, { status: 400 });
    }

    const { data: mail, error } = await supabase
      .from("mails")
      .select("*")
      .eq("id", mail_id)
      .eq("user_id", user.id) // Security: ensure user can only fetch their own mail
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // PostgREST error code for "exact one row not found"
        return NextResponse.json({ error: "Mail not found" }, { status: 404 });
      }
      throw error;
    }

    if (!mail) {
        return NextResponse.json({ error: "Mail not found" }, { status: 404 });
    }

    return NextResponse.json(mail);

  } catch (error: any) {
    console.error("GET MAIL BY ID ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}