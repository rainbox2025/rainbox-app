"use client";

import { createClient } from "@/utils/supabase/client"; // Ensure this path is correct
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { PostgrestError } from "@supabase/supabase-js";

// LocalStorage Keys
const ONBOARDING_STEP_KEY = "onboardingCurrentStep";
const ONBOARDING_USERNAME_KEY = "onboardingRainboxUsername";
const ONBOARDING_TOPICS_KEY = "onboardingSelectedTopics";
const ONBOARDING_COUNTRY_KEY = "onboardingCountry";
const ONBOARDING_COMPLETED_KEY = "onboardingCompleted";

interface OnboardingContextType {
  currentStep: number;
  userName: string; // For Rainbox username (persisted)
  selectedTopics: string[]; // Persisted
  country: string; // Persisted
  isOnboardingCompleted: boolean; // Persisted state

  nextStep: () => void;
  previousStep: () => void;
  goToStep: (step: number) => void;

  // Checks if a Rainbox username is available
  checkUserNameAvailability: (username: string) => Promise<boolean>;

  // Updates the user's Rainbox username in DB and persists it
  saveRainboxUserName: (
    userId: string,
    newUsername: string
  ) => Promise<{ error: PostgrestError | null }>;

  // Updates selected topics and country (persists them)
  updateTopicsAndCountry: (topics: string[], country: string) => void;

  // Marks onboarding as complete (persists this status)
  finalizeOnboarding: () => void;

  // Resets onboarding progress (clears persisted data)
  resetOnboardingProgress: () => void;

  // For immediate UI update of username input before saving to DB
  setLocalUsername: (name: string) => void;

