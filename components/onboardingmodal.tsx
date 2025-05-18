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
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [country, setCountry] = useState("");

  // Mock auth context
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
  };

  const handleUsernameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim()) {
      setUserNameError("Username cannot be empty");
      return;
    }

    if (isUsernameValid) {
      // Mock saving username
      console.log("Username saved:", userName);
      nextStep();
    }
  };

  const handleTopicSelection = (topic: string) => {
    if (selectedTopics.includes(topic as never)) {
      setSelectedTopics(selectedTopics.filter(t => t !== topic));
    } else {
      setSelectedTopics([...selectedTopics, topic] as never);
    }
  };

  const completeOnboarding = () => {
    // In a real app, you would mark onboarding as complete in the database
    window.location.href = "/dashboard";
  };

  const topics = [
    { id: "tech", name: "Tech" },
    { id: "business", name: "Business" },
    { id: "marketing", name: "Marketing" },
    { id: "finance", name: "Finance" },
    { id: "crypto", name: "Crypto" },
    { id: "productivity", name: "Productivity" },
    { id: "life_hack", name: "Life Hack" },
    { id: "health", name: "Health" },
    { id: "design", name: "Design" },
    { id: "science", name: "Science" },
    { id: "sports", name: "Sports" },
    { id: "art", name: "Art" },
    { id: "travel", name: "Travel" },
    { id: "fashion", name: "Fashion" },
    { id: "humor", name: "Humor" },
  ];

  const renderProgressBar = () => {
    return (
      <div className="w-full bg-gray-200 h-2 rounded-full mt-2">
        <div
          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${(currentStep / 5) * 100}%` }}
        ></div>
      </div>
    );
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4 p-6" >
            <h2 className="text-2xl font-bold">Let's create your <br></br> Rainbox email address</h2>
            <p className="text-sm text-muted-foreground">
              Create your dedicated Rainbox address for newsletters.
              Subscribe to newsletters with this email address to get
              them on Rainbox.
            </p>

            <form onSubmit={handleUsernameSubmit} className="space-y-4 mt-6">
              <Input
                type="text"
                placeholder="Your name"
                className="w-full mb-2"
              />

              <div className="flex relative">
                <Input
                  type="text"
                  placeholder="username"
                  name="username"
                  value={userName}
                  onChange={handleUsernameChange}
                  className={`text-black focus:outline-none text-sm focus:ring-0 !outline-none rounded-r-none ${!isUsernameValid && userName.trim() && !isCheckingUsername ? "border-red-500" : ""}`}
                  disabled={isCheckingUsername}
                />
                <div className="bg-gray-100 flex items-center px-3 rounded-r-md border border-l-0 border-gray-200">
                  @rainbox.app
                </div>
              </div>

              {userNameError && (
                <p className="text-red-500 text-sm">{userNameError}</p>
              )}

              <Button
                type="submit"
                className="w-full bg-black text-white hover:bg-gray-800 mt-4"
                disabled={isCheckingUsername || !isUsernameValid || !userName.trim()}
              >
                Next →
              </Button>
            </form>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4 p-4">
            <h2 className="text-2xl font-bold">Pick topics you love to read</h2>
            <p className="text-sm text-muted-foreground">
              We'll tailor our newsletter recommendations to match
              your interests
            </p>

            <p className="text-sm font-semibold mb-2 mt-8">Select at least 3 topics</p>

            <div className="flex flex-wrap gap-2">
              {topics.map(topic => (
                <button
                  key={topic.id}
                  onClick={() => handleTopicSelection(topic.id)}
                  className={`px-3 py-1 rounded-full text-sm ${selectedTopics.includes(topic.id as never)
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-800"
                    }`}
                >
                  {topic.name}
                </button>
              ))}
            </div>

            <div className="mt-6">
              <p className="text-sm font-semibold mb-2 mt-8">Select your country</p>
              <select
                className="w-full p-2 border border-gray-200 rounded-md text-sm"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              >
                <option value="" disabled>Country</option>
                <option value="us">United States</option>
                <option value="ca">Canada</option>
                <option value="uk">United Kingdom</option>
                <option value="au">Australia</option>
                <option value="in">India</option>
              </select>
            </div>

            <div className="flex justify-between mt-6">
              <Button
                variant="outline"
                onClick={previousStep}
                className="px-4"
              >
                ← Back
              </Button>
              <Button
                onClick={nextStep}
                className="bg-black text-white hover:bg-gray-800"
                disabled={selectedTopics.length < 3 || !country}
              >
                Next →
              </Button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4 p-4">
            <h2 className="text-2xl font-bold">Bring your existing newsletters from Gmail and Outlook</h2>

            <p className="text-sm text-gray-600 mt-4">
              Sign in to your Gmail or Outlook and select the sender —
              that's it! All existing and future emails from the senders will
              automatically show up in Rainbox.
            </p>

            <div className="space-y-4 mt-6">

              <ConnectionCard
                logo="svg"
                logoAlt="Google Logo"
                title="Connect your Gmail"
                subtitle=""
                actionType="connect"
                onAction={() => { }}
                isConnected={false}
              />
              <ConnectionCard
                logo="/OutlookLogo.png"
                logoAlt="Outlook Logo"
                title="Connect your Outlook"
                subtitle=""
                actionType="connect"
                onAction={() => { }}
                isConnected={false}
              />

              <ConnectionCard
                logo="/OutlookLogo.png"
                logoAlt="Outlook Logo"
                title="Ganesh's Outlook"
                subtitle="ganesh123@outlook.com"
                actionType="disconnect"
                onAction={() => { }}
                isConnected={true}
              />
            </div>

            <div className="flex justify-between mt-6">
              <Button
                variant="outline"
                onClick={previousStep}
                className="px-4"
              >
                ← Back
              </Button>
              <Button
                onClick={nextStep}
                className="bg-black text-white hover:bg-gray-800"
              >
                Do it later →
              </Button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4 p-4">
            <h2 className="text-2xl font-bold">Read your newsletters anywhere, anytime</h2>

            <Image src="/getAppImage.png" alt="Rainbox" className="w-full h-auto" width={400} height={400} />

            <div className="flex justify-between mt-6">
              <Button
                variant="outline"
                onClick={previousStep}
                className="px-4"
              >
                ← Back
              </Button>
              <Button
                onClick={nextStep}
                className="bg-black text-white hover:bg-gray-800"
              >
                Do it later →
              </Button>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4 p-4">
            <div className="flex flex-col items-center justify-center py-6">
              <Image src="/RainboxLogo.png" width={100} height={100} alt="Rainbox" className="h-12 w-12 mb-4" />

              <h2 className="text-xl font-bold">Hey Ganesh,</h2>
              <p className="text-lg mb-6">Welcome to your <Image src="/RainboxLogo.png" width={100} height={100} alt="Rainbox" className="h-6 w-6 inline" />Rainbox</p>

              <div className="w-full">
                <Button
                  onClick={completeOnboarding}
                  className="w-full bg-blue-500 text-white hover:bg-blue-600 py-2"
                >
                  Start Reading →
                </Button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={true} onOpenChange={() => { }}>
      <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-0">
          {renderProgressBar()}
        </DialogHeader>
        {renderStep()}
      </DialogContent>
    </Dialog>
  );
};
