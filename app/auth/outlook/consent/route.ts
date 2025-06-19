import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const clientId = process.env.OUTLOOK_CLIENT_ID;
  const redirectUri = process.env.OUTLOOK_REDIRECT_URI;
  if (!redirectUri) {
    throw new Error("OUTLOOK_REDIRECT_URI environment variable is not set");
  }

  const scopes = [
    "openid",
    "offline_access",
    "https://graph.microsoft.com/Mail.Read",
    "https://graph.microsoft.com/User.Read",
    "email",
    "profile",
  ].join(" ");

  const authUrl =
    `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
    `client_id=${clientId}` +
    `&response_type=code` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${encodeURIComponent(scopes)}` +
    `&response_mode=query` +
    `&prompt=consent`;

  return NextResponse.json({ url: authUrl });
}
