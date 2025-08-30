import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { Client } from "@notionhq/client";
import { v4 as uuidv4 } from "uuid";

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

const databaseId = process.env.NOTION_DB_ID!;

async function createFeedbackEntry({
  username,
  email,
  type,
  message,
  fileURLs,
}: {
  username: string;
  email: string;
  type: string;
  message: string;
  fileURLs?: string[];
}) {
  const properties: any = {
    username: {
      title: [{ text: { content: username } }],
    },
    email: {
      email: email,
    },
    message: {
      rich_text: [{ text: { content: message } }],
    },
    type: {
      select: { name: type },
    },
    timestamp: {
      date: { start: new Date().toISOString() },
    },
  };

  if (fileURLs?.length) {
    properties.files = {
      files: fileURLs.map((url, i) => ({
        name: `attachment-${i + 1}`,
        external: { url },
      })),
    };
  }

  return await notion.pages.create({
    parent: { database_id: databaseId },
    properties,
  });
}

export async function POST(request: Request) {
  const supabase = await createClient();

  try {
    const formData = await request.formData();
    const message = formData.get("feedback") as string | null;
    const category = formData.get("category") as string | null;
    const screenshots = formData.getAll("screenshots") as File[];

    if (!message?.trim()) {
      return NextResponse.json(
        { error: "Message cannot be empty" },
        { status: 400 }
      );
    }

    // get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const username =
      user.user_metadata?.full_name ||
      user.user_metadata?.username ||
      "Anonymous";
    const email = user.email!;

    // Upload screenshots to Supabase Storage
    const fileURLs: string[] = [];
    for (const file of screenshots) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const path = `feedback/${user.id}/${uuidv4()}-${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("feedback-screenshots")
        .upload(path, buffer, {
          contentType: file.type,
        });

      if (uploadError) {
        console.error("Supabase upload error:", uploadError);
        continue;
      }

      const { data: publicUrl } = supabase.storage
        .from("feedback-screenshots")
        .getPublicUrl(path);

      if (publicUrl?.publicUrl) {
        fileURLs.push(publicUrl.publicUrl);
      }
    }

    // Store in Notion
    const response = await createFeedbackEntry({
      username,
      email,
      type: category || "Other",
      message,
      fileURLs,
    });

    return NextResponse.json({
      success: true,
      notionId: response.id,
    });
  } catch (error: any) {
    console.error("Feedback submission error:", error);
    return NextResponse.json(
      { error: "Failed to process request", details: error.message },
      { status: 500 }
    );
  }
}
