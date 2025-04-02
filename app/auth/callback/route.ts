import { createClient } from "@/utils/supabase/server";
import { encodedRedirect } from "@/utils/utils";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;
  const redirectTo = requestUrl.searchParams.get("redirect_to")?.toString();

  const supabase = await createClient();
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.log(error.code + " " + error.message);
      return encodedRedirect("error", "/sign-in", error.message);
    }
  }

  if (redirectTo) {
    console.log("redirectTo", redirectTo);
    return NextResponse.redirect(`${origin}${redirectTo}`);
  }
  const { data: user } = await supabase.auth.getUser();
  console.log("user", user);
  if (user) {
    //check if user exists in users table
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("email", user.user?.email)
      .single();
    if (userError) {
      console.log(userError.code + " " + userError.message);
    }
    console.log(userData);
    if (!userData) {
      const { data: userData, error: userInsertError } = await supabase
        .from("users")
        .insert({
          id: user.user?.id,
          email: user.user?.email,
          avatar_url: user.user?.user_metadata.avatar_url,
        });
      if (userInsertError) {
        console.log(userInsertError.code + " " + userInsertError.message);
      }
    }
  }
  // URL to redirect to after sign up process completes
  return NextResponse.redirect(`${origin}/dashboard`);
}
