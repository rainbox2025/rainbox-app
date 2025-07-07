export const config = {
  api: {
    baseURL: process.env.NEXT_PUBLIC_API_URL,
  },
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
  },
  emailDomain: process.env.NEXT_PUBLIC_EMAIL_DOMAIN,
};
