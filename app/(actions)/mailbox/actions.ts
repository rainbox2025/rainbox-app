"use server";

import { createClient } from "@/utils/supabase/server";

export const getSecondaryEmails = async (
  userId: string
): Promise<{
  data?: string[];
  error?: string;
}> => {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("secondary_emails")
      .select("*")
      .eq("user_id", userId);
    if (error) {
      return { error: error.message };
    }
    return { data: data?.map((email) => email.name) };
  } catch (error) {
    console.error(error);
    return { error: "Internal server error" };
  }
};

export const addSecondaryEmail = async (
  email: string,
  userId: string
): Promise<{
  success?: boolean;
  error?: string;
}> => {
  try {
    const supabase = await createClient();
    const { data: existingMailbox, error: existingMailboxError } =
      await supabase.from("secondary_emails").select("*").eq("name", email);
    if (existingMailboxError) {
      return { error: existingMailboxError.message };
    }
    if (existingMailbox.length > 0) {
      return { error: "Email already exists" };
    }
    const { error } = await supabase.from("secondary_emails").insert({
      name: email,
      user_id: userId,
    });
    if (error) {
      return { error: error.message };
    }
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Internal server error" };
  }
};

export const removeSecondaryEmail = async (
  email: string,
  userId: string
): Promise<{
  success?: boolean;
  error?: string;
}> => {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("secondary_emails")
      .delete()
      .eq("name", email)
      .eq("user_id", userId);
    if (error) {
      return { error: error.message };
    }
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Internal server error" };
  }
};
