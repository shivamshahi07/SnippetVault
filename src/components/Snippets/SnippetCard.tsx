import { useState } from "react";
import type { Snippet } from "../../lib/supabase";

interface SnippetCardProps {
  snippet: Snippet;
  onDelete: (id: string) => void;
}

export function SnippetCard({ snippet, onDelete }: SnippetCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(snippet.code);
      // TODO: Add toast notification
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="card">
      <div
        className="flex justify-between items-center cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className="text-lg font-semibold text-gray-800">{snippet.title}</h3>
        <span className="text-sm text-gray-500">
          {new Date(snippet.created_at).toLocaleDateString()}
        </span>
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-4">
          <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto">
            <code className="text-sm text-gray-800">{snippet.code}</code>
          </pre>

          <div className="flex flex-wrap gap-2">
            {snippet.tags.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-primary-100 text-primary-800 rounded-full text-sm"
              >
                {tag}
              </span>
            ))}
          </div>

          {snippet.notes && (
            <p className="text-gray-600 text-sm">{snippet.notes}</p>
          )}

          <div className="flex gap-2">
            <button onClick={handleCopy} className="btn-secondary text-sm">
              Copy Code
            </button>
            <button
              onClick={() => onDelete(snippet.id)}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
