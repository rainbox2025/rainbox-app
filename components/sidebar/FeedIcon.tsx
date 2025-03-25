import { Feed } from "@/types/data";

export const FeedIcon = ({ feed }: { feed: Feed }) => {
  // Custom feed icons with colors
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
    if (feed.id === 'analytics-india') return 'AI';
    if (feed.id === 'ars-technica') return 'ars';
    if (feed.id === 'entrackr') return 'EN';
    if (feed.id === 'finsmes') return 'FS';
    if (feed.id === 'hacker-news') return 'Y';
    if (feed.id === 'indie-hackers') return 'IH';
    if (feed.id === 'marktechpost') return 'M';
    if (feed.id === 'techcrunch') return 'TC';
    if (feed.id === 'new-stack') return 'TNS';

    return name.substring(0, 2);
  };

  return (
    <div className={`flex-shrink-0 w-5 h-5 flex items-center justify-center text-[8px] font-semibold text-white rounded ${colors[feed.id] || 'bg-gray-400'}`}>
      {getInitials(feed.name)}
    </div>
  );
};