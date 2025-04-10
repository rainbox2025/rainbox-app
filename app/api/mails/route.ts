import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// Create new mail
export const POST = async (req: Request) => {
  const { user_id, sender_id, subject, body } = await req.json();
  const supabase = await createClient();

  const { data, error } = await supabase.from("mails").insert({
    user_id,
    sender_id,
    subject,
    body,
  });

  console.log("==========================userID; ", user_id);

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  // Send push notification
  try {
    const notificationResponse = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Basic os_v2_app_y24hhc2lgbferbqpxtqz26l4o5j42fpk6ykuahuspflvuzqax5vfjiayooz3hyb4jxsmjaxj4famvsoahmivkswb6dtjsf24eil5hgi",
      },
      body: JSON.stringify({
        app_id: "c6b8738b-4b30-4a48-860f-bce19d797c77",
        include_external_user_ids: [user_id], // Make sure this is a string
        headings: { en: "New Mail" },
        contents: { en: `New message: ${subject}` },
        url: "http://localhost:3000/dashboard",
        web_push_topic: "new_mail", // Add a topic for grouping similar notifications
        priority: 10, // High priority
      }),
    });
  
    const notificationResult = await notificationResponse.json();
    console.log("OneSignal notification result:", notificationResult);
  } catch (error) {
    console.error("Failed to send notification:", error);
    // Continue execution even if notification fails
  }

  return NextResponse.json({ message: "Mail created & notification sent" });
};

