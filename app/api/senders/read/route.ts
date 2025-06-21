// in your /api/senders/read/route.ts file

import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export const PATCH = async (request: Request) => {
  const supabase = await createClient();

  try {
    const { sender_id } = await request.json();

    if (!sender_id) {
      return NextResponse.json({ error: "sender_id is required" }, { status: 400 });
    }

    // 1. Fetch the current state of the sender
    const { data: currentSender, error: fetchError } = await supabase
      .from("senders")
      .select("isRead")
      .eq("id", sender_id)
      .single(); // .single() is crucial here

    if (fetchError) {
      console.error("Error fetching sender:", fetchError.message);
      return NextResponse.json({ error: "Sender not found." }, { status: 404 });
    }

    // 2. Determine the new state and what to update
    const newIsReadStatus = !currentSender.isRead;
    const updatePayload = {
      isRead: newIsReadStatus,
      count: 0, // Also reset the unread count when marking as read
    };

    // 3. Perform the update AND return the updated record using .select()
    const { data: updatedSender, error: updateError } = await supabase
      .from("senders")
      .update(updatePayload)
      .eq("id", sender_id)
      .select() // <-- This tells Supabase to return the updated record
      .single(); // <-- Return it as a single object, not an array

    if (updateError) {
      console.error("Error updating sender:", updateError.message);
      return NextResponse.json({ error: "Failed to update sender." }, { status: 500 });
    }

    // 4. Return the complete, updated sender object to the frontend
    return NextResponse.json(updatedSender);

  } catch (e) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
};