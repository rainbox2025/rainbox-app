import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// Send email to user
export const POST = async (req: Request) => {
  const { name, email, domain, user_id } = await req.json();
  const supabase = await createClient();
  const { data, error } = await supabase.from("senders").insert({
    name,
    email,
    domain,
    user_id,
  });
  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
  return NextResponse.json({ message: "Email sent successfully" });
};

export async function GET() {
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
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (sendersError) {
      return NextResponse.json(
        { error: sendersError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      senders,
      count: senders?.length || 0,
    });
  } catch (error: any) {
    console.error("Error fetching senders:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
