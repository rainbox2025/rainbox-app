import {
  lemonSqueezySetup,
  createCheckout,
} from "@lemonsqueezy/lemonsqueezy.js";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/middleware";
import { createClient } from "@/utils/supabase/server";
import { check } from "prettier";

// Initialize the SDK securely
lemonSqueezySetup({
  apiKey: process.env.LEMONSQUEEZY_API_KEY!,
  onError: (error) => console.error("LemonSqueezy SDK Error:", error),
});

export async function POST(request: Request) {
  const { user, response, supabase } = await requireAuth(request);
  if (!user) return response;

  const { planId } = await request.json();

  const { data: plan, error } = await supabase
    .from("plans")
    .select("*")
    .eq("id", planId)
    .single();

  if (error || !plan) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  const storeId = parseInt(process.env.LEMONSQUEEZY_STORE_ID!);
  const variantId = plan.lemon_variant_id;

  const { data }: { data: any } = await createCheckout(storeId, variantId, {
    checkoutOptions: {
      embed: false,
    },
    checkoutData: {
      email: user.email,
      custom: { userId: user.id },
    },
  });
  console.log(data);

  return new Response(JSON.stringify({ url: data?.attributes.url }));
}
