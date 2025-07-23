export const dynamic = "force-dynamic";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/**
 * GET /api/outlook/senders/search
 * Query params:
 * - sender: string (email address or name fragment to search for)
 * - pageToken: string | undefined (pagination skip token)
 * - pageSize: number | undefined (max results per page, default: 50)
 */
export async function GET(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tokensCookie = cookieStore.get("outlook_consent_tokens");
    if (!tokensCookie) {
      return NextResponse.json(
        { error: "No Outlook token found" },
        { status: 401 }
      );
    }

    const tokens = JSON.parse(tokensCookie.value);
    const url = new URL(request.url);
    const sender = url.searchParams.get("sender");
    const rawPageToken = url.searchParams.get("pageToken");
    const pageSize = Math.min(
      Number(url.searchParams.get("pageSize")) || 50,
      100
    );

    if (!sender) {
      return NextResponse.json(
        { error: "Sender query is required" },
        { status: 400 }
      );
    }

    let apiUrl = new URL("https://graph.microsoft.com/v1.0/me/messages");
    const filterQuery = `contains(from/emailAddress/address,'${sender}') or contains(from/emailAddress/name,'${sender}')`;
    apiUrl.searchParams.set("$filter", filterQuery);
    apiUrl.searchParams.set("$select", "from");
    apiUrl.searchParams.set("$orderby", "receivedDateTime desc");
    apiUrl.searchParams.set("$top", pageSize.toString());

    if (rawPageToken) {
      const skip = parseInt(rawPageToken);
      if (!isNaN(skip)) {
        apiUrl.searchParams.set("$skip", skip.toString());
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
    const messages = data.value || [];
    const senderMap = new Map();

    messages.forEach((message: any) => {
      if (message.from) {
        const { emailAddress } = message.from;
        const name = emailAddress.name || "";
        const email = emailAddress.address;

        if (email && isValidEmail(email)) {
          senderMap.set(email, {
            name,
            email,
            fullName: name ? `${name} <${email}>` : email,
          });
        }
      }
    });

    const actualResultCount = senderMap.size;
    const isLastPage = !data["@odata.nextLink"] || actualResultCount < pageSize;

    const nextPageToken =
      isLastPage || actualResultCount === 0
        ? null
        : ((parseInt(rawPageToken || "0") || 0) + pageSize).toString();

    return NextResponse.json({
      senders: Array.from(senderMap.values()),
      nextPageToken,
      pageInfo: {
        totalResults: actualResultCount,
        resultsPerPage: pageSize,
        hasNextPage: !isLastPage,
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

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isExchangeDN =
    email.includes("/O=") || email.includes("/OU=") || email.includes("/CN=");
  return emailRegex.test(email) && !isExchangeDN;
}
