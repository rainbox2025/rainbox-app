import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

const SUBSCRIPTION_EXPIRY_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 1 day

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
      .select("email, user_email, subscription_id, expiration");

    if (watchesError) throw watchesError;

    for (const watch of watches) {
      const { email, user_email, subscription_id, expiration } = watch;
      const expiry = new Date(expiration).getTime();
      const msToExpiry = expiry - now;

      // 2. Only process if subscription is about to expire
      if (msToExpiry >= SUBSCRIPTION_EXPIRY_THRESHOLD_MS) continue;

      // 3. Fetch the associated token via user_email
      const { data: tokenRow, error: tokenError } = await supabase
        .from("outlook_tokens")
        .select("tokens")
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

      if (!tokens?.expires_in || !tokens?.refresh_token) continue;

      // Calculate token expiry (Microsoft gives expires_in in seconds, not a timestamp)
      // You should store the expiry timestamp in your DB for accuracy, but if not:
      // Assume you store the token's expiry timestamp as tokens.expiry_date (ms)
      const isTokenExpired = tokens.expiry_date
        ? tokens.expiry_date < now
        : false;

      // 4. Refresh token if expired
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
