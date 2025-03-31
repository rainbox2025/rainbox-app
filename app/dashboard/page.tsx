"use client";
import { Onboardingmodal } from "@/components/onboardingmodal";
import { useOnboarding } from "@/context/onboardingContext";
import { useMails } from "@/context/mailsContext";
import { useFolders } from "@/context/foldersContext";
import { useSenders } from "@/context/sendersContext";
import React, { useEffect, useState } from "react";
import Sidebar from "@/components/sidebar/Sidebar";

const page = () => {
  const { isOnboardingComplete } = useOnboarding();
  const { mails } = useMails();
  const { folders } = useFolders();
  const { senders } = useSenders();
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  useEffect(() => {
    const checkOnboarding = async () => {
      const isOnboardingCompletes = await isOnboardingComplete();
      if (!isOnboardingCompletes) {
        setShowOnboardingModal(true);
      }
    };
    checkOnboarding();
  }, [isOnboardingComplete]);
  return (
    <div>
      {showOnboardingModal && <Onboardingmodal />}
      <h1>Hello</h1>
    </div>
  );
};

export default page;
