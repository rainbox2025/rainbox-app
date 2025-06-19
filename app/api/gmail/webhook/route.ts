import { google } from "googleapis";
import { NextResponse } from "next/server";
import { initOauthCLient } from "@/lib/oauth";
import { createClient } from "@/utils/supabase/server";
import { extractEmail } from "@/lib/gmail";

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

    // Get all watch records for this email
    const { data: watchRecords, error: watchError } = await supabase
      .from("gmail_watch")
      .select("history_id, user_id")
      .eq("email", emailAddress);

    if (watchError || !watchRecords || watchRecords.length === 0) {
      throw new Error("No watch records found for this email");
    }

    // Then get the tokens for this email
    const { data: tokenData, error: tokenError } = await supabase
      .from("gmail_tokens")
      .select("tokens")
      .eq("email", emailAddress)
      .single();

    if (tokenError || !tokenData) {
      throw new Error("No tokens found for this email");
    }

    const oauth2Client = initOauthCLient(
      process.env.CLIENT_ID,
      process.env.CLIENT_SECRET,
      process.env.REDIRECT_URI
    );
    oauth2Client.setCredentials(tokenData.tokens);

    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    // Process for each watch record
    const results = await Promise.all(
      watchRecords.map(async (watchRecord) => {
        try {
          const history = await gmail.users.history.list({
            userId: "me",
            startHistoryId: watchRecord.history_id || historyId,
          });

          const { data: userSenders, error: sendersError } = await supabase
            .from("senders")
            .select("id, email, user_id")
            .eq("mail_service", "gmail")
            .eq("user_id", watchRecord.user_id);

          if (sendersError) {
            console.error(
              "Error fetching senders for user:",
              watchRecord.user_id
            );
            return {
              user_id: watchRecord.user_id,
              error: "Failed to fetch senders",
            };
          }

          const newMessages = [];
          for (const record of history.data.history || []) {
            for (const message of record.messagesAdded || []) {
              if (!message.message?.id) continue;

              const msg = await gmail.users.messages.get({
                userId: "me",
                id: message.message.id,
                format: "full",
              });

              const headers = msg.data.payload?.headers || [];
              const from = headers.find((h) => h.name === "From")?.value || "";
              const subject = headers.find((h) => h.name === "Subject")?.value;
              const date = headers.find((h) => h.name === "Date")?.value;

              const senderEmail = extractEmail(from);
              const sender = userSenders?.find((s) => s.email === senderEmail);

              if (!sender) {
                console.log(
                  `Skipping email for user ${watchRecord.user_id}: Sender ${senderEmail} not tracked`
                );
                continue;
              }

              // Extract body
              let body = "";
              if (msg.data.payload?.parts) {
                const textPart = msg.data.payload.parts.find(
                  (part) => part.mimeType === "text/plain"
                );
                if (textPart?.body?.data) {
                  body = Buffer.from(textPart.body.data, "base64").toString();
                }
              } else if (msg.data.payload?.body?.data) {
                body = Buffer.from(
                  msg.data.payload.body.data,
                  "base64"
                ).toString();
              }

              // Save the email for this specific user
              const { error: mailError } = await supabase.from("mails").insert({
                user_id: watchRecord.user_id,
                sender_id: sender.id,
                subject: subject || null,
                body: body || null,
                read: false,
                created_at: date
                  ? new Date(date).toISOString()
                  : new Date().toISOString(),
              });

              if (mailError) {
                console.error(
                  `Error saving mail for user ${watchRecord.user_id}:`,
                  mailError
                );
                continue;
              }

              newMessages.push({
                id: msg.data.id,
                threadId: msg.data.threadId,
                from,
                subject,
                date,
                sender_id: sender.id,
              });
            }
          }

          // Update history ID for this watch record
          if (history.data.historyId) {
            await supabase
              .from("gmail_watch")
              .update({
                history_id: history.data.historyId,
                updated_at: new Date().toISOString(),
              })
              .eq("email", emailAddress)
              .eq("user_id", watchRecord.user_id);
          }

          return {
            user_id: watchRecord.user_id,
            processed: newMessages.length,
            messages: newMessages,
          };
        } catch (error: any) {
          return {
            user_id: watchRecord.user_id,
            error: error.message,
          };
        }
      })
    );

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed", details: error.message },
      { status: 500 }
    );
  }
}
