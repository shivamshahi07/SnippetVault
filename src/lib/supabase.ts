import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: "pkce",
    autoRefreshToken: true,
    detectSessionInUrl: true,
    persistSession: true,
    storage: {
      getItem: (key: string) => {
        return chrome.storage.local.get(key).then((result) => result[key]);
      },
      setItem: (key: string, value: string) => {
        return chrome.storage.local.set({ [key]: value });
      },
      removeItem: (key: string) => {
        return chrome.storage.local.remove(key);
      },
    },
  },
});

export interface Snippet {
  id: string;
  created_at: string;
  title: string;
  code: string;
  language: string;
  tags: string[];
  notes: string;
  user_id: string;
  slug: string;
  is_public: boolean;
  view_count: number;
}

export interface SnippetInput {
  title: string;
  code: string;
  language: string;
  tags: string[];
  notes: string;
  user_id: string;
  slug: string;
  is_public: boolean;
  view_count: number;
}
