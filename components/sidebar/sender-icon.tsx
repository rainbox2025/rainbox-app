import React from 'react';
import { SenderType } from "@/types/data";

export const SenderIcon: React.FC<{ sender: SenderType }> = ({ sender }) => {
  // Function to generate a consistent color based on the sender's ID.
  // This ensures the color is the same every time for the same sender.
  const generateColor = (id: string) => {
    if (!id) return 'hsl(210, 20%, 50%)'; // Fallback color

    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360; // Generate a hue value between 0 and 359
    return `hsl(${hue}, 60%, 45%)`; // Use HSL for a wide range of pleasant colors
  };

  // Function to get the initials from a name (e.g., "John Doe" -> "JD").
  const getInitials = (name: string) => {
    if (!name) return "?";

    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  // Conditionally render the image if an image_url exists
  if (sender.image_url) {
    return (
      <img
        src={sender.image_url}
        alt={sender.name}
        // Apply the exact same size and shape classes for visual consistency
        className="flex-shrink-0 w-5 h-5 rounded object-cover"
      />
    );
  }

  // Otherwise, render the colored initials icon with the desired design
  return (
    <div
      className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-[8px] font-semibold text-white rounded"
      style={{ backgroundColor: generateColor(sender.id) }}
    >
      {getInitials(sender.name)}
    </div>
  );
};