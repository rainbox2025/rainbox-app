export const dynamic = "force-dynamic";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/**
 * GET /api/outlook/senders?pageToken={nextPageToken}&pageSize=50
 * Auth required. Extracts user from Supabase session and filters onboarded senders.
 */
export async function GET(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = await createClient();

    // Get the logged-in user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized. No active Supabase session." },
        { status: 401 }
      );
    }

    const userId = user.id;
    const tokensCookie = cookieStore.get("outlook_consent_tokens");

    if (!tokensCookie) {
      return NextResponse.json(
        { error: "No Outlook tokens found" },
        { status: 401 }
      );
    }

    const tokens = JSON.parse(tokensCookie.value);
    const url = new URL(request.url);
    const rawPageToken = url.searchParams.get("pageToken");
    const pageSize = Math.min(
      Number(url.searchParams.get("pageSize")) || 100,
      100
    );

    // Fetch onboarded Outlook senders from Supabase
    const { data: onboardedSenders, error: dbError } = await supabase
      .from("senders")
      .select("email")
      .eq("user_id", userId)
      .eq("is_onboarded", true)
      .eq("mail_service", "outlook");

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

    // Build Microsoft Graph API URL
    let apiUrl = new URL("https://graph.microsoft.com/v1.0/me/messages");
    apiUrl.searchParams.set("$select", "from");
    apiUrl.searchParams.set("$top", pageSize.toString());
    apiUrl.searchParams.set("$orderby", "receivedDateTime desc");

    let currentSkip = 0;
    if (rawPageToken) {
      try {
        currentSkip = parseInt(rawPageToken);
        apiUrl.searchParams.set("$skip", currentSkip.toString());
      } catch (e) {
        console.error("Invalid page token:", e);
      }
    }

    const response = await fetch(apiUrl.toString(), {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Microsoft Graph API error: ${response.statusText}`);
    }

    const data = await response.json();
    const senderMap = new Map();
    let validSendersCount = 0;

    data.value.forEach((message: any) => {
      if (message.from) {
        const { emailAddress } = message.from;
        const name = emailAddress.name || "";
        const email = emailAddress.address.toLowerCase();

        if (email && isValidEmail(email) && !onboardedEmails.has(email)) {
          senderMap.set(email, {
            name,
            email,
            fullName: name ? `${name} <${email}>` : email,
          });
          validSendersCount++;
        }
      }
    });

    const isLastPage =
      !data["@odata.nextLink"] ||
      validSendersCount < pageSize ||
      validSendersCount === 0;

    const nextPageToken =
      isLastPage || validSendersCount === 0
        ? null
        : (currentSkip + pageSize).toString();

    return NextResponse.json({
      senders: Array.from(senderMap.values()),
      nextPageToken,
      pageInfo: {
        currentPage: Math.floor(currentSkip / pageSize) + 1,
        pageSize,
        totalProcessed: validSendersCount,
        hasNextPage: !isLastPage && validSendersCount > 0,
      },
    });
  } catch (error: any) {
    console.error("Error fetching Outlook senders:", error);
    return NextResponse.json(
      { error: "Failed to fetch senders", details: error.message },
      { status: 500 }
    );
  }
}

// Helper
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isExchangeDN =
    email.includes("/O=") || email.includes("/OU=") || email.includes("/CN=");
  return emailRegex.test(email) && !isExchangeDN;
}
