// api/reorder/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

interface ReorderRequest {
  order: any;
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

    const body: ReorderRequest = await request.json();
    if (!body.order) {
      return NextResponse.json(
        { error: "Missing order data" },
        { status: 400 }
      );
    }

    const { error: upsertError } = await supabase.from("sidebar_order").upsert(
      {
        user_id: user.id,
        order: body.order,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id",
      }
    );

    if (upsertError) {
      console.error("Order upsert error:", upsertError);
      throw new Error("Failed to save order");
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Reorder error:", error);
    return NextResponse.json(
      { error: "Failed to update order", details: error.message },
      { status: 500 }
    );
  }
}