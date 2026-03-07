import { Link, useNavigate, useLocation } from "react-router-dom";
import { User, PlusCircle, Home, Coins, Plus, Flame } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchWithAuth, getAuthToken } from "../lib/api.ts";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<any>(null);
  const [addingCredits, setAddingCredits] = useState(false);

  const fetchUser = () => {
    if (getAuthToken()) {
      fetchWithAuth("/auth/me")
        .then((data) => setUser(data.user))
        .catch(() => setUser(null));
    }
  };

  useEffect(() => {
    fetchUser();
  }, [location.pathname]); // Re-fetch when route changes

  const handleAddCredits = async () => {
    if (addingCredits) return;
    setAddingCredits(true);
    try {
      const data = await fetchWithAuth("/auth/add-credits", { method: "POST" });
      setUser(data.user);
    } catch (err) {
      console.error("Failed to add credits", err);
    } finally {
      setAddingCredits(false);
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-900/80 backdrop-blur-md border-t border-white/10 sm:top-0 sm:bottom-auto sm:border-t-0 sm:border-b">
      <div className="max-w-md mx-auto px-6 h-16 flex items-center justify-between sm:max-w-xl md:max-w-2xl lg:max-w-4xl">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex flex-col items-center gap-1 text-zinc-400 hover:text-white transition-colors sm:flex-row sm:gap-2">
            <Home size={20} />
            <span className="text-[10px] font-medium uppercase tracking-wider sm:text-sm">Home</span>
          </Link>

          <Link to="/create" className="flex flex-col items-center gap-1 text-emerald-400 hover:text-emerald-300 transition-colors sm:flex-row sm:gap-2">
            <PlusCircle size={24} className="sm:w-5 sm:h-5" />
            <span className="text-[10px] font-medium uppercase tracking-wider sm:text-sm">Create</span>
          </Link>

          <Link to="/forge-lab" className="flex flex-col items-center gap-1 text-purple-400 hover:text-purple-300 transition-colors sm:flex-row sm:gap-2">
            <Flame size={24} className="sm:w-5 sm:h-5" />
            <span className="text-[10px] font-medium uppercase tracking-wider sm:text-sm">Forge Lab</span>
          </Link>
        </div>

        <div className="flex items-center gap-4 sm:gap-6">
          {user && (
            <div className="flex items-center gap-2 bg-zinc-800/50 border border-white/10 rounded-full pl-3 pr-1 py-1">
              <Coins size={14} className="text-amber-400" />
              <span className="text-xs font-bold text-white">{user.credits}</span>
              <button
                onClick={handleAddCredits}
                disabled={addingCredits}
                className="bg-zinc-700 hover:bg-zinc-600 text-white rounded-full p-1 transition-colors disabled:opacity-50"
                title="Add Credits"
              >
                <Plus size={12} />
              </button>
            </div>
          )}

          <Link to={user ? "/profile" : "/auth"} className="flex flex-col items-center gap-1 text-zinc-400 hover:text-white transition-colors sm:flex-row sm:gap-2">
            <User size={20} />
            <span className="text-[10px] font-medium uppercase tracking-wider sm:text-sm">
              {user ? "Collection" : "Login"}
            </span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
