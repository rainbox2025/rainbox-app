import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

const WHOLE_MAIL_BOOKMARK_RANGE = {
  start: { path: [], offset: 0 },
  end: { path: [], offset: 0 },
};

export const PATCH = async (
  request: Request,
  { params }: { params: { mail_id: string } }
) => {
  const supabase = await createClient();
  const { mail_id } = params;

  let body;
  try {
    body = await request.json();
    console.log("PATCH request body:", body); // 👈 log request body
  } catch (e) {
    console.error("Failed to parse JSON:", e);
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { bookmark: shouldBeBookmarked } = body;
  console.log("shouldBeBookmarked:", shouldBeBookmarked); // 👈 log boolean

  const { data: mail, error: mailError } = await supabase
    .from("mails")
    .select("*, senders(name)")
    .eq("id", mail_id)
    .single();

  if (mailError || !mail) {
    console.error("Mail fetch error:", mailError);
    return NextResponse.json({ error: "Mail not found" }, { status: 404 });
  }

  if (shouldBeBookmarked) {
    const { data: existingBookmark, error: existingError } = await supabase
      .from("bookmarks")
      .select("id")
      .eq("mail_id", mail.id)
      .eq("text", mail.subject)
      .maybeSingle();

    if (existingError) console.error("Bookmark check error:", existingError);

    if (!existingBookmark) {
      const { error: insertError } = await supabase.from("bookmarks").insert({
        user_id: mail.user_id,
        mail_id: mail.id,
        text: mail.subject || "Bookmarked Email",
        serialized_range: WHOLE_MAIL_BOOKMARK_RANGE,
        sender_name: mail.senders?.name,
      });

      if (insertError) {
        console.error("Insert bookmark error:", insertError);
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
    }
  } else {
    const { error: deleteError } = await supabase
      .from("bookmarks")
      .delete()
      .eq("mail_id", mail.id)
      .eq("text", mail.subject || "Bookmarked Email");

    if (deleteError) {
      console.error("Delete bookmark error:", deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }
  }

  const { data: updatedMail, error: updateMailError } = await supabase
    .from("mails")
    .update({ bookmarked: shouldBeBookmarked })
    .eq("id", mail_id)
    .select()
    .single();

  if (updateMailError) {
    console.error("Update mail error:", updateMailError);
    return NextResponse.json({ error: updateMailError.message }, { status: 500 });
  }

  return NextResponse.json(updatedMail);
};
