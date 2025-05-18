"use client";
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
} from "@/components/ui/dialog";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/context/authContext";
import Image from "next/image";
import ConnectionCard from "./settings/ConnectionCard";

export const OnboardingModal = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [userName, setUserName] = useState("");
  const [userNameError, setUserNameError] = useState("");
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isUsernameValid, setIsUsernameValid] = useState(true);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [country, setCountry] = useState("");

  const { user } = useAuth ? useAuth() : { user: { id: "mock-user-id" } };
  const supabase = createClient ? createClient() : {};

  const nextStep = () => {
    setCurrentStep(prev => prev + 1);
  };

  const previousStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleUsernameChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUsername = e.target.value;
    setUserName(newUsername);
    setUserNameError("");
    if (newUsername.trim().length > 0) {
      setIsUsernameValid(true);
    } else {
      setIsUsernameValid(false);
    }
  };

  const handleUsernameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim()) {
      setUserNameError("Username cannot be empty");
      setIsUsernameValid(false);
      return;
    }
    if (!isUsernameValid) {
      setUserNameError("Username is not valid.");
      return;
    }
    console.log("Username saved:", userName);
    nextStep();
  };

  const handleTopicSelection = (topicId: string) => {
    setSelectedTopics(prevSelectedTopics =>
      prevSelectedTopics.includes(topicId)
        ? prevSelectedTopics.filter(t => t !== topicId)
        : [...prevSelectedTopics, topicId]
    );
  };

  const completeOnboarding = () => {
    console.log("Onboarding complete!");
    window.location.href = "/dashboard";
  };

  const topics = [
    { id: "tech", name: "Tech" }, { id: "business", name: "Business" },
    { id: "marketing", name: "Marketing" }, { id: "finance", name: "Finance" },
    { id: "crypto", name: "Crypto" }, { id: "productivity", name: "Productivity" },
    { id: "life_hack", name: "Life Hack" }, { id: "health", name: "Health" },
    { id: "design", name: "Design" }, { id: "science", name: "Science" },
    { id: "sports", name: "Sports" }, { id: "art", name: "Art" },
    { id: "travel", name: "Travel" }, { id: "fashion", name: "Fashion" },
    { id: "humor", name: "Humor" },
  ];

  const renderProgressBar = () => {
    return (
      <div className="w-[90%] mb-5 bg-gray-200 dark:bg-gray-700 h-2 rounded-full">
        <div
          className="bg-primary h-2 rounded-full transition-all duration-300"
          style={{ width: `${(currentStep / 5) * 100}%` }}
        ></div>
      </div>
    );
  };

  const primaryButtonClasses = "bg-primary text-primary-foreground hover:bg-primary/80";
  const secondaryButtonClasses = "text-muted-foreground hover:bg-accent";

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4 p-6">
            <h2 className="text-md font-medium text-foreground">Let's create your <br /> Rainbox email address</h2>
            <p className="text-xs text-muted-foreground">
              Create your dedicated Rainbox address for newsletters.
              Subscribe to newsletters with this email address to get
              them on Rainbox.
            </p>
            <form onSubmit={handleUsernameSubmit} className="space-y-4 mt-6">
              <Input
                type="text"
                placeholder="Your name"
                className="w-full text-sm"
              />
              <div className="flex relative">
                <Input
                  type="text"
                  placeholder="username"
                  name="username"
                  value={userName}
                  onChange={handleUsernameChange}
                  className={`w-full text-black dark:text-white dark:bg-neutral-800 focus:outline-none text-sm focus:ring-0 !outline-none rounded-r-none ${!isUsernameValid && userName.trim() && !isCheckingUsername ? "border-red-500" : "border-input"}`}
                  disabled={isCheckingUsername}
                />
                <div className="bg-gray-100 dark:bg-neutral-800 flex items-center px-3 rounded-r-md border border-l-0 border-input text-sm text-muted-foreground">
                  @rainbox.app
                </div>
              </div>
              {userNameError && (
                <p className="text-red-500 text-xs">{userNameError}</p>
              )}
              <Button
                type="submit"
                className={`${primaryButtonClasses} w-full mt-4`}
                size="sm"
                disabled={isCheckingUsername || !isUsernameValid || !userName.trim()}
              >
                Next →
              </Button>
            </form>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4 p-6">
            <h2 className="text-md font-medium text-foreground">Pick topics you love to read</h2>
            <p className="text-xs text-muted-foreground">
              We'll tailor our newsletter recommendations to match
              your interests
            </p>
            <p className="text-xs font-semibold text-foreground mb-2 mt-6">Select at least 3 topics</p>
            <div className="flex flex-wrap gap-2">
              {topics.map(topic => (
                <button
                  key={topic.id}
                  onClick={() => handleTopicSelection(topic.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors
                    ${selectedTopics.includes(topic.id)
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
                className="w-full p-2 border border-input bg-background rounded-md text-sm focus:ring-primary focus:border-primary"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              >
                <option value="" disabled>Country</option>
                <option value="us">United States</option> <option value="ca">Canada</option>
                <option value="uk">United Kingdom</option> <option value="au">Australia</option>
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
                onClick={nextStep}
                className={primaryButtonClasses}
                size="sm"
                disabled={selectedTopics.length < 3 || !country}
              >
                Next →
              </Button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4 p-6">
            <h2 className="text-md font-medium text-foreground">Bring your existing newsletters from Gmail and Outlook</h2>
            <p className="text-xs text-muted-foreground mt-2">
              Sign in to your Gmail or Outlook and select the sender —
              that's it! All existing and future emails from the senders will
              automatically show up in Rainbox.
            </p>
            <div className="space-y-3 mt-6">
              <ConnectionCard
                logo="svg"
                logoAlt="Google Logo"
                title="Connect your Gmail"
                subtitle=""
                actionType="connect"
                onAction={() => { console.log("Connect Gmail clicked") }}
                isConnected={false}
              />
              <ConnectionCard
                logo="/OutlookLogo.png"
                logoAlt="Outlook Logo"
                title="Connect your Outlook"
                subtitle=""
                actionType="connect"
                onAction={() => { console.log("Connect Outlook clicked") }}
                isConnected={false}
              />
              <ConnectionCard
                logo="/OutlookLogo.png"
                logoAlt="Outlook Logo"
                title="Ganesh's Outlook"
                subtitle="ganesh123@outlook.com"
                actionType="disconnect"
                onAction={() => { console.log("Disconnect Outlook clicked") }}
                isConnected={true}
              />
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
                onClick={nextStep}
                className={primaryButtonClasses}
                size="sm"
              >
                Do it later →
              </Button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4 p-6">
            <h2 className="text-md font-medium text-foreground">Read your newsletters anywhere, anytime</h2>
            <Image src="/getAppImage.png" alt="Rainbox App Showcase" className="w-full h-auto rounded-md mt-4" width={350} height={300} style={{ aspectRatio: "350/300", objectFit: "contain" }} />
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
                onClick={nextStep}
                className={primaryButtonClasses}
                size="sm"
              >
                Do it later →
              </Button>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4 p-6">
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <Image src="/RainboxLogo.png" width={48} height={48} alt="Rainbox Logo" className="mb-4" />
              <h2 className="text-md font-medium text-foreground">Hey {userName || "User"},</h2>
              <p className="text-xs text-muted-foreground mt-1 mb-6 flex items-center justify-center">
                Welcome to your
                <Image src="/RainboxLogo.png" width={16} height={16} alt="Rainbox" className="inline h-4 w-4 mx-0.5" />
                Rainbox
              </p>
              <Button
                onClick={completeOnboarding}
                className={`${primaryButtonClasses} w-full py-2.5`}
                size="sm"
              >
                Start Reading →
              </Button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const [isOpen, setIsOpen] = useState(true);
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      console.log("Onboarding modal closed by user interaction.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm bg-background rounded-lg shadow-xl border border-border p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0 border-b border-border">
          {renderProgressBar()}
        </DialogHeader>
        {renderStep()}
      </DialogContent>
    </Dialog>
  );
};