  // Initial check if onboarding was previously completed (can use DB or localStorage)
  checkIfPreviouslyCompleted: () => Promise<boolean>;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const OnboardingProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentStep, setCurrentStepState] = useState<number>(1);
  const [userName, setUserNameState] = useState<string>("");
  const [selectedTopics, setSelectedTopicsState] = useState<string[]>([]);
  const [country, setCountryState] = useState<string>("");
  const [isOnboardingCompleted, setIsOnboardingCompletedState] = useState<boolean>(false);
  const [isLoadingCompletionStatus, setIsLoadingCompletionStatus] = useState(true);


  // Load state from localStorage on initial mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedCompleted = localStorage.getItem(ONBOARDING_COMPLETED_KEY);
      if (savedCompleted === 'true') {
        setIsOnboardingCompletedState(true);
        // If already marked completed in LS, no need to load other step-specific data
        // unless you want to allow users to go back and change things even after "completion"
        // For a strict completion, this is fine.
        setCurrentStepState(5); // Or a "completed" step if you have one beyond the flow
        setUserNameState(localStorage.getItem(ONBOARDING_USERNAME_KEY) || ""); // Still useful to show
        setIsLoadingCompletionStatus(false);
        return;
      }

      const savedStep = localStorage.getItem(ONBOARDING_STEP_KEY);
      const savedUsername = localStorage.getItem(ONBOARDING_USERNAME_KEY);
      const savedTopics = localStorage.getItem(ONBOARDING_TOPICS_KEY);
      const savedCountry = localStorage.getItem(ONBOARDING_COUNTRY_KEY);

      setCurrentStepState(savedStep ? parseInt(savedStep, 10) : 1);
      setUserNameState(savedUsername || "");
      setSelectedTopicsState(savedTopics ? JSON.parse(savedTopics) : []);
      setCountryState(savedCountry || "");
      setIsLoadingCompletionStatus(false);
    }
  }, []);

  // Persist currentStep whenever it changes
  const setCurrentStep = useCallback((step: number) => {
    localStorage.setItem(ONBOARDING_STEP_KEY, step.toString());
    setCurrentStepState(step);
  }, []);

  const nextStep = useCallback(() => {
    // Assuming 5 steps in total. Adjust if different.
    if (currentStep < 5) { // Ensure `totalSteps` is defined or hardcoded correctly
      setCurrentStep(currentStep + 1);
    } else if (currentStep === 5) {
      finalizeOnboarding(); // Auto-complete on last step's "next"
    }
  }, [currentStep, setCurrentStep]);

  const previousStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep, setCurrentStep]);

  const goToStep = useCallback((step: number) => {
    if (step >= 1 && step <= 5) { // Assuming 5 steps
      setCurrentStep(step);
    }
  }, [setCurrentStep]);

  const checkUserNameAvailability = async (name: string): Promise<boolean> => {
    const supabase = createClient(); // Corrected: createClient is not async
    const { data, error } = await supabase
      .from("users") // Ensure 'users' is your table name and 'user_name' is the column
      .select("id") // Select a minimal field like 'id' or 'user_name'
      .eq("user_name", name)
      .maybeSingle(); // Use maybeSingle if username is unique and can be null/not found

    if (error) {
      console.error("Error checking username availability:", error);
      // Depending on your error handling strategy, you might throw or return a default
      return false; // e.g., assume not available on error to be safe
    }
    return !data; // True if username is available (no data found for that name)
  };

  const saveRainboxUserName = async (userId: string, newUsername: string): Promise<{ error: PostgrestError | null }> => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("users")
        .update({ user_name: newUsername }) // Optionally mark completion time
        .eq("id", userId)
        .select() // Important to get the error if the update fails (e.g. RLS)
        .single(); // if you expect one row to be updated and want to confirm

      if (!error) {
        localStorage.setItem(ONBOARDING_USERNAME_KEY, newUsername);
        setUserNameState(newUsername);
      } else {
        console.error("Error updating username in Supabase:", error);
      }
      return { error };
    } catch (catchError: any) { // Catch any unexpected errors
      console.error("Unexpected error in saveRainboxUserName:", catchError);
      // Construct a PostgrestError-like object if needed, or handle as a generic error
      return { error: { message: catchError.message || "Unknown error", details: '', hint: '', code: 'CATCH_ERROR' } as PostgrestError };
    }
  };

  const setLocalUsername = (name: string) => {
    // This updates the state immediately for the input field,
    // but doesn't persist to localStorage until saveRainboxUserName is successful.
    setUserNameState(name);
  };

  const updateTopicsAndCountry = (topics: string[], newCountry: string) => {
    localStorage.setItem(ONBOARDING_TOPICS_KEY, JSON.stringify(topics));
    localStorage.setItem(ONBOARDING_COUNTRY_KEY, newCountry);
    setSelectedTopicsState(topics);
    setCountryState(newCountry);
    // Optionally, make an API call here to save these preferences to your backend/DB
    // await supabase.from("user_preferences").update({ topics, country }).eq("user_id", userId);
    console.log("Topics and country saved to localStorage:", topics, newCountry);
  };

  const finalizeOnboarding = () => {
    console.log("Onboarding finalized!");
    localStorage.setItem(ONBOARDING_COMPLETED_KEY, "true");
    setIsOnboardingCompletedState(true);
    // Clean up step-specific storage if desired, though username might still be useful
    // localStorage.removeItem(ONBOARDING_STEP_KEY);
    // localStorage.removeItem(ONBOARDING_TOPICS_KEY); // Keep if user can edit later
    // localStorage.removeItem(ONBOARDING_COUNTRY_KEY); // Keep if user can edit later

    // Potentially make a final API call to mark onboarding as fully complete in DB
    // if not already done by saveRainboxUserName or similar step-specific saves
    // const supabase = createClient();
    // const { data: { user } } = await supabase.auth.getUser();
    // if (user) {
    //   await supabase.from("users").update({ onboarding_truly_completed: true }).eq("id", user.id);
    // }
  };

  const resetOnboardingProgress = () => {
    localStorage.removeItem(ONBOARDING_COMPLETED_KEY);
    localStorage.removeItem(ONBOARDING_STEP_KEY);
    localStorage.removeItem(ONBOARDING_USERNAME_KEY);
    localStorage.removeItem(ONBOARDING_TOPICS_KEY);
    localStorage.removeItem(ONBOARDING_COUNTRY_KEY);

    setIsOnboardingCompletedState(false);
    setCurrentStepState(1);
    setUserNameState("");
    setSelectedTopicsState([]);
    setCountryState("");
    console.log("Onboarding progress has been reset.");
    // You might want to reload or navigate the user to the start
  };

  // This function aligns with your original `isOnboardingComplete`
  // It checks the DB, useful for initial load if localStorage is unreliable or to sync
  const checkIfPreviouslyCompleted = async (): Promise<boolean> => {
    if (isOnboardingCompleted && !isLoadingCompletionStatus) return true; // Already true from LS

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setIsLoadingCompletionStatus(false);
      return false; // No user, so onboarding can't be complete for them
    }

    const { data, error } = await supabase
      .from("users")
      .select("user_name") // Check for username or a specific completion flag
      .eq("id", user.id)
      .single();

    setIsLoadingCompletionStatus(false);
    if (error) {
      console.error("Error fetching user completion status:", error);
      return false; // Assume not complete on error
    }

    // Define your condition for "completed" based on DB fields
    const dbComplete = !!(data?.user_name);
    if (dbComplete) {
      setIsOnboardingCompletedState(true);
      localStorage.setItem(ONBOARDING_COMPLETED_KEY, "true");
      if (data?.user_name) {
        setUserNameState(data.user_name);
        localStorage.setItem(ONBOARDING_USERNAME_KEY, data.user_name);
      }
    }
    return dbComplete;
  };

  // Fetch initial completion status from DB if not found in LS
  useEffect(() => {
    const checkInitialCompletion = async () => {
      if (typeof window !== "undefined" && !localStorage.getItem(ONBOARDING_COMPLETED_KEY)) {
        await checkIfPreviouslyCompleted();
      }
    };
    checkInitialCompletion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Runs once on mount

  if (isLoadingCompletionStatus && typeof window !== "undefined") {
    // Avoid rendering children or returning context value until LS/DB check is done
    // This prevents flicker or components acting on incomplete state
    // You might show a loader here if this context is at a high level
    return <>{children}</>; // Or a loader component: <GlobalLoader />;
  }


  return (
    <OnboardingContext.Provider
      value={{
        currentStep,
        userName,
        selectedTopics,
        country,
        isOnboardingCompleted,
        nextStep,
        previousStep,
        goToStep,
        checkUserNameAvailability,
        saveRainboxUserName,
        updateTopicsAndCountry,
        finalizeOnboarding,
        resetOnboardingProgress,
        setLocalUsername,
        checkIfPreviouslyCompleted,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (context === undefined) { // Check for undefined, not null
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
};