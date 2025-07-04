export const dynamic = 'force-dynamic';
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/**
 * GET /api/outlook/senders?pageToken={nextPageToken}&pageSize=50
 * Takes in cookie for token and uses it to make the request
 * Returns unique senders for each page
 */
export async function GET(request: Request) {
  try {
    const cookieStore = cookies();
    const tokensCookie = cookieStore.get("outlook_consent_tokens");

    if (!tokensCookie) {
      return NextResponse.json(
        { error: "No authentication tokens found" },
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

    // Build base URL
    let apiUrl = new URL("https://graph.microsoft.com/v1.0/me/messages");
    apiUrl.searchParams.set("$select", "from");
    apiUrl.searchParams.set("$top", pageSize.toString());
    apiUrl.searchParams.set("$orderby", "receivedDateTime desc");

    // Handle skip token
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

    // Check if we're requesting beyond available data
    if (!data.value || data.value.length === 0) {
      return NextResponse.json(
        {
          senders: [],
          nextPageToken: null,
          pageInfo: {
            currentPage: 1,
            pageSize,
            totalProcessed: 0,
            hasNextPage: false,
            message: "No more results available",
          },
        },
        { status: 200 }
      );
    }

    // Before processing messages, verify if we have data for this skip value
    if (currentSkip > 0 && (!data.value || data.value.length === 0)) {
      return NextResponse.json({
        senders: [],
        nextPageToken: null,
        pageInfo: {
          currentPage: Math.floor(currentSkip / pageSize) + 1,
          pageSize,
          totalProcessed: 0,
          hasNextPage: false,
          message: "No more senders available",
        },
      });
    }

    const senderMap = new Map();
    let validSendersCount = 0;

    // Process messages to extract unique senders
    data.value.forEach((message: any) => {
      if (message.from) {
        const { emailAddress } = message.from;
        const name = emailAddress.name || "";
        const email = emailAddress.address;

        // Only add if it's a valid email address
        if (email && isValidEmail(email)) {
          senderMap.set(email, {
            name,
            email,
            fullName: name ? `${name} <${email}>` : email,
          });
          validSendersCount++;
        }
      }
    });

    const actualResultCount = validSendersCount;
    const isLastPage =
      !data["@odata.nextLink"] ||
      actualResultCount < pageSize ||
      validSendersCount === 0;

    // Only provide nextPageToken if we have valid senders
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
        totalProcessed: actualResultCount,
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

// Add this helper function at the top of the file
function isValidEmail(email: string): boolean {
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Check if it's not an Exchange DN format
  const isExchangeDN =
    email.includes("/O=") || email.includes("/OU=") || email.includes("/CN=");

  return emailRegex.test(email) && !isExchangeDN;
}
