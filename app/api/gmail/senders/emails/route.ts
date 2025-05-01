import { google } from "googleapis";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { extractEmailData } from "@/lib/gmail";
import { GaxiosResponse } from "gaxios";
import { gmail_v1 } from "googleapis";
import { EmailData } from "@/types/data";
import { initOauthCLient } from "@/lib/oauth";

export async function POST(request: Request) {
  try {
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
    const { senders } = (await request.json()) as { senders: string[] };

    if (!Array.isArray(senders) || senders.length === 0) {
      return NextResponse.json(
        { error: "Please provide an array of sender emails" },
        { status: 400 }
      );
    }

    const query = senders.map((email) => `from:${email}`).join(" OR ");
    let allEmails: EmailData[] = [];
    let pageToken: string | undefined;

    do {
      const messagesRes: GaxiosResponse<gmail_v1.Schema$ListMessagesResponse> =
        await gmail.users.messages.list({
          userId: "me",
          q: query,
          maxResults: 100,
          pageToken: pageToken,
        });

      const messages = messagesRes.data.messages || [];
      const emails = await Promise.all(
        messages.map(async (message) => {
          if (!message.id) return null;

          const msg: GaxiosResponse<gmail_v1.Schema$Message> =
            await gmail.users.messages.get({
              userId: "me",
              id: message.id,
              format: "full",
            });
          return extractEmailData(msg);
        })
      );

      allEmails = allEmails.concat(
        emails.filter((email): email is EmailData => email !== null)
      );
      pageToken = messagesRes.data.nextPageToken || undefined;
    } while (pageToken);

    allEmails.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return NextResponse.json({
      emails: allEmails,
      total: allEmails.length,
    });
  } catch (error: any) {
    console.error("Error fetching emails:", error);
    return NextResponse.json(
      { error: "Failed to fetch emails", details: error.message },
      { status: 500 }
    );
  }
}
