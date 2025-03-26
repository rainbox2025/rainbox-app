"use client";

import { hasEnvVars } from "@/utils/supabase/check-env-vars";
import { useRouter } from "next/navigation";
export default async function Home() {
  const router = useRouter();
  if (hasEnvVars) {
    router.push("/dashboard");
    return;
  } else {
    router.push("/login");
    return;
  }
}
