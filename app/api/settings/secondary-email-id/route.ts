import { NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
export const GET = async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    if (!userId) {
      return new Response("Missing userId parameter", { status: 400 });
    }
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("secondary_emails")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      return new Response("Internal server error", { status: 500 });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
    });
  } catch (error) {
    console.error(error);
    return new Response("Internal server error", { status: 500 });
  }
};
export const DELETE = async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const email = searchParams.get("name");
    if (!userId) {
      return new Response("Missing userId parameter", { status: 400 });
    }
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("secondary_emails")
      .delete()
      .eq("user_id", userId)
      .eq("name", email);
    if (error) {
      return new Response("Internal server error", { status: 500 });
    }
    return new Response(JSON.stringify(data), {
      status: 200,
    });
  } catch (error) {}
};
