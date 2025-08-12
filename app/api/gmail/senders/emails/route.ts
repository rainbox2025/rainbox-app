import { google } from "googleapis";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { initOauthCLient } from "@/lib/oauth";
import { simpleParser } from "mailparser";

export const dynamic = "force-dynamic";

function chunkArray<T>(array: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(array.length / size) }, (_, i) =>
    array.slice(i * size, i * size + size)
  );
}

function generateMailImageUrl(domain: string): string {
  if (domain === "gmail.com") {
    return "/gmail.webp";
  }
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
}

export async function POST(request: Request) {
  const supabase = await createClient();

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      console.error("Supabase auth error:", authError.message);
      return NextResponse.json(
        { error: "Authentication failed", details: authError.message },
        { status: 401 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: "No authenticated user found" },
        { status: 401 }
      );
    }

    const { data: senders, error: sendersError } = await supabase
      .from("senders")
      .select("id, email, count")
      .eq("user_id", user.id)
      .eq("mail_service", "gmail")
      .eq("is_onboarded", false);

    if (sendersError) {
      console.error("Error fetching senders:", sendersError.message);
      return NextResponse.json(
        { error: "Failed to fetch senders" },
        { status: 500 }
      );
    }

    if (!senders || senders.length === 0) {
      return NextResponse.json(
        {
          success: true,
          message: "No new senders to process",
          processed: 0,
          sendersOnboarded: 0,
        },
        { status: 200 }
      );
    }

    const cookieStore = cookies();
    const tokensCookie = cookieStore.get("consent_tokens");

    if (!tokensCookie) {
      return NextResponse.json(
        { error: "No authentication tokens found" },
        { status: 401 }
      );
    }

    let tokens;
    try {
      tokens = JSON.parse(tokensCookie.value);
    } catch (err) {
      console.error("Invalid token cookie:", err);
      return NextResponse.json(
        { error: "Invalid token format" },
        { status: 400 }
      );
    }

    const oauth2Client = initOauthCLient(
      process.env.CLIENT_ID,
      process.env.CLIENT_SECRET,
      process.env.REDIRECT_URI
    );
    oauth2Client.setCredentials(tokens);

    const gmail = google.gmail({ version: "v1", auth: oauth2Client });
    let processedEmails: any[] = [];
    let pageToken: string | undefined = undefined;

    const senderQuery = senders.map((s) => `from:${s.email}`).join(" OR ");
    const senderEmailCount: Record<string, number> = {};

    do {
      const messagesRes: any = await gmail.users.messages.list({
        userId: "me",
        maxResults: 100,
        pageToken: pageToken,
        q: senderQuery,
      });

      if (!messagesRes.data.messages) break;

      const emailsToInsert = await Promise.all(
        messagesRes.data.messages.map(async (message: any) => {
          const msg = await gmail.users.messages.get({
            userId: "me",
            id: message.id!,
            format: "raw", // required for mailparser
          });

          if (!msg.data.raw) return null;

          const rawMime = Buffer.from(msg.data.raw!, "base64url").toString(
            "utf-8"
          );
          const parsed = await simpleParser(rawMime);

          const fromHeader = parsed.from?.value?.[0]?.address || null;
          const subject = parsed.subject || null;
          const date = parsed.date?.toISOString() || new Date().toISOString();
          const body = parsed.html || parsed.text || null;

          if (!fromHeader) return null;

          const sender = senders.find((s) => s.email === fromHeader);
          if (!sender) return null;

          senderEmailCount[sender.id] = (senderEmailCount[sender.id] || 0) + 1;

          return {
            user_id: user.id,
            sender_id: sender.id,
            subject,
            body,
            read: !msg.data.labelIds?.includes("UNREAD"),
            created_at: date,
          };
        })
      );

      const validEmails = emailsToInsert.filter(Boolean);
      processedEmails = [...processedEmails, ...validEmails];

      pageToken = messagesRes.data.nextPageToken;
      await new Promise((resolve) => setTimeout(resolve, 100));
    } while (pageToken);

    if (processedEmails.length > 0) {
      const batches = chunkArray(processedEmails, 50);

      for (const batch of batches) {
        const { error: insertError } = await supabase
          .from("mails")
          .upsert(batch);

        if (insertError) {
          console.error("Error inserting email batch:", insertError.message);
          return NextResponse.json(
            { error: "Failed to save emails" },
            { status: 500 }
          );
        }

        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      for (const [senderId, count] of Object.entries(senderEmailCount)) {
        // Get the sender to check if it already has an image_url
        const { data: sender, error: senderError } = await supabase
          .from("senders")
          .select("image_url, domain")
          .eq("id", senderId)
          .single();
    
        if (senderError) {
          console.error(`Error fetching sender ${senderId}:`, senderError.message);
          continue;
        }
    
        // Only update image_url if it doesn't exist
        if (!sender.image_url && sender.domain) {
          const mailImageUrl = generateMailImageUrl(sender.domain);
          
          const { error: imageUpdateError } = await supabase
            .from("senders")
            .update({ image_url: mailImageUrl })
            .eq("id", senderId);
    
          if (imageUpdateError) {
            console.error(`Error updating image_url for sender ${senderId}:`, imageUpdateError.message);
          }
        }
      }

      const { error: updateError } = await supabase
        .from("senders")
        .update({ is_onboarded: true })
        .in(
          "id",
          senders.map((s) => s.id)
        );

      if (updateError) {
        console.error(
          "Error updating sender onboarding status:",
          updateError.message
        );
      }
    }

    return NextResponse.json({
      success: true,
      processed: processedEmails.length,
      sendersOnboarded: senders.length,
      message: "Successfully processed all emails",
      pagesProcessed: pageToken ? undefined : "all",
    });
  } catch (error: any) {
    console.error("Unhandled error in POST /route:", error);
    return NextResponse.json(
      { error: "Failed to process emails", details: error.message },
      { status: 500 }
    );
  }
}
