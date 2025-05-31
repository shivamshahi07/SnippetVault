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

export type Snippet = {
  id: string;
  user_id: string;
  title?: string;
  code: string;
  language?: string;
  tags: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
};

export type SnippetInput = Omit<
  Snippet,
  "id" | "user_id" | "created_at" | "updated_at"
>;
