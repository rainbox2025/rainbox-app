import React, { useCallback, useEffect, useState } from 'react';
import {
  CreditCardIcon as BillingIcon,
  SpeakerWaveIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

export default function PreferencesTab() {
  const [fontSize, setFontSize] = useState('small');
  const [aiPrompt, setAiPrompt] = useState('Summarize this in a concise manner');
  const [selectedVoice, setSelectedVoice] = useState('Default');
  const [voiceSpeed, setVoiceSpeed] = useState('1.0');
  const [voiceList, setVoiceList] = useState<SpeechSynthesisVoice[]>([]);
  const [isVoicesLoaded, setIsVoicesLoaded] = useState(false);



  // Function to load available voices
  const loadVoices = useCallback(() => {
    const availableVoices = window.speechSynthesis.getVoices();
    if (availableVoices.length > 0) {
      setVoiceList(availableVoices);
      setIsVoicesLoaded(true);
    }
  }, []);

  // Initialize voices when component mounts
  useEffect(() => {
    // Some browsers need a small delay to properly initialize speech synthesis
    const timer = setTimeout(() => {
      loadVoices();
    }, 100);

    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      clearTimeout(timer);
      // Cancel any ongoing speech when component unmounts
      window.speechSynthesis.cancel();
    };
  }, [loadVoices]);

  // Sample voice speeds as options
  const speedOptions = [
    { value: "0.5", label: "0.5x (Slow)" },
    { value: "0.75", label: "0.75x" },
    { value: "1.0", label: "1.0x (Normal)" },
    { value: "1.25", label: "1.25x" },
    { value: "1.5", label: "1.5x" },
    { value: "1.75", label: "1.75x" },
    { value: "2.0", label: "2.0x (Fast)" }
  ];

  const playVoiceDemo = useCallback(() => {
    // Cancel any ongoing speech first
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(
      "This is a preview of your selected voice and speed settings."
    );

    // Set speech rate
    utterance.rate = parseFloat(voiceSpeed);

    // Find appropriate voice based on selection
    if (voiceList.length > 0) {
      let selectedVoiceObj;

      switch (selectedVoice) {
        case "Female":
          selectedVoiceObj = voiceList.find(
            voice => voice.name.toLowerCase().includes("female") ||
              (!voice.name.toLowerCase().includes("male") && voice.name.includes("Google") && !voice.name.includes("UK"))
          );
          break;
        case "Male":
          selectedVoiceObj = voiceList.find(
            voice => voice.name.toLowerCase().includes("male") && !voice.name.toLowerCase().includes("female")
          );
          break;
        case "British":
          selectedVoiceObj = voiceList.find(
            voice => voice.name.includes("UK") || voice.name.includes("British")
          );
          break;
        case "Australian":
          selectedVoiceObj = voiceList.find(
            voice => voice.name.includes("Australian") || voice.name.includes("AU")
          );
          break;
        default:
          // Default voice - typically first in the list or a neutral voice
          selectedVoiceObj = voiceList.find(
            voice => voice.lang.startsWith("en-")
          ) || voiceList[0];
      }

      if (selectedVoiceObj) {
        utterance.voice = selectedVoiceObj;
      }
    }

    // Play the speech
    window.speechSynthesis.speak(utterance);
  }, [selectedVoice, voiceSpeed, voiceList]);



  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-1">Preferences</h2>
        <p className="text-sm text-muted-foreground">Customize your experience</p>
      </div>

      <div className="space-y-8">
        {/* Display Settings */}
        <div className="space-y-4">
          <h3 className="font-medium">Display Settings</h3>

          <div className="flex items-center justify-between">
            <label htmlFor="font-size" className="text-sm font-medium">Font Size</label>
            <select
              id="font-size"
              value={fontSize}
              onChange={(e) => setFontSize(e.target.value)}
              className="w-40 p-sm border border-border rounded-md bg-content focus:outline-none focus:ring-2 focus:ring-ring text-sm"
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>
        </div>

        <hr className="border-border" style={{ margin: "1rem 0" }} />

        {/* AI Summary */}
        <div className="space-y-4 !m-0" >
          <div className='flex items-center gap-1'>
            <h3 className="font-medium">AI Summary </h3>
            <SparklesIcon className="h-4 w-4" />
          </div>
          <div>
            <label htmlFor="ai-prompt" className="block text-sm font-medium mb-1">Default prompt for summaries</label>
            <p className="text-xs text-muted-foreground mb-2">
              {250 - (aiPrompt?.length || 0)} characters remaining
            </p>
            <textarea
              id="ai-prompt"
              value={aiPrompt}
              onChange={(e) => {
                if (e.target.value.length <= 250) {
                  setAiPrompt(e.target.value);
                }
              }}
              maxLength={250}
              rows={3}
              className="w-full p-sm border border-border rounded-md bg-content focus:outline-none focus:ring-2 focus:ring-ring text-sm"
            />
            <p className="text-xs text-muted-foreground">
              This prompt will be used when generating AI summaries of your content.
            </p>

          </div>
        </div>

        <hr className="border-border" style={{ margin: "1rem 0" }} />

        {/* Text to Speech */}
        <div className="space-y-4 !m-0">
          <h3 className="font-medium flex items-center gap-2">
            Text to Speech
            <SpeakerWaveIcon className="h-5 w-5" />
          </h3>

          {/* Voice Selection */}
          <div className="flex items-center justify-between">
            <label htmlFor="voice" className="text-sm font-medium">Voice</label>
            <select
              id="voice"
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
              className="w-40 p-sm border border-border rounded-md bg-content focus:outline-none focus:ring-2 focus:ring-ring text-sm"
            >
              <option value="Default">Default</option>
              <option value="Female">Female</option>
              <option value="Male">Male</option>
              <option value="British">British</option>
              <option value="Australian">Australian</option>
            </select>
          </div>

          {/* Voice Speed - Now as Dropdown */}
          <div className="flex items-center justify-between">
            <label htmlFor="speed" className="text-sm font-medium">Speed</label>
            <select
              id="speed"
              value={voiceSpeed}
              onChange={(e) => setVoiceSpeed(e.target.value)}
              className="w-40 p-sm border border-border rounded-md bg-content focus:outline-none focus:ring-2 focus:ring-ring text-sm"
            >
              {speedOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Preview Section */}
          <div className="mt-4 p-4 border border-border rounded-md bg-sidebar">
            <div className="flex flex-col items-center gap-2">
              <p className="text-sm text-center">Preview your selected voice and speed</p>
              <button
                onClick={playVoiceDemo}
                disabled={!isVoicesLoaded}
                className="flex items-center gap-2 px-4 py-2 bg-hovered hover:bg-card text-sm rounded-md transition-colors"
              >
                Play Demo
                <SpeakerWaveIcon className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3 text-xs text-center text-muted-foreground">
              Sample text: "This is a preview of your selected voice and speed settings."
            </div>
          </div>
        </div>
      </div >
    </div >
  )
}
