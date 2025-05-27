import { google } from "googleapis";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { initOauthCLient } from "@/lib/oauth";
import { extractEmail } from "@/lib/gmail";

export async function POST(request: Request) {
  const supabase = await createClient();
  try {
    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get user's Gmail senders with IDs
    const { data: senders, error: sendersError } = await supabase
      .from("senders")
      .select("id, email")
      .eq("user_id", user.id)
      .eq("mail_service", "gmail")
      .eq("is_onboarded", false); // Only get non-onboarded senders

    if (sendersError || !senders) {
      return NextResponse.json(
        { error: "Failed to fetch senders" },
        { status: 500 }
      );
    }

    // Return early if no senders need processing
    if (senders.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No senders to onboard",
        processed: 0,
      });
    }

    const cookieStore = cookies();
    const tokensCookie = cookieStore.get("consent_tokens");

    if (!tokensCookie) {
      return NextResponse.json(
        { error: "No authentication tokens found" },
        { status: 401 }
      );
    }

    const tokens = JSON.parse(tokensCookie.value);
    const oauth2Client = initOauthCLient(
      process.env.CLIENT_ID,
      process.env.CLIENT_SECRET,
      process.env.REDIRECT_URI
    );
    oauth2Client.setCredentials(tokens);

    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    let processedEmails: any[] = [];
    let pageToken: string | undefined = undefined;

    // Create query to fetch emails only from tracked senders
    const senderQuery = senders.map((s) => `from:${s.email}`).join(" OR ");

    // Loop through all pages of results
    do {
      const messagesRes: any = await gmail.users.messages.list({
        userId: "me",
        maxResults: 100,
        pageToken: pageToken,
        q: senderQuery, // Only fetch emails from our senders
      });

      if (!messagesRes.data.messages) break;

      const emailsToInsert = await Promise.all(
        messagesRes.data.messages.map(async (message: any) => {
          const msg = await gmail.users.messages.get({
            userId: "me",
            id: message.id!,
            format: "full",
          });

          const headers = msg.data.payload?.headers || [];
          const from = headers.find((h) => h.name === "From")?.value || "";
          const subject = headers.find((h) => h.name === "Subject")?.value;
          const date = headers.find((h) => h.name === "Date")?.value;

          const senderEmail = extractEmail(from);
          if (!senderEmail) return null;

          const sender = senders.find((s) => s.email === senderEmail);
          if (!sender) return null;

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
            body = Buffer.from(msg.data.payload.body.data, "base64").toString();
          }

          return {
            user_id: user.id,
            sender_id: sender.id,
            subject: subject || null,
            body: body || null,
            read: !msg.data.labelIds?.includes("UNREAD"),
            created_at: date
              ? new Date(date).toISOString()
              : new Date().toISOString(),
          };
        })
      );

      // Add valid emails to our collection
      const validEmails = emailsToInsert.filter(Boolean);
      processedEmails = [...processedEmails, ...validEmails];

      // Get next page token
      pageToken = messagesRes.data.nextPageToken;

      // Add delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    } while (pageToken);

    // Insert all collected emails
    if (processedEmails.length > 0) {
      const { error: insertError } = await supabase
        .from("mails")
        .upsert(processedEmails, {
          onConflict: "sender_id,created_at",
          ignoreDuplicates: true,
        });

      if (insertError) {
        console.error("Error inserting emails:", insertError);
        return NextResponse.json(
          { error: "Failed to save emails" },
          { status: 500 }
        );
      }

      // Mark senders as onboarded
      const { error: updateError } = await supabase
        .from("senders")
        .update({ is_onboarded: true })
        .in(
          "id",
          senders.map((s) => s.id)
        );

      if (updateError) {
        console.error("Error updating sender status:", updateError);
      }
    }

    return NextResponse.json({
      success: true,
      processed: processedEmails.length,
      sendersOnboarded: senders.length,
      message: "Successfully onboarded senders",
    });
  } catch (error: any) {
    console.error("Error processing emails:", error);
    return NextResponse.json(
      { error: "Failed to process emails", details: error.message },
      { status: 500 }
    );
  }
}
