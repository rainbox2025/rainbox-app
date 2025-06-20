import { NextResponse } from "next/server";
import { google } from "googleapis";
import { initOauthCLient } from "@/lib/oauth";
import { createClient } from "@/utils/supabase/server";

const WATCH_EXPIRY_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 1 day

export const runtime = "nodejs";
export const preferredRegion = "auto";

export async function GET() {
  const supabase = await createClient();
  const now = Date.now();
  const refreshedUsers: string[] = [];
  const renewedWatches: string[] = [];
  const errors: any[] = [];

  try {
    const { data: watches, error: watchesError } = await supabase
      .from("gmail_watch")
      .select("email, user_id, expiration");

    if (watchesError) throw watchesError;

    for (const watch of watches) {
      const { email, user_id, expiration } = watch;
      const watchExpiry = new Date(expiration).getTime();
      const msToWatchExpiry = watchExpiry - now;

      if (msToWatchExpiry >= WATCH_EXPIRY_THRESHOLD_MS) continue;

      // ! this is a bottleneck, fix it by changing user_email to user_id in the gmail_tokens table and refactoring the code accordingly (auth/gmail routes)
      const { data: userRow, error: userError } = await supabase
        .from("users")
        .select("email")
        .eq("id", user_id)
        .single();

      if (userError || !userRow) {
        errors.push({
          user_id,
          email,
          type: "user_lookup",
          error: userError?.message || "No user found",
        });
        continue;
      }

      const user_email = userRow.email;

      const { data: tokenRow, error: tokenError } = await supabase
        .from("gmail_tokens")
        .select("tokens, user_email")
        .eq("user_email", user_email)
        .single();

      if (tokenError || !tokenRow) {
        errors.push({
          user_id,
          email,
          user_email,
          type: "token_lookup",
          error: tokenError?.message || "No token found",
        });
        continue;
      }

      let { tokens } = tokenRow;
      if (!tokens?.expiry_date || !tokens?.refresh_token) continue;

      const isTokenExpired = tokens.expiry_date < now;
      let oauth2Client = initOauthCLient(
        process.env.CLIENT_ID,
        process.env.CLIENT_SECRET,
        process.env.REDIRECT_URI
      );

      if (isTokenExpired) {
        try {
          oauth2Client.setCredentials({ refresh_token: tokens.refresh_token });
          const { credentials } = await oauth2Client.refreshAccessToken();
          oauth2Client.setCredentials(credentials);
          tokens = credentials;

          const { error: upsertError } = await supabase
            .from("gmail_tokens")
            .upsert(
              {
                email,
                user_email,
                tokens: credentials,
                updated_at: new Date().toISOString(),
              },
              { onConflict: "user_email" }
            );
          if (upsertError) throw upsertError;
          refreshedUsers.push(user_email);
        } catch (err) {
          errors.push({
            user_email,
            type: "token_refresh",
            error: err instanceof Error ? err.message : String(err),
          });
          continue;
        }
      } else {
        oauth2Client.setCredentials(tokens);
      }

      try {
        const gmail = google.gmail({ version: "v1", auth: oauth2Client });
        const topicName = process.env.PUBSUB_TOPIC_NAME;

        try {
          await gmail.users.stop({ userId: "me" });
        } catch (e) {
          console.log(`Stop failed for ${user_email}, safe to ignore`);
        }

        const response = await gmail.users.watch({
          userId: "me",
          requestBody: {
            topicName,
            labelIds: ["INBOX"],
            labelFilterAction: "INCLUDE",
          },
        });

        await supabase.from("gmail_watch").upsert(
          {
            email,
            user_id,
            history_id: response.data.historyId,
            expiration: new Date(Number(response.data.expiration)),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );

        console.log(
          `Renewed watch for ${user_email}, expires at ${new Date(Number(response.data.expiration)).toISOString()}`
        );
        renewedWatches.push(user_email);
      } catch (err) {
        errors.push({
          user_email,
          type: "watch_renew",
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return NextResponse.json({
      success: true,
      refreshedUsers,
      renewedWatches,
      errors,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Cron failed", details: error.message, errors },
      { status: 500 }
    );
  }
}
