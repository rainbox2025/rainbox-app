import { Feed, Category } from '../types/data';

export const initialCategories: Category[] = [
  { id: 'marketing', name: 'Marketing', count: 150, isExpanded: false },
  { id: 'startup', name: 'Startup', count: 100, isExpanded: false },
  { id: 'product-updates', name: 'Product Updates', count: 100, isExpanded: false },
];

export const initialFeeds: Feed[] = [
  { id: 'analytics-india', name: 'Analytics India Magazine', icon: 'analytics', count: 414, category: 'product-updates' },
  { id: 'ars-technica', name: 'Ars Technica', icon: 'ars', count: 344, category: 'product-updates' },
  { id: 'entrackr', name: 'Entrackr : Latest Pricings', icon: 'entrackr', count: 212, category: 'product-updates' },
  { id: 'finsmes', name: 'FinSMEs', icon: 'finsmes', count: 652, category: 'startup' },
  { id: 'hacker-news', name: 'Hacker News', icon: 'hackernews', count: 1000, category: 'marketing' },
  { id: 'wired', name: 'Wired', icon: 'wired', count: 320, category: 'marketing' },
  { id: 'thenextweb', name: 'The Next Web', icon: 'thenextweb', count: 150, category: 'marketing' },
  { id: 'indie-hackers', name: 'Indie Hackers', icon: 'indiehackers', count: 97, category: '' }, // Root item
  { id: 'marktechpost', name: 'MarkTechPost', icon: 'marktechpost', count: 210, category: '' }, // Root item
  { id: 'techcrunch', name: 'TechCrunch', icon: 'techcrunch', count: 804, category: '' }, // Root item
  { id: 'new-stack', name: 'The New Stack', icon: 'newstack', count: 186, category: '' }, // Root item
];

export const user = {
  email: 'cebe234@rainbox.app',
  plan: 'free',
  usedFeeds: 8,
  totalFeeds: 10,
};