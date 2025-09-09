// app/api/webhooks/lemonsqueezy/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createWebhookAdminClient } from "@/utils/supabase/server";
import { a } from "framer-motion/dist/types.d-B50aGbjN";

function log(step: string, payload?: any) {
  console.log(`[LS WEBHOOK] ${step}`, payload ?? "");
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-signature") || "";
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET!;

  // 1) Verify signature
  const digest = crypto
    .createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("hex");
  const valid = digest === signature;
  log("signature check", { valid, digest, signature });
  if (!valid)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });

  // 2) Parse event
  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch (e) {
    log("parse error", e);
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { meta, data } = event;
  const eventName = meta?.event_name;
  const attrs = data?.attributes ?? {};
  log("event received", { eventName, subId: data?.id });
  console.log(meta);

  const supabase = await createWebhookAdminClient();

  // 3) Pull userId from checkout metadata if present
  const userId = attrs?.checkout_data?.user_id ?? null;
  log("userId extracted", userId);

  // 4) Map variant_id -> plan_id
  let planId: number | null = null;
  if (attrs.variant_id) {
    const { data: planRow, error } = await supabase
      .from("plans")
      .select("id")
      .eq("lemon_variant_id", attrs.variant_id)
      .maybeSingle();
    if (error) log("plan lookup error", error);
    planId = planRow?.id ?? null;
  }
  log("plan mapping", { variantId: attrs.variant_id, planId });

  // 5) Common subscription row
  const subRow = {
    lemon_subscription_id: data?.id,
    user_id: userId,
    plan_id: planId,
    status: attrs.status ?? null,
    trial_ends_at: attrs.trial_ends_at,
    renews_at: attrs.renews_at,
    ends_at: attrs.ends_at,
    lemon_customer_id: attrs.customer_id,
    updated_at: new Date().toISOString(),
  };

  try {
    switch (eventName) {
      case "subscription_created": {
        log("handling subscription_created", subRow);
        const { error } = await supabase
          .from("subscriptions")
          .upsert(
            { ...subRow, created_at: new Date().toISOString() },
            { onConflict: "lemon_subscription_id" }
          );
        if (error) log("subscription_created error", error);
        break;
      }

      case "subscription_updated": {
        log("handling subscription_updated", subRow);
        const { error } = await supabase
          .from("subscriptions")
          .upsert(subRow, { onConflict: "lemon_subscription_id" });
        if (error) log("subscription_updated error", error);
        break;
      }

      case "subscription_payment_success": {
        log("handling subscription_payment_success", {
          renews_at: attrs.renews_at,
        });
        const { error } = await supabase
          .from("subscriptions")
          .update({
            status: "active",
            renews_at: attrs.renews_at,
            ends_at: attrs.ends_at,
            updated_at: new Date().toISOString(),
          })
          .eq("lemon_subscription_id", data?.id);
        if (error) log("subscription_payment_success error", error);
        break;
      }

      case "subscription_payment_failed": {
        log("handling subscription_payment_failed");
        const { error } = await supabase
          .from("subscriptions")
          .update({ status: "past_due", updated_at: new Date().toISOString() })
          .eq("lemon_subscription_id", data?.id);
        if (error) log("subscription_payment_failed error", error);
        break;
      }

      case "subscription_cancelled":
      case "subscription_expired": {
        log(`handling ${eventName}`);
        const { error } = await supabase
          .from("subscriptions")
          .update({
            status:
              eventName === "subscription_cancelled" ? "cancelled" : "expired",
            ends_at: attrs.ends_at,
            updated_at: new Date().toISOString(),
          })
          .eq("lemon_subscription_id", data?.id);
        if (error) log(`${eventName} error`, error);
        break;
      }

      case "subscription_paused": {
        log("handling subscription_paused");
        const { error } = await supabase
          .from("subscriptions")
          .update({ status: "paused", updated_at: new Date().toISOString() })
          .eq("lemon_subscription_id", data?.id);
        if (error) log("subscription_paused error", error);
        break;
      }

      case "subscription_resumed": {
        log("handling subscription_resumed");
        const { error } = await supabase
          .from("subscriptions")
          .update({ status: "active", updated_at: new Date().toISOString() })
          .eq("lemon_subscription_id", data?.id);
        if (error) log("subscription_resumed error", error);
        break;
      }

      default: {
        log("unhandled event", eventName);
      }
    }
  } catch (e) {
    log("exception", e);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
