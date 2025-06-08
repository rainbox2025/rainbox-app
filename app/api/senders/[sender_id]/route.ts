import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

async function handleImageUpload(
  supabase: any,
  sender_id: string,
  imageFile: File
) {
  const filename = `${sender_id}-${Date.now()}.${imageFile.type.split("/")[1]}`;

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("sender-images")
    .upload(filename, imageFile, {
      contentType: imageFile.type,
      upsert: true,
    });

  if (uploadError) throw uploadError;

  const { data: publicUrl } = supabase.storage
    .from("sender-images")
    .getPublicUrl(filename);

  return publicUrl.publicUrl;
}

export const PATCH = async (
  request: Request,
  { params }: { params: { sender_id: string } }
) => {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { sender_id } = params;

  try {
    const { data: senderData, error: senderError } = await supabase
      .from("senders")
      .select("user_id")
      .eq("id", sender_id)
      .single();

    if (senderError || senderData.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const formData = await request.formData();
    const updateData: any = {};

    const name = formData.get("name");
    const subscribed = formData.get("subscribed");
    const count = formData.get("count");
    const folder_id = formData.get("folder_id");
    const image = formData.get("image") as File | null;

    if (name) updateData.name = name;
    if (subscribed !== null) updateData.subscribed = subscribed === "true";
    if (count) updateData.count = parseInt(count as string);
    if (folder_id) updateData.folder_id = folder_id;

    if (image instanceof File) {
      updateData.image_url = await handleImageUpload(
        supabase,
        sender_id,
        image
      );
    } else if (image === null) {
      const { data: currentSender } = await supabase
        .from("senders")
        .select("image_url")
        .eq("id", sender_id)
        .single();

      if (currentSender?.image_url) {
        const oldImagePath = currentSender.image_url.split("/").pop();
        await supabase.storage.from("sender-images").remove([oldImagePath]);
      }
      updateData.image_url = null;
    }

    const { data, error } = await supabase
      .from("senders")
      .update(updateData)
      .eq("id", sender_id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Update error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
};

export const GET = async (
  request: Request,
  { params }: { params: { sender_id: string } }
) => {
  const supabase = await createClient();
  const { sender_id } = await params;

  const { data, error } = await supabase
    .from("senders")
    .select("count")
    .eq("id", sender_id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ count: data.count });
};
