import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { Client } from "@notionhq/client";

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

const databaseId = process.env.NOTION_DB_ID!;

async function createFeedbackEntry({
  username,
  email,
  type,
  message,
  imageURL,
}: {
  username: string;
  email: string;
  type: string;
  message: string;
  imageURL?: string;
}) {
  // todo: add files later
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

  if (imageURL) {
    properties.files = {
      files: [
        {
          name: "attachment",
          external: { url: imageURL },
        },
      ],
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
    const { type, message, imageURL } = await request.json();

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

    const response = await createFeedbackEntry({
      username,
      email,
      type: type || "Other",
      message,
      imageURL,
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
