import { google } from "googleapis";
import { NextResponse } from "next/server";
import { initOauthCLient } from "@/lib/oauth";
import { createClient } from "@/utils/supabase/server";
import { extractEmail } from "@/lib/gmail";
import { simpleParser } from "mailparser";

export async function POST(request: Request) {
  const supabase = await createClient();
  try {
    const data = await request.json();
    const { message } = data;

    console.log("Received webhook message:", message);

    const decodedData = JSON.parse(
      Buffer.from(message.data, "base64").toString()
    );
    console.log("Decoded Pub/Sub data:", decodedData);

    const { emailAddress, historyId } = decodedData;

    const { data: watchRecords, error: watchError } = await supabase
      .from("gmail_watch")
      .select("history_id, user_id")
      .eq("email", emailAddress);

    if (watchError || !watchRecords || watchRecords.length === 0) {
      console.error(
        "No watch records found for this email:",
        emailAddress,
        watchError
      );
      throw new Error("No watch records found for this email");
    }

    console.log(
      `Found ${watchRecords.length} watch records for email: ${emailAddress}`
    );

    const { data: tokenRows, error: tokenError } = await supabase
      .from("gmail_tokens")
      .select("tokens")
      .eq("email", emailAddress);

    if (tokenError || !tokenRows || tokenRows.length === 0) {
      console.error(
        "No tokens found for this email:",
        emailAddress,
        tokenError
      );
      throw new Error("No tokens found for this email");
    }

    const tokenData = tokenRows.reduce((latest, row) => {
      if (
        row.tokens.expiry_date &&
        (!latest.tokens.expiry_date ||
          row.tokens.expiry_date > latest.tokens.expiry_date)
      ) {
        return row;
      }
      return latest;
    }, tokenRows[0]);

    if (!tokenData) {
      console.error("No valid tokens found for this email:", emailAddress);
      throw new Error("No valid tokens found for this email");
    }

    console.log("Using token with expiry:", tokenData.tokens.expiry_date);

    const oauth2Client = initOauthCLient(
      process.env.CLIENT_ID,
      process.env.CLIENT_SECRET,
      process.env.REDIRECT_URI
    );
    oauth2Client.setCredentials(tokenData.tokens);

    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    const results = await Promise.all(
      watchRecords.map(async (watchRecord) => {
        try {
          console.log(
            `Processing user_id: ${watchRecord.user_id}, history_id: ${watchRecord.history_id}`
          );

          const history = await gmail.users.history.list({
            userId: "me",
            startHistoryId: watchRecord.history_id || historyId,
          });

          if (!history.data.history) {
            console.log(`No history found for user_id: ${watchRecord.user_id}`);
            return {
              user_id: watchRecord.user_id,
              processed: 0,
              messages: [],
            };
          }

          const { data: userSenders, error: sendersError } = await supabase
            .from("senders")
            .select("id, email, user_id")
            .eq("mail_service", "gmail")
            .eq("user_id", watchRecord.user_id);

          if (sendersError) {
            console.error(
              "Error fetching senders for user:",
              watchRecord.user_id,
              sendersError
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
                format: "raw",
              });

              const rawMime = Buffer.from(
                msg.data.raw!,
                "base64url"
              ).toString("utf-8");

              const parsed = await simpleParser(rawMime);

              const subject = parsed.subject || null;
              const date =
                parsed.date?.toISOString() || new Date().toISOString();
              const body = parsed.html || parsed.text || null;

              const senderEmail = extractEmail(parsed.from?.text || "");
              const sender = userSenders?.find(
                (s) => s.email === senderEmail
              );

              if (!sender) {
                console.log(
                  `Skipping email for user ${watchRecord.user_id}: Sender ${senderEmail} not tracked`
                );
                continue;
              }

              const { error: mailError } = await supabase.from("mails").insert({
                user_id: watchRecord.user_id,
                sender_id: sender.id,
                subject,
                body,
                read: false,
                created_at: date,
              });

              if (mailError) {
                console.error(
                  `Error saving mail for user ${watchRecord.user_id}:`,
                  mailError
                );
                continue;
              }

              console.log(`Saved mail for user ${watchRecord.user_id}:`, {
                id: msg.data.id,
                threadId: msg.data.threadId,
                from: parsed.from?.text,
                subject,
                date,
                sender_id: sender.id,
              });

              newMessages.push({
                id: msg.data.id,
                threadId: msg.data.threadId,
                from: parsed.from?.text,
                subject,
                date,
                sender_id: sender.id,
              });
            }
          }

          if (history.data.historyId) {
            await supabase
              .from("gmail_watch")
              .update({
                history_id: history.data.historyId,
                updated_at: new Date().toISOString(),
              })
              .eq("email", emailAddress)
              .eq("user_id", watchRecord.user_id);

            console.log(
              `Updated history_id for user ${watchRecord.user_id} to ${history.data.historyId}`
            );
          }

          return {
            user_id: watchRecord.user_id,
            processed: newMessages.length,
            messages: newMessages,
          };
        } catch (error: any) {
          console.error(`Error processing user ${watchRecord.user_id}:`, error);
          return {
            user_id: watchRecord.user_id,
            error: error.message,
          };
        }
      })
    );

    console.log("Webhook processing complete. Results:", results);

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
