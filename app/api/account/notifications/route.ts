// app/api/account/notifications/route.ts

import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

// This is the corrected GET handler.
export async function GET(request: Request) {
  const supabase = await createClient();
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Fetch the global notification setting from the user's record
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("notification")
      .eq("id", user.id)
      .single();

    if (userError) throw userError;

    // Fetch all senders for that user to get their individual settings
    const { data: senders, error: sendersError } = await supabase
      .from("senders")
      .select("id, name, image_url, domain, notification")
      .eq("user_id", user.id);

    if (sendersError) throw sendersError;

    // Return the data in the format the frontend context expects
    return NextResponse.json({
      global_notification: userData.notification,
      senders: senders || [],
    });

  } catch (error: any) {
    console.error("Error fetching notification settings:", error);
    return NextResponse.json({ error: "Failed to fetch notification settings", details: error.message }, { status: 500 });
  }
}

// Your PUT handler is correct and does not need to be changed.
export async function PUT(request: Request) {
  const supabase = await createClient();
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { type, payload } = await request.json();

    if (type === 'global') {
      const { enabled } = payload;
      const { error } = await supabase
        .from("users")
        .update({ notification: enabled })
        .eq("id", user.id);
      
      if (error) throw error;
      
    } else if (type === 'sender') {
      const { senderId, enabled } = payload;
      const { error } = await supabase
        .from("senders")
        .update({ notification: enabled })
        .eq("id", senderId)
        .eq("user_id", user.id); 
      
      if (error) throw error;

    } else {
      return NextResponse.json({ error: "Invalid update type" }, { status: 400 });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Error updating notification settings:", error);
    return NextResponse.json({ error: "Failed to update notification settings", details: error.message }, { status: 500 });
  }
}