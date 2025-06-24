import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

const SUBSCRIPTION_EXPIRY_THRESHOLD_MS = 24 * 60 * 60 * 1000;

export const runtime = "nodejs";
export const preferredRegion = "auto";

export async function GET() {
  const supabase = await createClient();
  const now = Date.now();
  const refreshedUsers: string[] = [];
  const renewedSubscriptions: string[] = [];
  const errors: any[] = [];

  try {
    // 1. Fetch all outlook_watch records
    const { data: watches, error: watchesError } = await supabase
      .from("outlook_watch")
      .select("email, user_email, subscription_id, expiration, updated_at");

    if (watchesError) throw watchesError;

    for (const watch of watches) {
      const { email, user_email, subscription_id, expiration, updated_at } =
        watch;
      const expiry = new Date(expiration).getTime();
      const msToExpiry = expiry - now;

      if (msToExpiry >= SUBSCRIPTION_EXPIRY_THRESHOLD_MS) continue;

      // Fetch the associated token via user_email
      const { data: tokenRow, error: tokenError } = await supabase
        .from("outlook_tokens")
        .select("tokens, created_at, updated_at")
        .eq("user_email", user_email)
        .single();

      if (tokenError || !tokenRow) {
        errors.push({
          user_email,
          email,
          type: "token_lookup",
          error: tokenError?.message || "No token found",
        });
        continue;
      }

      let { tokens } = tokenRow;

      // Calculate expiry based on updated_at and expires_in
      const tokenUpdatedAt = new Date(tokenRow.updated_at).getTime();
      const tokenExpiresIn = tokens.expires_in
        ? Number(tokens.expires_in) * 1000
        : 0;
      const tokenExpiry = tokenUpdatedAt + tokenExpiresIn;

      const isTokenExpired = Date.now() > tokenExpiry;

      if (isTokenExpired) {
        try {
          // Refresh the token using Microsoft's token endpoint
          const refreshResponse = await fetch(
            "https://login.microsoftonline.com/common/oauth2/v2.0/token",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: new URLSearchParams({
                client_id: process.env.OUTLOOK_CLIENT_ID!,
                client_secret: process.env.OUTLOOK_CLIENT_SECRET!,
                refresh_token: tokens.refresh_token,
                grant_type: "refresh_token",
              }),
            }
          );

          if (!refreshResponse.ok) {
            throw new Error("Failed to refresh token");
          }

          const newTokens = await refreshResponse.json();

          // Get user info to verify email
          const userResponse = await fetch(
            "https://graph.microsoft.com/v1.0/me",
            {
              headers: {
                Authorization: `Bearer ${newTokens.access_token}`,
              },
            }
          );

          if (!userResponse.ok) {
            throw new Error("Failed to get user info");
          }

          const userInfo = await userResponse.json();
          const outlookEmail = userInfo.mail || userInfo.userPrincipalName;

          // Optionally calculate and store expiry_date in ms
          newTokens.expiry_date =
            Date.now() + (newTokens.expires_in || 3600) * 1000;

          // Update tokens in DB
          const { error: upsertError } = await supabase
            .from("outlook_tokens")
            .upsert(
              {
                email: outlookEmail,
                user_email,
                tokens: newTokens,
                updated_at: new Date().toISOString(),
              },
              { onConflict: "user_email" }
            );
          if (upsertError) throw upsertError;
          tokens = newTokens;
          refreshedUsers.push(user_email);
        } catch (err) {
          errors.push({
            user_email,
            type: "token_refresh",
            error: err instanceof Error ? err.message : String(err),
          });
          continue;
        }
      }

      // Fetch user_id from users table using user_email
      const { data: userRow, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("email", user_email)
        .single();

      if (userError || !userRow) {
        errors.push({
          user_email,
          email,
          type: "user_lookup",
          error: userError?.message || "No user found",
        });
        continue;
      }

      const user_id = userRow.id;

      // Fetch all senders for this user using user_id
      const { data: senders, error: sendersError } = await supabase
        .from("senders")
        .select("id, email")
        .eq("user_id", user_id)
        .eq("mail_service", "outlook");

      if (!senders || senders.length === 0) {
        console.log(`[${user_email}] No senders found for user.`);
        errors.push({
          user_email,
          email,
          type: "senders_lookup",
          error: "No senders found for user",
        });
        continue;
      }

      // 5. If the subscription is expired, fetch and save emails since last updated_at before renewing
      try {
        console.log(
          `[${user_email}] Watch expired or renewing. Syncing emails since last update: ${watch.updated_at}`
        );

        let skipToken: string | undefined = undefined;
        let processedEmails: any[] = [];
        const lastSync = watch.updated_at || new Date(0).toISOString();

        do {
          // Build the filter for multiple senders and date
          const senderFilter = senders
            .map((s) => `from/emailAddress/address eq '${s.email}'`)
            .join(" or ");
          const dateFilter = `receivedDateTime gt ${lastSync}`;
          const filter = `(${senderFilter}) and ${dateFilter}`;

          let apiUrl = new URL("https://graph.microsoft.com/v1.0/me/messages");
          apiUrl.searchParams.set(
            "$select",
            "from,subject,bodyPreview,isRead,receivedDateTime"
          );
          apiUrl.searchParams.set("$top", "100");
          apiUrl.searchParams.set("$filter", filter);

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
            throw new Error(
              `Microsoft Graph API error: ${response.statusText}`
            );
          }

          const data = await response.json();

          if (!data.value) break;

          const emailsToInsert = data.value.map((message: any) => {
            const sender = senders.find(
              (s) => s.email === message.from.emailAddress.address
            );
            if (!sender) return null;

            return {
              user_email,
              sender_id: sender.id,
              subject: message.subject || null,
              body: message.bodyPreview || null,
              read: message.isRead,
              created_at: message.receivedDateTime,
            };
          });

          const validEmails = emailsToInsert.filter(Boolean);
          processedEmails = [...processedEmails, ...validEmails];

          // Get next page token from @odata.nextLink
          const nextSkip = data["@odata.nextLink"]
            ? new URL(data["@odata.nextLink"]).searchParams.get("$skip")
            : undefined;
          skipToken = nextSkip !== null ? nextSkip : undefined;

          console.log(
            `[${user_email}] Fetched ${validEmails.length} emails in this batch.`
          );

          await new Promise((resolve) => setTimeout(resolve, 100));
        } while (skipToken);

        // Insert emails in batches
        if (processedEmails.length > 0) {
          console.log(
            `[${user_email}] Inserting ${processedEmails.length} emails into database...`
          );
          const batchSize = 50;
          for (let i = 0; i < processedEmails.length; i += batchSize) {
            const batch = processedEmails.slice(i, i + batchSize);
            const { error: insertError } = await supabase
              .from("mails")
              .upsert(batch);
            if (insertError) throw insertError;
            await new Promise((resolve) => setTimeout(resolve, 100));
          }
          console.log(`[${user_email}] Inserted all emails.`);
        } else {
          console.log(`[${user_email}] No new emails to insert.`);
        }
      } catch (err) {
        errors.push({
          user_email,
          type: "mail_sync",
          error: err instanceof Error ? err.message : String(err),
        });
        // Continue to renew subscription even if mail sync fails
      }

      // 5. Delete old subscription (ignore errors)
      try {
        await fetch(
          `https://graph.microsoft.com/v1.0/subscriptions/${subscription_id}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${tokens.access_token}`,
            },
          }
        );
      } catch {}

      // 6. Create new subscription
      try {
        const notificationUrl = process.env.OUTLOOK_WEBHOOK_URI;
        const response = await fetch(
          "https://graph.microsoft.com/v1.0/subscriptions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${tokens.access_token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              changeType: "created",
              notificationUrl,
              resource: "/me/mailFolders/inbox/messages",
              expirationDateTime: new Date(
                Date.now() + 4230 * 60000
              ).toISOString(),
              clientState: user_email,
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
        const { error: upsertError } = await supabase
          .from("outlook_watch")
          .upsert(
            {
              email,
              user_email,
              subscription_id: subscriptionData.id,
              expiration: subscriptionData.expirationDateTime,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_email" }
          );

        if (upsertError) throw upsertError;

        renewedSubscriptions.push(user_email);
      } catch (err) {
        errors.push({
          user_email,
          type: "subscription_renew",
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return NextResponse.json({
      success: true,
      refreshedUsers,
      renewedSubscriptions,
      errors,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Cron failed", details: error.message, errors },
      { status: 500 }
    );
  }
}
