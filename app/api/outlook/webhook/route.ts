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
  try {
    // Add debug logging for request
    console.log("Webhook request received:", {
      contentType: request.headers.get("content-type"),
      hasValidationToken: request.headers.has("validationToken"),
      url: request.url,
    });

    // Handle subscription validation
    const validationToken =
      request.headers.get("validationToken") ||
      new URL(request.url).searchParams.get("validationToken");

    if (validationToken) {
      console.log("Handling validation request with token:", validationToken);
      return new Response(validationToken, {
        status: 200,
        headers: {
          "Content-Type": "text/plain",
          "Cache-Control": "no-cache",
        },
      });
    }

    // Only proceed with notification processing for non-validation requests
    const contentType = request.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      console.log("Skipping non-JSON request:", contentType);
      return new Response("Invalid content type", { status: 400 });
    }

    const data = await request.json();

    // Add notification debug logging
    console.log("Processing notifications:", {
      notificationType: data.value?.[0]?.changeType,
      subscriptionId: data.value?.[0]?.subscriptionId,
      timestamp: new Date().toISOString(),
    });

    const supabase = await createClient();

    const notifications: ChangeNotification[] = Array.isArray(data.value)
      ? data.value
      : [data.value];

    for (const notification of notifications) {
      // Skip if not a 'created' event
      if (notification.changeType !== "created") {
        console.log(
          `Skipping notification of type: ${notification.changeType}`
        );
        continue;
      }

      // Verify subscription exists and get user info
      const { data: watchData, error: watchError } = await supabase
        .from("outlook_watch")
        .select("user_email, subscription_id, email")
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
        .eq("user_email", watchData.user_email)
        .single();

      if (tokenError || !tokenData) {
        console.error("No tokens found for user:", watchData.user_email);
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

      // Get user_id from auth.users table
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("email", watchData.user_email)
        .single();

      if (userError || !userData) {
        console.error("No user found for email:", watchData.user_email);
        continue;
      }

      // Check if sender is being tracked
      const { data: userSenders, error: sendersError } = await supabase
        .from("senders")
        .select("id, email")
        .eq("mail_service", "outlook")
        .eq("user_id", userData.id);

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

      // Log mail details before saving
      console.log("Attempting to save mail:", {
        user_id: userData.id, // Use fetched user_id
        sender_id: sender.id,
        sender_email: senderEmail,
        subject: message.subject,
        preview: message.bodyPreview?.substring(0, 50) + "...",
        received: message.receivedDateTime,
      });

      // Save the email
      const { error: mailError } = await supabase.from("mails").insert({
        user_id: userData.id, // Use fetched user_id
        sender_id: sender.id,
        subject: message.subject || null,
        body: message.bodyPreview || null,
        read: false,
        created_at: message.receivedDateTime,
      });

      if (mailError) {
        console.error("Error saving mail:", mailError);
      } else {
        console.log("Successfully saved mail from:", senderEmail);
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
