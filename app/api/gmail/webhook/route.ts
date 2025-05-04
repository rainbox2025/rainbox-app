import { google } from "googleapis";
import { NextResponse } from "next/server";
import { initOauthCLient } from "@/lib/oauth";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  try {
    const data = await request.json();
    const { message } = data;

    // Decode the message data from Pub/Sub
    const decodedData = JSON.parse(
      Buffer.from(message.data, "base64").toString()
    );

    const { emailAddress, historyId } = decodedData;

    // Fetch tokens and last history ID
    const { data: watchData } = await supabase
      .from("gmail_watch")
      .select("history_id")
      .eq("email", emailAddress)
      .single();

    const { data: tokenData } = await supabase
      .from("gmail_tokens")
      .select("tokens")
      .eq("email", emailAddress)
      .single();

    if (!tokenData) {
      throw new Error("No tokens found for this email");
    }

    const oauth2Client = initOauthCLient(
      process.env.CLIENT_ID,
      process.env.CLIENT_SECRET,
      process.env.REDIRECT_URI
    );
    oauth2Client.setCredentials(tokenData.tokens);

    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    // Get history of changes since last check
    const history = await gmail.users.history.list({
      userId: "me",
      startHistoryId: watchData?.history_id || historyId,
    });

    // Process new messages
    const newMessages = [];
    for (const record of history.data.history || []) {
      for (const message of record.messagesAdded || []) {
        if (!message.message?.id) continue;

        const msg = await gmail.users.messages.get({
          userId: "me",
          id: message.message.id,
          format: "full", // Change format to "full" to get the complete message
        });

        const headers = msg.data.payload?.headers || [];
        let body = "";

        // Extract body based on MIME type
        if (msg.data.payload?.parts) {
          // Multipart message
          const textPart = msg.data.payload.parts.find(
            (part) => part.mimeType === "text/plain"
          );
          if (textPart?.body?.data) {
            body = Buffer.from(textPart.body.data, "base64").toString();
          }
        } else if (msg.data.payload?.body?.data) {
          // Simple message
          body = Buffer.from(msg.data.payload.body.data, "base64").toString();
        }

        newMessages.push({
          id: msg.data.id,
          threadId: msg.data.threadId,
          from: headers.find((h) => h.name === "From")?.value,
          subject: headers.find((h) => h.name === "Subject")?.value,
          date: headers.find((h) => h.name === "Date")?.value,
          body: body, // Add the email body to the response
        });
      }
    }

    // Update the history ID
    if (history.data.historyId) {
      await supabase
        .from("gmail_watch")
        .update({
          history_id: history.data.historyId,
          updated_at: new Date().toISOString(),
        })
        .eq("email", emailAddress);
    }
    console.log(newMessages);

    return NextResponse.json({
      success: true,
      messages: newMessages,
    });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed", details: error.message },
      { status: 500 }
    );
  }
}
