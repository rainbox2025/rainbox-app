import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  try {
    // Get the authenticated user first
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get tokens using authenticated user's email
    const { data: tokenData, error: tokenError } = await supabase
      .from("outlook_tokens")
      .select("tokens, email, updated_at")
      .eq("user_email", user.email)
      .single();

    if (tokenError || !tokenData) {
      return NextResponse.json(
        { error: "No Outlook account connected" },
        { status: 401 }
      );
    }

    // 1. Check if token is expired, refresh if needed
    const { tokens } = tokenData;
    const tokenCreatedAt = new Date(tokenData.updated_at).getTime();
    const tokenExpiresIn = tokens.expires_in
      ? Number(tokens.expires_in) * 1000
      : 0;
    const tokenExpiry = tokenCreatedAt + tokenExpiresIn;
    let accessToken = tokens.access_token;

    if (Date.now() > tokenExpiry) {
      // Refresh token
      const refreshResponse = await fetch(
        "https://login.microsoftonline.com/common/oauth2/v2.0/token",
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: process.env.OUTLOOK_CLIENT_ID!,
            client_secret: process.env.OUTLOOK_CLIENT_SECRET!,
            refresh_token: tokens.refresh_token,
            grant_type: "refresh_token",
          }),
        }
      );
      if (!refreshResponse.ok) {
        return NextResponse.json(
          { error: "Failed to refresh token" },
          { status: 401 }
        );
      }
      const newTokens = await refreshResponse.json();
      await supabase
        .from("outlook_tokens")
        .update({
          tokens: newTokens,
          updated_at: new Date().toISOString(),
        })
        .eq("user_email", user.email);
      accessToken = newTokens.access_token;
    }

    // 2. Check if watch is expired and sync mails if so
    const { data: watch, error: watchFetchError } = await supabase
      .from("outlook_watch")
      .select("subscription_id, expiration, updated_at, email")
      .eq("user_email", user.email)
      .single();

    if (watch && new Date(watch.expiration).getTime() < Date.now()) {
      const { data: userRow, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("email", user.email)
        .single();
      if (userRow) {
        const user_id = userRow.id;
        // Fetch senders
        const { data: senders } = await supabase
          .from("senders")
          .select("id, email")
          .eq("user_id", user_id)
          .eq("mail_service", "outlook");
        if (senders && senders.length > 0) {
          let skipToken: string | undefined = undefined;
          let processedEmails: any[] = [];
          const lastSync = watch.updated_at || new Date(0).toISOString();
          do {
            const senderFilter = senders
              .map((s) => `from/emailAddress/address eq '${s.email}'`)
              .join(" or ");
            const dateFilter = `receivedDateTime gt ${lastSync}`;
            const filter = `(${senderFilter}) and ${dateFilter}`;
            let apiUrl = new URL(
              "https://graph.microsoft.com/v1.0/me/messages"
            );
            apiUrl.searchParams.set(
              "$select",
              "from,subject,bodyPreview,isRead,receivedDateTime"
            );
            apiUrl.searchParams.set("$top", "100");
            apiUrl.searchParams.set("$filter", filter);
            if (skipToken) apiUrl.searchParams.set("$skip", skipToken);

            const response = await fetch(apiUrl.toString(), {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
              },
            });
            if (!response.ok) break;
            const data = await response.json();
            if (!data.value) break;
            const emailsToInsert = data.value.map((message: any) => {
              const sender = senders.find(
                (s) => s.email === message.from.emailAddress.address
              );
              if (!sender) return null;
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

          // Insert emails in batches
          if (processedEmails.length > 0) {
            const batchSize = 50;
            for (let i = 0; i < processedEmails.length; i += batchSize) {
              const batch = processedEmails.slice(i, i + batchSize);
              await supabase.from("mails").upsert(batch);
              console.log(
                `[${user.email}] Inserted batch of ${batch.length} emails (${i + 1}–${i + batch.length})`
              );
              await new Promise((resolve) => setTimeout(resolve, 100));
            }
            console.log(
              `[${user.email}] Total emails inserted: ${processedEmails.length}`
            );
          } else {
            console.log(`[${user.email}] No new emails to insert.`);
          }
        }
      }
    }

    // Check for existing watch record
    const { data: existingWatch, error: watchError } = await supabase
      .from("outlook_watch")
      .select("subscription_id")
      .eq("user_email", user.email)
      .single();

    console.log("Existing watch record:", existingWatch);

    if (existingWatch) {
      // Delete existing subscription in Microsoft Graph
      const deleteResponse = await fetch(
        `https://graph.microsoft.com/v1.0/subscriptions/${existingWatch.subscription_id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`, // <-- Use refreshed token
          },
        }
      );

      if (!deleteResponse.ok && deleteResponse.status !== 404) {
        console.error(
          "Failed to delete existing subscription:",
          await deleteResponse.text()
        );
      }
    }

    // Create new subscription using Microsoft Graph API
    const notificationUrl = process.env.OUTLOOK_WEBHOOK_URI;
    const response = await fetch(
      "https://graph.microsoft.com/v1.0/subscriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`, // <-- Use refreshed token
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          changeType: "created",
          notificationUrl,
          resource: "/me/mailFolders/inbox/messages",
          expirationDateTime: new Date(Date.now() + 4230 * 60000).toISOString(),
          clientState: user.id,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        `Failed to create subscription: ${JSON.stringify(error)}`
      );
    }

    const subscriptionData = await response.json();

    // Update or create watch record
    const { error: upsertError } = await supabase.from("outlook_watch").upsert(
      {
        email: tokenData.email,
        user_email: user.email,
        subscription_id: subscriptionData.id,
        expiration: subscriptionData.expirationDateTime,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_email",
      }
    );

    if (upsertError) {
      console.error("Watch upsert error:", upsertError);
      throw new Error("Failed to store watch data");
    }

    // Verify storage
    const { data: verifyData, error: verifyError } = await supabase
      .from("outlook_watch")
      .select("subscription_id, expiration, user_email")
      .eq("user_email", user.email) // Only check by user_email
      .single();

    if (verifyError || !verifyData) {
      console.error("Watch verification error:", verifyError);
      throw new Error("Failed to verify subscription storage");
    }

    return NextResponse.json({
      success: true,
      subscriptionId: subscriptionData.id,
      expiration: subscriptionData.expirationDateTime,
      stored: {
        subscriptionId: verifyData.subscription_id,
        expiration: verifyData.expiration,
        user_email: verifyData.user_email,
      },
    });
  } catch (error: any) {
    console.error("Subscription setup error:", {
      message: error.message,
      details: error.details,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: "Failed to setup subscription", details: error.message },
      { status: 500 }
    );
  }
}
