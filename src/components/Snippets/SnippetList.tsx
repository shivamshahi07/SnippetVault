import { useState } from "react";
import type { Snippet } from "../../lib/supabase";
import { SnippetCard } from "./SnippetCard";

interface SnippetListProps {
  snippets: Snippet[];
  onDelete: (id: string) => Promise<void>;
}

export function SnippetList({ snippets, onDelete }: SnippetListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Get unique tags from all snippets
  const allTags = Array.from(
    new Set(snippets.flatMap((snippet) => snippet.tags))
  );

  // Filter snippets based on search term and selected tag
  const filteredSnippets = snippets.filter((snippet) => {
    const matchesSearch =
      searchTerm === "" ||
      snippet.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      snippet.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      snippet.notes?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTag = !selectedTag || snippet.tags.includes(selectedTag);

    return matchesSearch && matchesTag;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search snippets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field"
          />
        </div>
        <div className="w-full sm:w-48">
          <select
            value={selectedTag || ""}
            onChange={(e) => setSelectedTag(e.target.value || null)}
            className="input-field"
          >
            <option value="">All Tags</option>
            {allTags.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filteredSnippets.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No snippets found. Try adjusting your search or create a new snippet.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSnippets.map((snippet) => (
            <SnippetCard
              key={snippet.id}
              snippet={snippet}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
