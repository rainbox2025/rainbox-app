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
  const { bookmark: shouldBeBookmarked } = await request.json();

  
  
  
  const { data: mail, error: mailError } = await supabase
    .from("mails")
    
    .select("*, senders(name)") 
    .eq("id", mail_id)
    .single();
  

  if (mailError || !mail) {
    return NextResponse.json({ error: "Mail not found" }, { status: 404 });
  }

  
  const senderName = mail.senders?.name;

  if (shouldBeBookmarked) {
    
    const { data: existingBookmark } = await supabase
      .from("bookmarks")
      .select("id")
      .eq("mail_id", mail.id)
      .eq("text", mail.subject)
      .maybeSingle();

    if (!existingBookmark) {
      
      
      const { error: insertError } = await supabase
        .from("bookmarks")
        .insert({
          user_id: mail.user_id,
          mail_id: mail.id,
          text: mail.subject || 'Bookmarked Email',
          serialized_range: WHOLE_MAIL_BOOKMARK_RANGE,
          sender_name: senderName, 
        });
      

      if (insertError) {
        console.error("Failed to insert bookmark:", insertError);
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
    }
  } else {
    
    const { error: deleteError } = await supabase
      .from("bookmarks")
      .delete()
      .eq("mail_id", mail.id)
      .eq("text", mail.subject || 'Bookmarked Email');

    if (deleteError) {
      console.error("Failed to delete bookmark:", deleteError);
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
    return NextResponse.json({ error: updateMailError.message }, { status: 500 });
  }

  return NextResponse.json(updatedMail);
};