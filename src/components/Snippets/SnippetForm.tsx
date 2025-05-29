import { useState } from "react";
import type { SnippetInput } from "../../lib/supabase";

interface SnippetFormProps {
  onSubmit: (snippet: SnippetInput) => Promise<void>;
}

export function SnippetForm({ onSubmit }: SnippetFormProps) {
  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [tags, setTags] = useState("");
  const [notes, setNotes] = useState("");
  const [language, setLanguage] = useState("javascript");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const snippet: SnippetInput = {
      title,
      code,
      tags: tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      notes,
      language,
    };

    try {
      await onSubmit(snippet);
      // Reset form
      setTitle("");
      setCode("");
      setTags("");
      setNotes("");
      setLanguage("javascript");
    } catch (error) {
      console.error("Error saving snippet:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Title
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="input-field"
          placeholder="Enter snippet title"
          required
        />
      </div>

      <div>
        <label
          htmlFor="code"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Code
        </label>
        <textarea
          id="code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="input-field font-mono min-h-[200px]"
          placeholder="// Paste your code here"
          required
        />
      </div>

      <div>
        <label
          htmlFor="language"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Language
        </label>
        <select
          id="language"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="input-field"
        >
          <option value="javascript">JavaScript</option>
          <option value="typescript">TypeScript</option>
          <option value="python">Python</option>
          <option value="java">Java</option>
          <option value="cpp">C++</option>
          <option value="csharp">C#</option>
          <option value="php">PHP</option>
          <option value="ruby">Ruby</option>
          <option value="swift">Swift</option>
          <option value="go">Go</option>
        </select>
      </div>

      <div>
        <label
          htmlFor="tags"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Tags
        </label>
        <input
          id="tags"
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          className="input-field"
          placeholder="Enter tags separated by commas"
        />
      </div>

      <div>
        <label
          htmlFor="notes"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Notes
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="input-field min-h-[100px]"
          placeholder="Add any notes or description"
        />
      </div>

      <button type="submit" className="btn-primary w-full">
        Save Snippet
      </button>
    </form>
  );
}
