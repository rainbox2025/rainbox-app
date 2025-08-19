import React from 'react';
import { SenderType } from "@/types/data";

interface SenderIconProps {
  sender: any;
  width?: number;
  height?: number;
}

export const SenderIcon: React.FC<SenderIconProps> = ({ sender, width = 20, height = 20 }) => {
  const generateColor = (id: string) => {
    if (!id) return 'hsl(210, 20%, 50%)';
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 60%, 45%)`;
  };

  const getInitials = (name: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  if (sender.image_url) {
    return (
      <img
        src={sender.image_url}
        alt={sender.name}
        style={{ width: `${width}px`, height: `${height}px` }}
        className="flex-shrink-0 rounded object-cover"
      />
    );
  }

  return (
    <div
      className="flex-shrink-0 flex items-center justify-center text-[8px] font-semibold text-white rounded"
      style={{
        backgroundColor: generateColor(sender.id),
        width: `${width}px`,
        height: `${height}px`,
      }}
    >
      {getInitials(sender.name)}
    </div>
  );
};