"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useOnboarding } from "@/context/onboardingContext";

export const TopicsStep = () => {
  const { nextStep, previousStep } = useOnboarding();
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [country, setCountry] = useState("");

  const topics = [
    { id: "tech", name: "Tech" }, { id: "business", name: "Business" },
    { id: "marketing", name: "Marketing" }, { id: "finance", name: "Finance" },
    { id: "crypto", name: "Crypto" }, { id: "productivity", name: "Productivity" },
    { id: "design", name: "Design" }, { id: "science", name: "Science" },
  ];

  const handleTopicSelection = (topicId: string) => {
    setSelectedTopics(prev =>
      prev.includes(topicId) ? prev.filter(t => t !== topicId) : [...prev, topicId]
    );
  };

  return (
    <div className="space-y-4 p-6 overflow-y-scroll custom-scrollbar">
      <h2 className="text-md font-medium text-foreground">Pick topics you love to read</h2>
      <p className="text-xs text-muted-foreground">
        We'll tailor our newsletter recommendations to match your interests.
      </p>
      <p className="text-xs font-semibold text-foreground mb-2 mt-6">Select at least 3 topics</p>
      <div className="flex flex-wrap gap-2">
        {topics.map(topic => (
          <button
            key={topic.id}
            onClick={() => handleTopicSelection(topic.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${selectedTopics.includes(topic.id) ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground hover:bg-primary/10"}`}
          >
            {topic.name}
          </button>
        ))}
      </div>
      <div className="mt-6">
        <p className="text-xs font-semibold text-foreground mb-2">Select your country</p>
        <select
          className="w-full p-2 border border-input bg-content rounded-md text-sm"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
        >
          <option value="" disabled>Country</option>
          <option value="us">United States</option> <option value="ca">Canada</option>
          <option value="uk">United Kingdom</option> <option value="au">Australia</option>
          <option value="in">India</option>
        </select>
      </div>
      <div className="flex justify-between space-x-2 mt-6">
        <Button variant="ghost" onClick={previousStep} size="sm">← Back</Button>
        {/* <Button onClick={nextStep} size="sm" disabled={selectedTopics.length < 3 || !country}>Next →</Button> */}
        <Button onClick={nextStep} size="sm">Next →</Button>
      </div>
    </div>
  );
};