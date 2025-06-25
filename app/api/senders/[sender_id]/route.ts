import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

async function handleImageUpload(
  supabase: any,
  sender_id: string,
  imageFile: File
) {
  const filename = `${sender_id}-${Date.now()}`;

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("sender-images")
    .upload(filename, imageFile, {
      contentType: imageFile.type,
      upsert: true,
    });

  if (uploadError) throw uploadError;

  const { data: publicUrlData } = supabase.storage
    .from("sender-images")
    .getPublicUrl(filename);

  return publicUrlData.publicUrl;
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
    // Authorization check remains the same
    const { data: senderData, error: senderError } = await supabase
      .from("senders")
      .select("user_id")
      .eq("id", sender_id)
      .single();

    if (senderError || senderData.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    
    // --- THIS IS THE FIX ---
    // Make the handler flexible for both FormData and JSON
    const contentType = request.headers.get("content-type") || "";
    const updateData: any = {};
    
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const name = formData.get("name");
      const subscribed = formData.get("subscribed");
      const notification = formData.get("notification");
      const folder_id = formData.get("folder_id");
      const image = formData.get("image") as File | null;

      if (name) updateData.name = name;
      if (subscribed !== null) updateData.subscribed = subscribed === "true";
      if (notification !== null) updateData.notification = notification === "true";
      if (folder_id) updateData.folder_id = folder_id;

      if (image && typeof image.size === "number") {
        updateData.image_url = await handleImageUpload(supabase, sender_id, image);
      } else if (image === null) {
        // ... (logic to remove image remains the same)
      }

    } else if (contentType.includes("application/json")) {
      const body = await request.json();
      // Only merge allowed fields from the JSON body
      if (body.hasOwnProperty('subscribed')) updateData.subscribed = body.subscribed;
      if (body.hasOwnProperty('notification')) updateData.notification = body.notification;
      if (body.hasOwnProperty('name')) updateData.name = body.name;
      if (body.hasOwnProperty('folder_id')) updateData.folder_id = body.folder_id;
    
    } else {
        return NextResponse.json({ error: "Unsupported Content-Type" }, { status: 415 });
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ message: "No fields to update" }, { status: 200 });
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
    // Ensure the error message from the try-catch is more informative
    const errorMessage = error.message.includes("Could not parse content as FormData")
      ? "Invalid request format. Expected FormData."
      : error.message;
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
};

// GET function remains the same
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