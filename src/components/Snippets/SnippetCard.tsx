import { useState, useEffect, useRef } from "react";
import type { Snippet } from "../../lib/supabase";
import { createEditorState, createEditorView } from "../../lib/editor";
import { getFileExtension } from "../../lib/languageUtils";
import { useTheme } from "../../lib/ThemeContext";
import type { EditorView } from "@codemirror/view";

interface SnippetCardProps {
  snippet: Snippet;
  onDelete: (id: string) => void;
}

export function SnippetCard({ snippet, onDelete }: SnippetCardProps) {
  const { theme } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showCopied, setShowCopied] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );

  useEffect(() => {
    if (isExpanded && editorRef.current && !viewRef.current) {
      const state = createEditorState(
        snippet.code,
        snippet.language,
        true,
        theme === "dark"
      );
      viewRef.current = createEditorView(editorRef.current, state);
    }

    return () => {
      if (viewRef.current) {
        viewRef.current.destroy();
        viewRef.current = null;
      }
    };
  }, [isExpanded, snippet.code, snippet.language, theme]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(snippet.code);
      setShowCopied(true);
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
      copyTimeoutRef.current = setTimeout(() => {
        setShowCopied(false);
      }, 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([snippet.code], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${snippet.title || "snippet"}.${getFileExtension(
      snippet.language || "txt"
    )}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current !== undefined) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="card dark:bg-gray-800 dark:border-gray-700">
      <div
        className="flex justify-between items-center cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
          {snippet.title}
        </h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {new Date(snippet.created_at).toLocaleDateString()}
        </span>
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-4">
          <div className="relative">
            <div className="absolute top-2 right-2 z-10 flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopy();
                }}
                className="p-1.5 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
                title="Copy code"
              >
                {showCopied ? "✓" : "📋"}
              </button>
            </div>
            <div className="h-[300px] border rounded-lg overflow-hidden relative dark:border-gray-700">
              <div ref={editorRef} className="h-full" />
            </div>
          </div>

          {snippet.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {snippet.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {snippet.notes && (
            <p className="text-gray-600 dark:text-gray-300 text-sm whitespace-pre-wrap">
              {snippet.notes}
            </p>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              className="px-4 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:hover:bg-blue-800/50 dark:text-blue-300 transition-colors duration-200 text-sm font-medium"
            >
              Download
            </button>
            <button
              onClick={() => onDelete(snippet.id)}
              className="px-4 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 dark:bg-red-900/30 dark:hover:bg-red-800/50 dark:text-red-300 transition-colors duration-200 text-sm font-medium"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
