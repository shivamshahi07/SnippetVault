import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "./lib/supabase";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import type { Snippet, SnippetInput } from "./lib/supabase";
import { SnippetList } from "./components/Snippets/SnippetList";
import { SnippetForm } from "./components/Snippets/SnippetForm";
import { Header } from "./components/Layout/Header";
import "./index.css";

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      fetchSnippets();
    }
  }, [session]);

  const fetchSnippets = async () => {
    const { data, error } = await supabase
      .from("snippets")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching snippets:", error);
      return;
    }

    setSnippets(data || []);
  };

  const handleSaveSnippet = async (snippetInput: SnippetInput) => {
    if (!session?.user) return;

    const { data, error } = await supabase
      .from("snippets")
      .insert([{ ...snippetInput, user_id: session.user.id }])
      .select()
      .single();

    if (error) {
      console.error("Error saving snippet:", error);
      return;
    }

    setSnippets([data, ...snippets]);
    setShowForm(false);
  };

  const handleDeleteSnippet = async (id: string) => {
    const { error } = await supabase.from("snippets").delete().match({ id });

    if (error) {
      console.error("Error deleting snippet:", error);
      return;
    }

    setSnippets(snippets.filter((snippet) => snippet.id !== id));
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold text-center text-gray-900 mb-6">
            Snippet Organizer
          </h1>
          <Auth
            supabaseClient={supabase}
            appearance={{ theme: ThemeSupa }}
            providers={["github"]}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Header onNewSnippet={() => setShowForm(true)} />

        {showForm ? (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                New Snippet
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
            <SnippetForm onSubmit={handleSaveSnippet} />
          </div>
        ) : (
          <SnippetList snippets={snippets} onDelete={handleDeleteSnippet} />
        )}
      </div>
    </div>
  );
}

export default App;
