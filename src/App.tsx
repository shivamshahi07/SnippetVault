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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for auth changes
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

  useEffect(() => {
    // Establish connection with service worker
    const port = chrome.runtime.connect({ name: "popup" });

    return () => {
      port.disconnect();
    };
  }, []);

  const fetchSnippets = async () => {
    const { data, error } = await supabase
      .from("snippets")
      .select("*")
      .eq("user_id", session?.user?.id)
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

  const handleGitHubLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log("Starting GitHub login");

      // Send message to background script to initiate OAuth
      const response = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
          { type: "initiate_github_login" },
          (response) => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
              return;
            }
            if (response?.error) {
              reject(new Error(response.error));
              return;
            }
            resolve(response?.data);
          }
        );
      });

      console.log("Login successful:", response);

      // Get the latest session after successful login
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();
      if (currentSession) {
        setSession(currentSession);
        // Fetch snippets immediately after login
        const { data: snippetsData } = await supabase
          .from("snippets")
          .select("*")
          .eq("user_id", currentSession.user.id)
          .order("created_at", { ascending: false });

        setSnippets(snippetsData || []);
      }
    } catch (error) {
      console.error("Login failed:", error);
      setError(
        error instanceof Error ? error.message : "Failed to login with GitHub"
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold text-center text-gray-900 mb-6">
            Snippet Organizer
          </h1>
          <div className="space-y-4">
            <Auth
              supabaseClient={supabase}
              appearance={{
                theme: ThemeSupa,
                variables: {
                  default: {
                    colors: {
                      brand: "#4F46E5",
                      brandAccent: "#4338CA",
                    },
                  },
                },
              }}
              providers={[]}
              view="sign_in"
              showLinks={true}
              magicLink={true}
              redirectTo={`https://mcaeeokdepphhihomapknljdamhkkabf.chromiumapp.org/callback`}
            />
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Or continue with
                </span>
              </div>
            </div>
            {error && (
              <div className="text-red-500 text-sm text-center mb-4 p-2 bg-red-50 rounded">
                {error}
              </div>
            )}
            <button
              onClick={handleGitHubLogin}
              disabled={isLoading}
              className={`w-full btn-primary flex items-center justify-center gap-2 ${
                isLoading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
              )}
              {isLoading ? "Signing in..." : "Sign in with GitHub"}
            </button>
          </div>
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
