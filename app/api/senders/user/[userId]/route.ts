// api/senders/user/userid/route.ts
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

// get all senders for a specific user that are not in a folder
export const GET = async (
  request: Request,
  context: { params: { userId: string } }
) => {
  const { userId } = await context.params;
  console.log("User ID:", userId);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("senders")
    .select("*")
    .eq("user_id", userId)
    .is("folder_id", null)
    .eq("subscribed", true);

  if (error) {
    console.error("Error fetching data:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  console.log("Data fetched:", data);
  return NextResponse.json(data);
};
