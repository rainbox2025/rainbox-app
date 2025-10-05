import { initOauthCLient } from "@/lib/oauth";
import { google } from "googleapis";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    let tokens;
    let fromDB = false;

    // Try to get tokens from cookies first
    const tokensCookie = cookieStore.get("consent_tokens");
    if (tokensCookie) {
      tokens = JSON.parse(tokensCookie.value);
    } else {
      // Fallback to database
      const { data: tokenData, error: tokenError } = await supabase
        .from("gmail_tokens")
        .select("tokens")
        .eq("user_email", user.email)
        .single();

      if (tokenError || !tokenData) {
        return NextResponse.json(
          { error: "No Gmail tokens found" },
          { status: 401 }
        );
      }

      tokens = tokenData.tokens;
      fromDB = true;
    }

    // Check if token is expired and refresh if needed
    const now = Date.now();
    if (tokens.expiry_date && now >= tokens.expiry_date) {
      if (!tokens.refresh_token) {
        return NextResponse.json(
          { error: "Token expired and no refresh token available" },
          { status: 401 }
        );
      }

      // Refresh token
      const refreshResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: process.env.CLIENT_ID!,
          client_secret: process.env.CLIENT_SECRET!,
          refresh_token: tokens.refresh_token,
          grant_type: "refresh_token",
        }),
      });

      const newTokens = await refreshResponse.json();
      if (!refreshResponse.ok) {
        return NextResponse.json(
          { error: "Failed to refresh token" },
          { status: 401 }
        );
      }

      // Update tokens
      tokens = {
        ...tokens,
        access_token: newTokens.access_token,
        expiry_date: now + (newTokens.expires_in || 3600) * 1000,
      };

      // Update in DB
      await supabase
        .from("gmail_tokens")
        .update({
          tokens,
          updated_at: new Date().toISOString(),
        })
        .eq("user_email", user.email);

      // Update cookie if it existed
      if (!fromDB) {
        cookieStore.set({
          name: "consent_tokens",
          value: JSON.stringify(tokens),
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 7,
          path: "/",
        });
      }
    }

    const userId = user.id;

    // Fetch onboarded Gmail senders from DB
    const { data: onboardedSenders, error: dbError } = await supabase
      .from("senders")
      .select("email")
      .eq("user_id", userId)
      .eq("is_onboarded", true)
      .eq("mail_service", "gmail");

    if (dbError) {
      console.error("Supabase DB error:", dbError);
      return NextResponse.json(
        { error: "Failed to fetch onboarded senders" },
        { status: 500 }
      );
    }

    const onboardedEmails = new Set(
      onboardedSenders.map((s) => s.email.toLowerCase())
    );

    // Gmail setup
    const oauth2Client = initOauthCLient(
      process.env.CLIENT_ID,
      process.env.CLIENT_SECRET,
      process.env.REDIRECT_URI
    );
    oauth2Client.setCredentials(tokens);
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    const url = new URL(request.url);
    const pageToken = url.searchParams.get("pageToken");
    const pageSize = Math.min(
      Number(url.searchParams.get("pageSize")) || 100,
      100
    );

    const senderMap = new Map();
    const messagesRes = await gmail.users.messages.list({
      userId: "me",
      pageToken: pageToken || undefined,
      maxResults: pageSize,
    });

    const messages = messagesRes.data.messages || [];
    let totalProcessed = 0;

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

            if (!onboardedEmails.has(email)) {
              senderMap.set(email, { name, email, fullName: from });
            }
          }
        }
        totalProcessed++;
      })
    );

    return NextResponse.json({
      senders: Array.from(senderMap.values()),
      nextPageToken: messagesRes.data.nextPageToken,
      pageInfo: {
        currentPage: pageToken ? parseInt(pageToken) : 1,
        pageSize,
        totalProcessed,
        hasNextPage: !!messagesRes.data.nextPageToken,
      },
    });
  } catch (error: any) {
    console.error("Error in Gmail sender fetch:", error);
    return NextResponse.json(
      { error: "Failed to fetch senders", details: error.message },
      { status: 500 }
    );
  }
}
