import openai from "@/utils/openai/client";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export const GET = async (
  request: Request,
  { params }: { params: { mail_id: string } }
) => {
  const supabase = await createClient();
  const { mail_id } = await params;
  const { data, error } = await supabase
    .from("mails")
    .select("*")
    .eq("id", mail_id)
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const summary = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "YOU ARE AN EMAIL SUMMARIZER. YOU WILL BE GIVEN AN EMAIL AND YOU WILL NEED TO SUMMARIZE IT IN A FEW SENTENCES.",
      },
      { role: "user", content: JSON.stringify(data) },
    ],
  });
  return NextResponse.json(summary.choices[0].message.content);
};
