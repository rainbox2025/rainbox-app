"use client";

import { hasEnvVars } from "@/utils/supabase/check-env-vars";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    if (hasEnvVars) {
      router.push("/dashboard");
    } else {
      router.push("/login");
    }
  }, []);

  return null;
}
