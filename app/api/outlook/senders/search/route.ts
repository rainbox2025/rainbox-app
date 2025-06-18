import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/**
 * GET /api/outlook/senders/search
 * Allows searching for a specific sender
 * query params:
 * - sender: string (the email address or the name of the sender to search for)
 * - pageToken: string | undefined (the token for the next page of results)
 * - pageSize: number | undefined (the number of records processed in one request)
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

    const url = new URL(request.url);
    const sender = url.searchParams.get("sender");
    const rawPageToken = url.searchParams.get("pageToken");
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

    // Build search URL with simplified filter
    let apiUrl = new URL("https://graph.microsoft.com/v1.0/me/messages");
    apiUrl.searchParams.set("$select", "from");
    apiUrl.searchParams.set("$top", pageSize.toString());

    // Simplify the filter to use just one condition
    const escapedSender = sender.replace(/'/g, "''").toLowerCase();
    if (escapedSender.includes("@")) {
      // If it looks like an email, search by address
      apiUrl.searchParams.set(
        "$filter",
        `contains(from/emailAddress/address,'${escapedSender}')`
      );
    } else {
      // Otherwise search by name
      apiUrl.searchParams.set(
        "$filter",
        `contains(from/emailAddress/name,'${escapedSender}')`
      );
    }

    // Handle pagination
    let currentSkip = 0;
    if (rawPageToken) {
      try {
        currentSkip = parseInt(rawPageToken, 10);
        if (!isNaN(currentSkip) && currentSkip > 0) {
          apiUrl.searchParams.set("$skip", currentSkip.toString());
        }
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
      const errorText = await response.text();
      throw new Error(
        `Microsoft Graph API error: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    const data = await response.json();
    const senderMap = new Map<string, any>();

    // Process messages to extract unique senders
    data.value?.forEach((message: any) => {
      if (message.from?.emailAddress) {
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
        }
      }
    });

    const actualResultCount = data.value?.length || 0;
    const hasNextPage =
      !!data["@odata.nextLink"] && actualResultCount === pageSize;

    return NextResponse.json({
      senders: Array.from(senderMap.values()),
      nextPageToken: hasNextPage ? (currentSkip + pageSize).toString() : null,
      pageInfo: {
        totalResults: senderMap.size,
        resultsPerPage: pageSize,
        hasNextPage,
        currentPage: Math.floor(currentSkip / pageSize) + 1,
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
  if (!email || typeof email !== "string") {
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isExchangeDN =
    email.includes("/O=") || email.includes("/OU=") || email.includes("/CN=");

  return emailRegex.test(email) && !isExchangeDN;
}
