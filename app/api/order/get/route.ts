// api/order/get/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data: orderData, error: orderError } = await supabase
      .from("sidebar_order")
      .select("order")
      .eq("user_id", user.id)
      .single();

    if (orderError) {
      if (orderError.code === "PGRST116") {
        return NextResponse.json({ order: null });
      }
      throw orderError;
    }

    return NextResponse.json({ order: orderData?.order || null });
  } catch (error: any) {
    console.error("Order fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch order", details: error.message },
      { status: 500 }
    );
  }
}