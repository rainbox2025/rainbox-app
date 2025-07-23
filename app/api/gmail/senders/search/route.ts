export const dynamic = "force-dynamic";
import { google } from "googleapis";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { initOauthCLient } from "@/lib/oauth";
import { createClient } from "@/utils/supabase/server";

/**
 * GET /api/gmail/senders/search
 * Allows searching for a specific sender
 * query params:
 * - sender: string (the email address or the name of the sender to search for)
 * - pageToken: string | undefined (the token for the next page of results)
 * - pageSize: number | undefined (the number of records processed in one request)
 */
export async function GET(request: Request) {
  try {
    const cookieStore = cookies();
    const tokensCookie = cookieStore.get("consent_tokens");

    if (!tokensCookie) {
      return NextResponse.json(
        { error: "No authentication tokens found" },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const sender = url.searchParams.get("sender");
    const pageToken = url.searchParams.get("pageToken");
    const pageSize = Math.min(
      Number(url.searchParams.get("pageSize")) || 100,
      100
    );

    if (!sender) {
      return NextResponse.json(
        { error: "Sender parameter is required" },
        { status: 400 }
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

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userId = user.id;

    const { data: onboardedSenders, error: dbError } = await supabase
      .from("senders")
      .select("email")
      .eq("user_id", userId)
      .eq("is_onboarded", true)
      .eq("mail_service", "gmail");

    if (dbError) {
      console.error("Supabase error:", dbError);
      return NextResponse.json(
        { error: "Failed to fetch onboarded senders" },
        { status: 500 }
      );
    }

    const onboardedEmails = new Set(
      onboardedSenders.map((s) => s.email.toLowerCase())
    );

    const searchQuery = `{from:${sender} OR from:(${sender})}`; // Handles both exact and partial match

    const messagesRes = await gmail.users.messages.list({
      userId: "me",
      q: searchQuery,
      maxResults: pageSize,
      pageToken: pageToken || undefined,
    });

    const messages = messagesRes.data.messages || [];
    const senderMap = new Map();

    await Promise.all(
      messages.map(async (message) => {
        if (!message.id) return;

        const msg = await gmail.users.messages.get({
          userId: "me",
          id: message.id,
          format: "metadata",
          metadataHeaders: ["From"],
        });

        const fromHeader = msg.data.payload?.headers?.find(
          (h) => h.name === "From"
        );
        if (fromHeader) {
          const from = fromHeader.value;
          const match = from?.match(/(?:"?([^"]*)"?\s)?(?:<?(.+@[^>]+)>?)/);
          if (match) {
            const name = match[1] || "";
            const email = match[2].toLowerCase();

            // Only include if not onboarded already
            if (!onboardedEmails.has(email)) {
              senderMap.set(email, { name, email, fullName: from });
            }
          }
        }
      })
    );

    return NextResponse.json({
      senders: Array.from(senderMap.values()),
      nextPageToken: messagesRes.data.nextPageToken || null,
      pageInfo: {
        totalResults: senderMap.size,
        resultsPerPage: pageSize,
        hasNextPage: !!messagesRes.data.nextPageToken,
      },
    });
  } catch (error: any) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Failed to search senders", details: error.message },
      { status: 500 }
    );
  }
}
