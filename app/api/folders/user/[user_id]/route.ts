import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export const GET = async (
  request: Request,
  context: { params: { user_id: string } }
) => {
  const { user_id } = await context.params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("folders")
    .select("*")
    .eq("user_id", user_id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const foldersWithSenders: any[] = [];

  await Promise.all(
    data.map(async (folder) => {
      const { data: sendersInFolder, error: sendersError } = await supabase
        .from("senders")
        .select("*")
        .eq("folder_id", folder.id);
      if (sendersError) {
        return NextResponse.json({ error: sendersError }, { status: 500 });
      }
      foldersWithSenders.push({
        ...folder,
        senders: sendersInFolder,
      });
    })
  );

  return NextResponse.json(foldersWithSenders);
};
