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

    // 1. Fetch the current state of the sender to determine the toggle direction
    const { data: currentSender, error: fetchError } = await supabase
      .from("senders")
      .select("isRead")
      .eq("id", sender_id)
      .single();

    if (fetchError || !currentSender) {
      console.error("Error fetching sender:", fetchError?.message);
      return NextResponse.json({ error: "Sender not found." }, { status: 404 });
    }

    // 2. Determine the new state for both sender and its mails
    const newIsReadStatus = !currentSender.isRead; // This will be `true` or `false`

    // 3. Update all associated mails in the 'mails' table to the new status
    // This is the key step you were missing.
    const { error: mailsUpdateError } = await supabase
      .from("mails")
      .update({ read: newIsReadStatus }) // Set 'read' to true OR false
      .eq("sender_id", sender_id);

    if (mailsUpdateError) {
      console.error("Error updating mails:", mailsUpdateError.message);
      return NextResponse.json({ error: "Failed to update associated mails." }, { status: 500 });
    }

    // 4. Prepare the update for the 'senders' table with the correct unread count
    let senderUpdatePayload;

    if (newIsReadStatus === true) {
      // If we marked everything as READ, the unread count is 0.
      senderUpdatePayload = {
        isRead: true,
        count: 0,
      };
    } else {
      // If we marked everything as UNREAD, the unread count is the TOTAL count of mails.
      // We need to get that total count.
      const { count: totalMailCount, error: countError } = await supabase
        .from("mails")
        .select('*', { count: 'exact', head: true }) // Efficiently get count
        .eq("sender_id", sender_id);

      if (countError) {
        console.error("Error counting total mails:", countError.message);
        // Note: At this point, the mails are updated but the sender count might be wrong.
        // For production, you might use a database transaction (RPC function) to make this atomic.
        return NextResponse.json({ error: "Failed to count mails for sender update." }, { status: 500 });
      }
      
      senderUpdatePayload = {
        isRead: false,
        count: totalMailCount ?? 0, // All mails are now considered "unread"
      };
    }

    // 5. Perform the final update on the sender and return the updated record
    const { data: updatedSender, error: senderUpdateError } = await supabase
      .from("senders")
      .update(senderUpdatePayload)
      .eq("id", sender_id)
      .select() // Return the complete, updated record
      .single();

    if (senderUpdateError) {
      console.error("Error updating sender:", senderUpdateError.message);
      return NextResponse.json({ error: "Failed to update sender." }, { status: 500 });
    }

    // 6. Return the complete, updated sender object to the frontend
    return NextResponse.json(updatedSender);

  } catch (e) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
};