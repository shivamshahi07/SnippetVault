import { useState, useEffect } from "react";
import { ThemeProvider } from "./lib/ThemeContext";
import { ThemeToggle } from "./components/ThemeToggle";
import { SnippetForm } from "./components/Snippets/SnippetForm";
import { Header } from "./components/Header";
import { fetchUserSnippets } from "./lib/auth";
import { supabase } from "./lib/supabase";
import type { Snippet, SnippetInput } from "./lib/supabase";

function AppContent() {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLinkCopied, setShowLinkCopied] = useState<string | null>(null);

  useEffect(() => {
    loadSnippets();
  }, []);

  const loadSnippets = async () => {
    setIsLoading(true);
    setError(null);

    const { data, error } = await fetchUserSnippets();

    if (error) {
      setError(error);
      setIsLoading(false);
      return;
    }

    setSnippets(data || []);
    setIsLoading(false);
  };

  const handleCopyLink = async (snippet: Snippet) => {
    try {
      const websiteDomain =
        import.meta.env.VITE_WEBSITE_URL || "http://localhost:3000";
      const url = `${websiteDomain}/snippet/${snippet.slug}`;
      await navigator.clipboard.writeText(url);
      setShowLinkCopied(snippet.id);
      setTimeout(() => setShowLinkCopied(null), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  const handleSaveSnippet = async (
    snippetInput: Omit<
      SnippetInput,
      "user_id" | "slug" | "is_public" | "view_count"
    >
  ) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        setError("Please log in on the website first");
        return;
      }

      // Generate a slug from the title
      const slug = snippetInput.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      const { data, error } = await supabase
        .from("snippets")
        .insert([
          {
            ...snippetInput,
            user_id: session.user.id,
            slug,
            is_public: true, // Default to public for extension-created snippets
            view_count: 0,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error("Error saving snippet:", error);
        setError("Failed to save snippet");
        return;
      }

      setSnippets([data, ...snippets]);
      setShowForm(false);
    } catch (err) {
      console.error("Error:", err);
      setError("An unexpected error occurred");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-gray-600 dark:text-gray-400">
          Loading snippets...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <div className="text-red-600 dark:text-red-400 mb-4">{error}</div>
        <a
          href={import.meta.env.VITE_WEBSITE_URL || "http://localhost:3000"}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          Open Website to Login
        </a>
      </div>
    );
  }

  return (
    <div className="w-[450px] h-[450px] overflow-auto">
      <div className="container mx-auto px-4 py-8">
        <Header onNewSnippet={() => setShowForm(true)} />

        {showForm ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                New Snippet
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                Cancel
              </button>
            </div>
            <SnippetForm onSubmit={handleSaveSnippet} />
          </div>
        ) : (
          <div className="space-y-4">
            {snippets.map((snippet) => (
              <div
                key={snippet.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow p-4"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {snippet.title}
                  </h3>
                  <button
                    onClick={() => handleCopyLink(snippet)}
                    className="px-2 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-1"
                  >
                    {showLinkCopied === snippet.id ? (
                      <>
                        <span>✓</span>
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <span>🔗</span>
                        <span>Share</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {snippet.language} •{" "}
                  {new Date(snippet.created_at).toLocaleDateString()}
                </div>
                {snippet.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {snippet.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {snippets.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No snippets found. Create your first one!
              </div>
            )}
          </div>
        )}
      </div>
      <ThemeToggle />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
