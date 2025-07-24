import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

function chunkArray<T>(array: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(array.length / size) }, (_, i) =>
    array.slice(i * size, i * size + size)
  );
}

export async function POST(request: Request) {
  const supabase = await createClient();
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data: senders, error: sendersError } = await supabase
      .from("senders")
      .select("id, email")
      .eq("user_id", user.id)
      .eq("mail_service", "outlook")
      .eq("is_onboarded", false);

    if (sendersError) {
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
    const tokensCookie = cookieStore.get("outlook_consent_tokens");

    if (!tokensCookie) {
      return NextResponse.json(
        { error: "No authentication tokens found" },
        { status: 401 }
      );
    }

    const tokens = JSON.parse(tokensCookie.value);
    let processedEmails: any[] = [];
    let skipToken: string | undefined = undefined;

    const senderEmailCount: Record<string, number> = {};

    do {
      const senderFilter = senders
        .map((s) => `from/emailAddress/address eq '${s.email}'`)
        .join(" or ");

      let apiUrl = new URL("https://graph.microsoft.com/v1.0/me/messages");
      apiUrl.searchParams.set(
        "$select",
        "from,subject,bodyPreview,isRead,receivedDateTime"
      );
      apiUrl.searchParams.set("$top", "100");
      apiUrl.searchParams.set("$filter", `(${senderFilter})`);

      if (skipToken) {
        apiUrl.searchParams.set("$skip", skipToken);
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
      if (!data.value) break;

      const emailsToInsert = data.value.map((message: any) => {
        const sender = senders.find(
          (s) => s.email === message.from.emailAddress.address
        );
        if (!sender) return null;

        // Track count per sender
        senderEmailCount[sender.id] = (senderEmailCount[sender.id] || 0) + 1;

        return {
          user_id: user.id,
          sender_id: sender.id,
          subject: message.subject || null,
          body: message.bodyPreview || null,
          read: message.isRead,
          created_at: message.receivedDateTime,
        };
      });

      const validEmails = emailsToInsert.filter(Boolean);
      processedEmails = [...processedEmails, ...validEmails];

      const nextSkip = data["@odata.nextLink"]
        ? new URL(data["@odata.nextLink"]).searchParams.get("$skip")
        : undefined;
      skipToken = nextSkip !== null ? nextSkip : undefined;

      await new Promise((resolve) => setTimeout(resolve, 100));
    } while (skipToken);

    if (processedEmails.length > 0) {
      const batches = chunkArray(processedEmails, 50);

      for (const batch of batches) {
        const { error: insertError } = await supabase
          .from("mails")
          .upsert(batch);

        if (insertError) {
          console.error("Error inserting email batch:", insertError);
          return NextResponse.json(
            { error: "Failed to save emails" },
            { status: 500 }
          );
        }

        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // Update sender `count` values
      for (const [senderId, count] of Object.entries(senderEmailCount)) {
        const { error: countError } = await supabase
          .from("senders")
          .update({ count: count })
          .eq("id", senderId);

        if (countError) {
          console.error(
            `Error updating count for sender ${senderId}:`,
            countError
          );
        }
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
        console.error("Error updating sender onboarding status:", updateError);
      }
    }

    return NextResponse.json({
      success: true,
      processed: processedEmails.length,
      sendersOnboarded: senders.length,
      message: "Successfully processed all emails",
      pagesProcessed: skipToken ? undefined : "all",
    });
  } catch (error: any) {
    console.error("Error processing emails:", error);
    return NextResponse.json(
      { error: "Failed to process emails", details: error.message },
      { status: 500 }
    );
  }
}
