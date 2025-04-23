import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import admin from "@/lib/firebaseAdmin";

export const POST = async (req: Request) => {
  console.log("came post mail")
  const { user_id, sender_id, subject, body, fcmToken } = await req.json();
  console.log(user_id, sender_id, subject, body, fcmToken )
  const supabase = await createClient();

  const { data, error } = await supabase.from("mails").insert({
    user_id,
    sender_id,
    subject,
    body,
  });

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  // 🔔 Send Push Notification
  const message = {
    notification: {
      title: subject,
      body: body,
      image: "/RainboxLogo.png", // logo from public folder
    },
    webpush: {
      notification: {
        icon: "/RainboxLogo.png",
        click_action: "http://localhost:3000/dashboard",
      }
    },
    token: fcmToken,
  };

  try {
    await admin.messaging().send(message);
    return NextResponse.json({ message: "Mail created & notification sent" });
  } catch (err) {
    console.error("Notification error:", err);
    return NextResponse.json({ message: "Mail created, but notification failed" });
  }
};
