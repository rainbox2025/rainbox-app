import { NextResponse } from "next/server";
import textToSpeech from "@google-cloud/text-to-speech";

const client = new textToSpeech.TextToSpeechClient({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n").replace(
      /\n/g,
      "\n"
    ),
  },
  projectId: process.env.GOOGLE_PROJECT_ID,
});

export async function POST(request: Request) {
  try {
    console.log("Project ID:", process.env.GOOGLE_PROJECT_ID);
    console.log("Client Email:", process.env.GOOGLE_CLIENT_EMAIL);
    console.log("Private Key exists:", !!process.env.GOOGLE_PRIVATE_KEY);
    console.log(
      "Private Key starts with:",
      process.env.GOOGLE_PRIVATE_KEY?.substring(0, 50)
    );

    const { text } = await request.json();

    if (!text || !text.trim()) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const [response] = await client.synthesizeSpeech({
      input: { text },
      voice: { languageCode: "en-US", ssmlGender: "NEUTRAL" },
      audioConfig: { audioEncoding: "MP3" },
    });

    if (!response.audioContent) {
      return NextResponse.json(
        { error: "No audio content generated" },
        { status: 500 }
      );
    }

    const audioBuffer = Buffer.from(response.audioContent as Uint8Array);

    return new Response(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Disposition": 'inline; filename="speech.mp3"',
      },
    });
  } catch (error: any) {
    console.error("Google TTS error:", error);
    return NextResponse.json(
      { error: "Failed to generate speech", details: error.message },
      { status: 500 }
    );
  }
}
