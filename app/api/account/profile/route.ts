import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function PATCH(request: Request) {
  const supabase = await createClient();

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { fullName } = await request.json();

    if (!fullName || typeof fullName !== "string" || fullName.trim().length === 0) {
      return NextResponse.json({ error: "A valid full name is required" }, { status: 400 });
    }

    const trimmedFullName = fullName.trim();

    const { error: profileError } = await supabase
      .from("users")
      .update({ full_name: trimmedFullName })
      .eq("id", user.id);

    if (profileError) {
      console.error("Error updating user profile in 'users' table:", profileError);
      throw new Error("Failed to update user profile.");
    }

    const { data: { user: updatedAuthUser }, error: authUpdateError } = await supabase.auth.updateUser({
      data: {
        full_name: trimmedFullName,
      },
    });

    if (authUpdateError) {
      console.error("Error updating user metadata in 'auth.users':", authUpdateError);
      throw new Error("Failed to update user authentication details.");
    }

    return NextResponse.json({
      success: true,
      message: "Full name updated successfully.",
      user: updatedAuthUser,
    });

  } catch (error: any) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { error: "Failed to update profile", details: error.message },
      { status: 500 }
    );
  }
}