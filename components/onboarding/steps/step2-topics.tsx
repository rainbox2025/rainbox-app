"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useOnboarding } from "@/context/onboardingContext";

const primaryButtonClasses = "bg-primary text-primary-foreground hover:bg-primary/80";
const secondaryButtonClasses = "text-muted-foreground hover:bg-accent";

const topicsList = [
  // ... your topics list
  { id: "tech", name: "Tech" }, { id: "business", name: "Business" },
  { id: "marketing", name: "Marketing" }, { id: "finance", name: "Finance" },
  // Add all other topics
];

export const Step2Topics = () => {
  const {
    nextStep,
    previousStep,
    selectedTopics: contextSelectedTopics,
    country: contextCountry,
    updateTopicsAndCountry // Use the context function to persist
  } = useOnboarding();

  // Local state for this step's inputs, initialized from context
  const [localSelectedTopics, setLocalSelectedTopics] = useState<string[]>(contextSelectedTopics);
  const [localCountry, setLocalCountry] = useState<string>(contextCountry);

  // If context values change (e.g., user navigates back and forth), update local state
  useEffect(() => {
    setLocalSelectedTopics(contextSelectedTopics);
  }, [contextSelectedTopics]);

  useEffect(() => {
    setLocalCountry(contextCountry);
  }, [contextCountry]);


  const handleTopicSelection = (topicId: string) => {
    setLocalSelectedTopics(prev =>
      prev.includes(topicId)
        ? prev.filter(t => t !== topicId)
        : [...prev, topicId]
    );
  };

  const handleNext = () => {
    // Update the context and localStorage before moving to the next step
    updateTopicsAndCountry(localSelectedTopics, localCountry);
    nextStep();
  };

  return (
    <div className="space-y-4 p-6">
      <h2 className="text-md font-medium text-foreground">Pick topics you love to read</h2>
      <p className="text-xs text-muted-foreground">
        We'll tailor our newsletter recommendations to match your interests.
      </p>
      <p className="text-xs font-semibold text-foreground mb-2 mt-6">Select at least 3 topics</p>
      <div className="flex flex-wrap gap-2">
        {topicsList.map(topic => (
          <button
            key={topic.id}
            onClick={() => handleTopicSelection(topic.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors
              ${localSelectedTopics.includes(topic.id)
                ? "bg-primary text-primary-foreground"
                : "bg-accent text-accent-foreground hover:bg-primary/10"
              }`}
          >
            {topic.name}
          </button>
        ))}
      </div>
      <div className="mt-6">
        <p className="text-xs font-semibold text-foreground mb-2">Select your country</p>
        <select
          className="w-full p-2 border border-input bg-background dark:bg-content rounded-md text-sm focus:ring-primary focus:border-primary"
          value={localCountry}
          onChange={(e) => setLocalCountry(e.target.value)}
        >
          <option value="" disabled>Country</option>
          <option value="us">United States</option>
          <option value="ca">Canada</option>
          <option value="uk">United Kingdom</option>
          <option value="au">Australia</option>
          <option value="in">India</option>
        </select>
      </div>
      <div className="flex justify-end space-x-2 mt-6">
        <Button
          variant="ghost"
          onClick={previousStep}
          className={secondaryButtonClasses}
          size="sm"
        >
          ← Back
        </Button>
        <Button
          onClick={handleNext}
          className={primaryButtonClasses}
          size="sm"
          disabled={localSelectedTopics.length < 3 || !localCountry}
        >
          Next →
        </Button>
      </div>
    </div>
  );
};