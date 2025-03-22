import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export const PATCH = async (
  request: Request,
  { params }: { params: { folder_id: string } }
) => {
  const supabase = await createClient();
  const { folder_id } = await params;
  const { newOrder } = await request.json();

  const { data: folder, error: folderError } = await supabase
    .from("folders")
    .select("*")
    .eq("id", folder_id)
    .single();

  if (!folder) {
    return NextResponse.json({ error: "Folder not found" }, { status: 404 });
  }

  const { data: allFolders, error: allFoldersError } = await supabase
    .from("folders")
    .select("*")
    .eq("user_id", folder.user_id)
    .order("order", { ascending: true });

  if (allFoldersError) {
    return NextResponse.json(
      { error: allFoldersError.message },
      { status: 500 }
    );
  }

  const oldOrder = folder.order;
  const updatedFolders = [];

  if (oldOrder === newOrder) {
    return NextResponse.json(folder);
  }

  const otherFolders = allFolders.filter((f) => f.id !== folder_id);

  let normalizedFolders = [];
  if (newOrder <= 1) {
    normalizedFolders = [folder, ...otherFolders];
  } else if (newOrder >= otherFolders.length + 1) {
    normalizedFolders = [...otherFolders, folder];
  } else {
    normalizedFolders = [
      ...otherFolders.slice(0, newOrder - 1),
      folder,
      ...otherFolders.slice(newOrder - 1),
    ];
  }

  for (let i = 0; i < normalizedFolders.length; i++) {
    updatedFolders.push({
      id: normalizedFolders[i].id,
      order: i + 1,
      user_id: normalizedFolders[i].user_id,
      name: normalizedFolders[i].name,
    });
  }

  const { data, error } = await supabase
    .from("folders")
    .upsert(updatedFolders, { onConflict: "id" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, updatedFolders });
};
