import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { AddSenderRequest } from "@/types/data";

export async function POST(request: Request) {
  const supabase = await createClient();

  try {
    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: authError?.message || "Not authenticated" },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body: AddSenderRequest = await request.json();

    if (!body.email || !body.name) {
      return NextResponse.json(
        { error: "email and name are required" },
        { status: 400 }
      );
    }

    // Check if sender already exists for this user
    const { data: existingSender, error: checkError } = await supabase
      .from("senders")
      .select("id, email")
      .eq("user_id", user.id)
      .eq("email", body.email)
      .eq("mail_service", "outlook")
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 is "not found" error
      return NextResponse.json(
        { error: "Failed to check existing sender" },
        { status: 500 }
      );
    }

    if (existingSender) {
      return NextResponse.json(
        {
          error: "Sender already exists for this user",
          sender: existingSender,
        },
        { status: 409 }
      );
    }

    // Extract domain from email if not provided
    const domain = body.domain || body.email.split("@")[1];

    // Insert sender
    const { data: sender, error: insertError } = await supabase
      .from("senders")
      .upsert({
        user_id: user.id,
        name: body.name,
        email: body.email,
        domain,
        mail_service: "outlook",
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json(
      {
        success: true,
        data: sender,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error adding sender:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
