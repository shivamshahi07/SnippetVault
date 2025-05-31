import { useState, useEffect, useRef } from "react";
import type { SnippetInput } from "../../lib/supabase";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createEditorState, createEditorView } from "../../lib/editor";
import {
  detectLanguage,
  getFileExtension,
  supportedLanguages,
} from "../../lib/languageUtils";
import { useTheme } from "../../lib/ThemeContext";
import type { EditorView } from "@codemirror/view";

interface SnippetFormProps {
  onSubmit: (
    snippet: Omit<SnippetInput, "user_id" | "slug" | "is_public" | "view_count">
  ) => void;
}

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export function SnippetForm({ onSubmit }: SnippetFormProps) {
  const { theme } = useTheme();
  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [tags, setTags] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [tagInput, setTagInput] = useState("");
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  useEffect(() => {
    if (editorRef.current && !viewRef.current) {
      const state = createEditorState(code, language, false, theme === "dark");
      viewRef.current = createEditorView(editorRef.current, state, (value) => {
        setCode(value);
        const detectedLang = detectLanguage(value);
        if (detectedLang !== language) {
          setLanguage(detectedLang);
        }
      });
    }

    return () => {
      if (viewRef.current) {
        viewRef.current.destroy();
        viewRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (viewRef.current) {
      const state = createEditorState(code, language, false, theme === "dark");
      viewRef.current.setState(state);
    }
  }, [language, theme]);

  const generateSummary = async () => {
    if (!code) return;

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const prompt = `Please provide a brief summary of this code snippet in 2-3 sentences:\n\n${code}`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      setNotes((prev) =>
        prev ? `${prev}\n\nAI Summary: ${text}` : `AI Summary: ${text}`
      );
    } catch (error) {
      console.error("Error generating summary:", error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      title,
      code,
      language,
      tags,
      notes,
    });
    // Reset form
    setTitle("");
    setCode("");
    setLanguage("javascript");
    setTags([]);
    setNotes("");
    setTagInput("");
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title || "snippet"}.${getFileExtension(language)}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Title (optional)
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="input-field dark:bg-gray-800 dark:text-white"
          placeholder="Enter snippet title"
        />
      </div>

      <div>
        <label
          htmlFor="code"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Code *
        </label>
        <div className="h-[400px] border rounded-lg overflow-hidden relative dark:border-gray-700">
          <div ref={editorRef} className="h-full" />
        </div>
      </div>

      <div>
        <label
          htmlFor="language"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Language (auto-detected)
        </label>
        <select
          id="language"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="input-field dark:bg-gray-800 dark:text-white"
        >
          {supportedLanguages.map((lang) => (
            <option key={lang.name} value={lang.name}>
              {lang.displayName}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="tags"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Tags (optional)
        </label>
        <div className="mt-1 flex gap-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyPress={(e) =>
              e.key === "Enter" && (e.preventDefault(), handleAddTag())
            }
            className="block flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="Add a tag"
          />
          <button
            type="button"
            onClick={handleAddTag}
            className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Add
          </button>
        </div>
        {tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-2 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-1 hover:text-blue-900 dark:hover:text-blue-100"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div>
        <label
          htmlFor="notes"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Notes (optional)
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="input-field min-h-[100px] dark:bg-gray-800 dark:text-white"
          placeholder="Add any notes or description"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          className="btn-primary flex-1 dark:bg-blue-600 dark:hover:bg-blue-700"
        >
          Save Snippet
        </button>
        <button
          type="button"
          onClick={handleDownload}
          className="px-4 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:hover:bg-blue-800/50 dark:text-blue-300 transition-colors duration-200 text-sm font-medium"
        >
          Download
        </button>
        <button
          type="button"
          onClick={generateSummary}
          className={`px-4 py-2 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:hover:bg-purple-800/50 dark:text-purple-300 transition-colors duration-200 text-sm font-medium ${
            !code ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {code ? "✨ AI" : "Generating..."}
        </button>
      </div>
    </form>
  );
}
