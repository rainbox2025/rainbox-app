"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useAxios } from "@/hooks/useAxios";

interface OnboardingContextType {
  currentStep: number;
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (step: number) => void;
  checkUserName: (name: string) => Promise<boolean>;
  updateUserName: (
    userId: string,
    name: string
  ) => Promise<{ error: unknown; data: string }>;
  isOnboardingComplete: () => Promise<boolean>;
  completeOnboarding: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextType | null>(null);

const ONBOARDING_STEP_KEY = "onboarding_step";

export const OnboardingProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const api = useAxios();

  useEffect(() => {
    const savedStep = localStorage.getItem(ONBOARDING_STEP_KEY);
    if (savedStep) {
      setCurrentStep(parseInt(savedStep, 10));
    }
  }, []);

  const updateStep = (step: number) => {
    localStorage.setItem(ONBOARDING_STEP_KEY, step.toString());
    setCurrentStep(step);
  };

  const nextStep = () => updateStep(currentStep + 1);
  const previousStep = () => {
    if (currentStep > 1) updateStep(currentStep - 1);
  };
  const goToStep = (step: number) => updateStep(step);

  const completeOnboarding = async () => {
    try {
      await api.patch("/onboarding");
    } catch (error) {
      console.error("Failed to mark onboarding as complete on server:", error);
    } finally {
      localStorage.removeItem(ONBOARDING_STEP_KEY);
      window.location.href = "/dashboard";
    }
  };
  const checkUserName = async (name: string): Promise<boolean> => {
    const supabase = createClient();

    try {
      // Check active users
      const { data: activeUser, error: activeError } = await supabase
        .from("users")
        .select("id")
        .eq("user_name", name)
        .maybeSingle();

      if (activeError) {
        return false;
      }
      if (activeUser) {
        return false;
      }

      // Check deleted usernames
      const { data: deletedUser, error: deletedError } = await supabase
        .from("deleted_usernames")
        .select("username")
        .eq("username", name)
        .maybeSingle();

      if (deletedError) {
        return false;
      }
      if (deletedUser) {
        return false;
      }

      return true;
    } catch (e) {
      return false;
    }
  };

  const updateUserName = async (userId: string, name: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("users")
        .update({ user_name: name })
        .eq("id", userId);
      return { error, data: "success" };
    } catch (error) {
      return { error, data: "error" };
    }
  };

  const isOnboardingComplete = async (): Promise<boolean> => {
    try {
      const { data } = await api.get<{ isComplete: boolean }>("/onboarding");
      return data.isComplete;
    } catch (error) {
      console.error(
        "Could not check onboarding status, assuming complete to avoid blocking user:",
        error
      );
      return true;
    }
  };

  return (
    <OnboardingContext.Provider
      value={{
        currentStep,
        nextStep,
        previousStep,
        goToStep,
        checkUserName,
        updateUserName,
        isOnboardingComplete,
        completeOnboarding,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = (): OnboardingContextType => {
  const value = useContext(OnboardingContext);
  if (!value)
    throw new Error("Cannot useOnboarding outside OnboardingProvider");
  return value;
};
