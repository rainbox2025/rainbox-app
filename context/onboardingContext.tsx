"use client";
import { createClient } from "@/utils/supabase/client";
import { createContext, useContext, useState } from "react";

interface OnboardingContextType {
  currentStep: number;
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  previousStep: () => void;
  checkUserName: (name: string) => Promise<boolean>;
  updateUserName: (userId: string, name: string) => Promise<void>;
  isOnboardingComplete: () => Promise<boolean>;
}
const OnboardingContext = createContext<OnboardingContextType | null>(null);
export const OnboardingProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [currentStep, setCurrentStep] = useState(1);

  const nextStep = () => {
    setCurrentStep(currentStep + 1);
  };

  const previousStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const checkUserName = async (name: string) => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("user_name", name)
      .single();
    return !data;
  };

  const updateUserName = async (userId: string, name: string) => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("users")
      .update({ user_name: name })
      .eq("id", userId);
  };

  const isOnboardingComplete = async () => {
    const supabase = createClient();
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return false;
    }
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.user.id)
      .single();
    return data?.user_name !== null;
  };

  return (
    <OnboardingContext.Provider
      value={{
        currentStep,
        setCurrentStep,
        nextStep,
        previousStep,
        checkUserName,
        updateUserName,
        isOnboardingComplete,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const value = useContext(OnboardingContext);
  if (!value) {
    throw new Error("Cannot access useOnboarding outside OnboardingProvider");
  }
  return value;
};
