interface HeaderProps {
  onNewSnippet: () => void;
}

export function Header({ onNewSnippet }: HeaderProps) {
  return (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        My Snippets
      </h1>
      <button
        onClick={onNewSnippet}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        New Snippet
      </button>
    </div>
  );
}
