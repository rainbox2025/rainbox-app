import { SenderType } from "@/types/data";

export const SenderIcon = ({ sender }: { sender: SenderType }) => {
  // Custom sender icons with colors
  const colors: Record<string, string> = {
    'analytics-india': 'bg-yellow-500',
    'ars-technica': 'bg-red-500',
    'entrackr': 'bg-blue-500',
    'finsmes': 'bg-gray-600',
    'hacker-news': 'bg-orange-500',
    'indie-hackers': 'bg-gray-700',
    'marktechpost': 'bg-black',
    'techcrunch': 'bg-green-500',
    'new-stack': 'bg-purple-500',
  };

  const getInitials = (name: string) => {
    if (sender.id === 'analytics-india') return 'AI';
    if (sender.id === 'ars-technica') return 'ars';
    if (sender.id === 'entrackr') return 'EN';
    if (sender.id === 'finsmes') return 'FS';
    if (sender.id === 'hacker-news') return 'Y';
    if (sender.id === 'indie-hackers') return 'IH';
    if (sender.id === 'marktechpost') return 'M';
    if (sender.id === 'techcrunch') return 'TC';
    if (sender.id === 'new-stack') return 'TNS';

    return name.substring(0, 2);
  };

  return (
    <div className={`flex-shrink-0 w-5 h-5 flex items-center justify-center text-[8px] font-semibold text-white rounded ${colors[sender.id] || 'bg-gray-400'}`}>
      {getInitials(sender.name)}
    </div>
  );
};