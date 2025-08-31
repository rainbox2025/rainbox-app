// app/api/tts/route.ts
import { NextResponse } from "next/server";
import textToSpeech from "@google-cloud/text-to-speech";

const credentials = JSON.parse(process.env.GOOGLE_TTS_CREDENTIALS || "{}");

const client = new textToSpeech.TextToSpeechClient({
  credentials,
});

export async function POST(request: Request) {
  try {
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

    const audioBuffer = response.audioContent as Uint8Array;

    // Convert to ArrayBuffer for Response
    const arrayBuffer: any = audioBuffer.buffer.slice(
      audioBuffer.byteOffset,
      audioBuffer.byteOffset + audioBuffer.byteLength
    );

    return new Response(arrayBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Disposition": `inline; filename="speech.mp3"`,
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
