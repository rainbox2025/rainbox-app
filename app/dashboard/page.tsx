"use client";
import { Onboardingmodal } from "@/components/onboardingmodal";
import { useOnboarding } from "@/context/onboardingContext";
import { useMails } from "@/context/mailsContext";
import React, { useEffect, useState } from "react";

const page = () => {
  const { isOnboardingComplete } = useOnboarding();
  const { senders, folders, mails } = useMails();
  console.log(senders, folders, mails);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  useEffect(() => {
    const checkOnboarding = async () => {
      const isOnboardingCompletes = await isOnboardingComplete();
      console.log(isOnboardingCompletes);
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
