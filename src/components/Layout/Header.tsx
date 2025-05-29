import { supabase } from "../../lib/supabase";

interface HeaderProps {
  onNewSnippet: () => void;
}

export function Header({ onNewSnippet }: HeaderProps) {
  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <header className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold text-gray-900">Snippet Organizer</h1>
      <div className="flex gap-2">
        <button onClick={onNewSnippet} className="btn-primary">
          New Snippet
        </button>
        <button onClick={handleSignOut} className="btn-secondary">
          Sign Out
        </button>
      </div>
    </header>
  );
}
