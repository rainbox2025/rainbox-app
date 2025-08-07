import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { simpleParser } from "mailparser";

interface ChangeNotification {
  subscriptionId: string;
  clientState: string;
  changeType: string;
  resource: string;
  resourceData: {
    id: string;
    "@odata.type": string;
    "@odata.id": string;
  };
}

export async function POST(request: Request) {
  try {
    console.log("Webhook request received");

    const validationToken =
      request.headers.get("validationToken") ||
      new URL(request.url).searchParams.get("validationToken");

    if (validationToken) {
      return new Response(validationToken, {
        status: 200,
        headers: {
          "Content-Type": "text/plain",
          "Cache-Control": "no-cache",
        },
      });
    }

    const contentType = request.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      return new Response("Invalid content type", { status: 400 });
    }

    const data = await request.json();
    const supabase = await createClient();

    const notifications: ChangeNotification[] = Array.isArray(data.value)
      ? data.value
      : [data.value];

    for (const notification of notifications) {
      if (notification.changeType !== "created") continue;

      const { data: watchData } = await supabase
        .from("outlook_watch")
        .select("user_email, subscription_id, email")
        .eq("subscription_id", notification.subscriptionId)
        .single();

      if (!watchData) continue;

      const { data: tokenData } = await supabase
        .from("outlook_tokens")
        .select("tokens, updated_at")
        .eq("user_email", watchData.user_email)
        .single();

      if (!tokenData) continue;

      let { tokens } = tokenData;
      const tokenCreatedAt = new Date(tokenData.updated_at).getTime();
      const tokenExpiry = tokenCreatedAt + Number(tokens.expires_in) * 1000;
      let accessToken = tokens.access_token;

      if (Date.now() > tokenExpiry) {
        const refreshResponse = await fetch(
          "https://login.microsoftonline.com/common/oauth2/v2.0/token",
          {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              client_id: process.env.OUTLOOK_CLIENT_ID!,
              client_secret: process.env.OUTLOOK_CLIENT_SECRET!,
              refresh_token: tokens.refresh_token,
              grant_type: "refresh_token",
            }),
          }
        );
        const newTokens = await refreshResponse.json();
        await supabase
          .from("outlook_tokens")
          .update({ tokens: newTokens, updated_at: new Date().toISOString() })
          .eq("user_email", watchData.user_email);
        accessToken = newTokens.access_token;
      }

      // 📨 Step: Fetch full MIME content of the email
      const mimeResponse = await fetch(
        `https://graph.microsoft.com/v1.0/me/messages/${notification.resourceData.id}/$value`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Prefer: 'outlook.body-content-type="text"',
          },
        }
      );

      if (!mimeResponse.ok) {
        console.error(
          "Failed to fetch MIME message:",
          await mimeResponse.text()
        );
        continue;
      }

      const mimeBuffer = await mimeResponse.arrayBuffer();

      // 📬 Step: Parse the full email using mailparser
      const parsed = await simpleParser(Buffer.from(mimeBuffer));

      const { data: userData } = await supabase
        .from("users")
        .select("id")
        .eq("email", watchData.user_email)
        .single();

      if (!userData) continue;

      const { data: userSenders } = await supabase
        .from("senders")
        .select("id, email")
        .eq("mail_service", "outlook")
        .eq("user_id", userData.id);

      const senderEmail = parsed.from?.value?.[0]?.address || "";
      const sender = userSenders?.find((s) => s.email === senderEmail);

      if (!sender) continue;

      await supabase.from("mails").insert({
        user_id: userData.id,
        sender_id: sender.id,
        subject: parsed.subject || null,
        body: parsed.html || parsed.text || null,
        read: false,
        created_at: parsed.date || new Date().toISOString(),
      });

      console.log("Saved email from:", senderEmail);
    }

    return NextResponse.json({
      success: true,
      message: "Notifications processed with MIME parsing",
    });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed", details: error.message },
      { status: 500 }
    );
  }
}
