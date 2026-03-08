import { Link, useNavigate, useLocation } from "react-router-dom";
import { User, PlusCircle, Home, Coins, Plus, Flame, Volume2, VolumeX } from "lucide-react";
import { useEffect, useState, ChangeEvent } from "react";
import { fetchWithAuth, getAuthToken } from "../lib/api.ts";
import { soundManager } from "../lib/soundManager";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<any>(null);
  const [addingCredits, setAddingCredits] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(soundManager.isEnabled());
  const [volume, setVolume] = useState(soundManager.getVolume());
  const [showSlider, setShowSlider] = useState(false);

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

  useEffect(() => {
    const handleSoundChange = () => setSoundEnabled(soundManager.isEnabled());
    const handleVolumeChange = (e: any) => setVolume(e.detail.volume);

    window.addEventListener('soundSettingsChanged', handleSoundChange);
    window.addEventListener('volumeChanged', handleVolumeChange);
    return () => {
      window.removeEventListener('soundSettingsChanged', handleSoundChange);
      window.removeEventListener('volumeChanged', handleVolumeChange);
    };
  }, []);

  const handleVolumeInput = (e: ChangeEvent<HTMLInputElement>) => {
    soundManager.setVolume(parseFloat(e.target.value));
  };

  const handleToggleSound = () => {
    soundManager.toggleSound();
  };

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
          <Link
            to="/"
            onMouseEnter={() => soundManager.playSound('sfx_ui_hover', { volume: 0.2 })}
            onClick={() => soundManager.playSound('sfx_ui_click', { volume: 0.3 })}
            className="flex flex-col items-center gap-1 text-zinc-400 hover:text-white transition-colors sm:flex-row sm:gap-2"
          >
            <Home size={20} />
            <span className="text-[10px] font-medium uppercase tracking-wider sm:text-sm">Home</span>
          </Link>

          <Link
            to="/create"
            onMouseEnter={() => soundManager.playSound('sfx_ui_hover', { volume: 0.2 })}
            onClick={() => soundManager.playSound('sfx_ui_click', { volume: 0.3 })}
            className="flex flex-col items-center gap-1 text-emerald-400 hover:text-emerald-300 transition-colors sm:flex-row sm:gap-2"
          >
            <PlusCircle size={24} className="sm:w-5 sm:h-5" />
            <span className="text-[10px] font-medium uppercase tracking-wider sm:text-sm">Create</span>
          </Link>

          <Link
            to="/forge-lab"
            onMouseEnter={() => soundManager.playSound('sfx_ui_hover', { volume: 0.2 })}
            onClick={() => soundManager.playSound('sfx_ui_click', { volume: 0.3 })}
            className="flex flex-col items-center gap-1 text-purple-400 hover:text-purple-300 transition-colors sm:flex-row sm:gap-2"
          >
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

          <div
            className="relative flex items-center"
            onMouseEnter={() => setShowSlider(true)}
            onMouseLeave={() => setShowSlider(false)}
          >
            <button
              onClick={() => {
                soundManager.playSound('sfx_ui_click', { volume: 0.3 });
                handleToggleSound();
                setShowSlider(!showSlider);
              }}
              onMouseEnter={() => soundManager.playSound('sfx_ui_hover', { volume: 0.2 })}
              className="flex flex-col items-center gap-1 text-zinc-400 hover:text-white transition-colors sm:flex-row sm:gap-2 mr-2"
              title={soundEnabled ? "Mute Sound" : "Enable Sound"}
            >
              {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} className="text-zinc-600" />}
              <span className="sr-only">Toggle Sound</span>
            </button>

            {showSlider && (
              <div className="absolute bottom-[100%] left-1/2 -translate-x-1/2 pb-4 sm:bottom-auto sm:top-[100%] sm:pb-0 sm:pt-4 flex origin-bottom sm:origin-top animate-in fade-in zoom-in-95 duration-200 z-[60]">
                <div className="bg-zinc-800 border border-white/10 rounded-lg p-3 shadow-xl pointer-events-auto">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={handleVolumeInput}
                    className="w-24 accent-emerald-500 h-1 bg-zinc-700 rounded-full appearance-none cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>

          <Link
            to={user ? "/profile" : "/auth"}
            onMouseEnter={() => soundManager.playSound('sfx_ui_hover', { volume: 0.2 })}
            onClick={() => soundManager.playSound('sfx_ui_click', { volume: 0.3 })}
            className="flex flex-col items-center gap-1 text-zinc-400 hover:text-white transition-colors sm:flex-row sm:gap-2"
          >
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
