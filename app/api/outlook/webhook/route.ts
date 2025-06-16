import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

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
  const supabase = await createClient();
  try {
    // Validate webhook
    const validationToken = request.headers.get("validationToken");
    if (validationToken) {
      return new Response(validationToken, { status: 200 });
    }

    const data = await request.json();
    const notifications: ChangeNotification[] = Array.isArray(data.value)
      ? data.value
      : [data.value];

    for (const notification of notifications) {
      // Verify subscription exists and get user info
      const { data: watchData, error: watchError } = await supabase
        .from("outlook_watch")
        .select("user_id, subscription_id")
        .eq("subscription_id", notification.subscriptionId)
        .single();

      if (watchError || !watchData) {
        console.error(
          "No watch record found for subscription:",
          notification.subscriptionId
        );
        continue;
      }

      // Get tokens for the user
      const { data: tokenData, error: tokenError } = await supabase
        .from("outlook_tokens")
        .select("tokens")
        .eq("user_id", watchData.user_id)
        .single();

      if (tokenError || !tokenData) {
        console.error("No tokens found for user:", watchData.user_id);
        continue;
      }

      // Fetch message details
      const messageId = notification.resourceData.id;
      const messageResponse = await fetch(
        `https://graph.microsoft.com/v1.0/me/messages/${messageId}?$select=id,subject,bodyPreview,receivedDateTime,from`,
        {
          headers: {
            Authorization: `Bearer ${tokenData.tokens.access_token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!messageResponse.ok) {
        console.error("Failed to fetch message:", await messageResponse.text());
        continue;
      }

      const message = await messageResponse.json();

      // Check if sender is being tracked
      const { data: userSenders, error: sendersError } = await supabase
        .from("senders")
        .select("id, email")
        .eq("mail_service", "outlook")
        .eq("user_id", watchData.user_id);

      if (sendersError || !userSenders) {
        console.error("Error fetching senders:", sendersError);
        continue;
      }

      const senderEmail = message.from.emailAddress.address;
      const sender = userSenders.find((s) => s.email === senderEmail);

      // Skip if sender is not tracked
      if (!sender) {
        console.log(`Skipping email: Sender ${senderEmail} not tracked`);
        continue;
      }

      // Save the email
      const { error: mailError } = await supabase.from("mails").insert({
        user_id: watchData.user_id,
        sender_id: sender.id,
        subject: message.subject || null,
        body: message.bodyPreview || null,
        read: false,
        created_at: message.receivedDateTime,
      });

      if (mailError) {
        console.error("Error saving mail:", mailError);
        continue;
      }
    }

    return NextResponse.json({
      success: true,
      message: "Notifications processed successfully",
    });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed", details: error.message },
      { status: 500 }
    );
  }
}
