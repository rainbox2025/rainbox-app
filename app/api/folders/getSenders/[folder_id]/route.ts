import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { folder_id: string } }
) {
  console.log("came here");

  const supabase = await createClient(); 
  const { folder_id } = await params;

  console.log("folder_id:", folder_id);

  const { data, error } = await supabase
    .from("senders")
    .select("*")
    .eq("folder_id", folder_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  console.log(data);
  return NextResponse.json(data);
}
