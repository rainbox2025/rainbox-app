import { SenderType } from "@/types/data";

export const SenderIcon = ({ sender }: { sender: SenderType }) => {
  // Function to generate a consistent color based on sender id
  const generateColor = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360; // Get hue between 0-359
    return `hsl(${hue}, 70%, 50%)`; // Adjust saturation & lightness for good contrast
  };

  // Function to generate initials dynamically
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div
      className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-[8px] font-semibold text-white rounded"
      style={{ backgroundColor: generateColor(sender.id) }}
    >
      {getInitials(sender.name)}
    </div>
  );
};
