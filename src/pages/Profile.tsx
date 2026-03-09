import { useEffect, useState } from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import { fetchWithAuth, clearAuthToken, API_URL } from "../lib/api.ts";
import Card from "../components/Card.tsx";
import { motion } from "motion/react";
import { LogOut, Sparkles, Zap, Share2, PlusCircle, Swords, Globe } from "lucide-react";
import { soundManager } from '../lib/soundManager';

export default function Profile() {
  const { id } = useParams();
  const [user, setUser] = useState<any>(null);
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isOwner, setIsOwner] = useState(false);
  const navigate = useNavigate();

  // Lineage Filter State
  const [filterMode, setFilterMode] = useState<'canon' | 'all'>('canon');

  // Compute filtered cards based on lineage
  const filteredCards = filterMode === 'all'
    ? cards
    : cards.filter(c => {
      if (c.is_featured_version === 1) return true;
      const isRoot = !c.root_card_id || c.root_card_id === c.id || c.version_number === 1;
      const rootId = c.root_card_id || c.id;
      const hasFeaturedSibling = cards.some(sibling => (sibling.root_card_id === rootId || sibling.id === rootId) && sibling.is_featured_version === 1);
      return isRoot && !hasFeaturedSibling;
    });

  useEffect(() => {
    setLoading(true);
    setError("");

    if (id) {
      // Public profile view
      fetch(`${API_URL}/cards/user/${id}`, { credentials: "include" })
        .then(res => res.json())
        .then(data => {
          if (data.error) throw new Error(data.error);
          setUser(data.user);
          setCards(Array.isArray(data.cards) ? data.cards : []);

          // Check if logged in user is the owner
          fetchWithAuth("/auth/me")
            .then(meData => {
              setIsOwner(meData.user.id === id);
            })
            .catch(() => setIsOwner(false))
            .finally(() => setLoading(false));
        })
        .catch(err => {
          console.error("Public profile fetch error:", err);
          setError("Profile not found");
          setLoading(false);
        });
    } else {
      // My profile view
      Promise.all([
        fetchWithAuth("/auth/me"),
        fetchWithAuth("/cards/my-cards")
      ])
        .then(([userData, cardsData]) => {
          setUser(userData.user);
          setCards(Array.isArray(cardsData.cards) ? cardsData.cards : []);
          setIsOwner(true);
          setLoading(false);
        })
        .catch((err) => {
          if (err.message !== "User not found") {
            console.error("Profile fetch error:", err);
          }
          clearAuthToken();
          navigate("/auth");
        });
    }
  }, [id, navigate]);

  const handleLogout = () => {
    clearAuthToken();
    navigate("/");
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/profile/${user.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${user.email.split('@')[0]}'s Final Forms`,
          text: "Check out my Final Forms!",
          url: url,
        });
      } catch (err) {
        console.error("Error sharing", err);
      }
    } else {
      navigator.clipboard.writeText(url);
      alert("Profile link copied to clipboard!");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Sparkles className="animate-spin text-emerald-400" size={32} />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="text-center mt-24">
        <h2 className="text-2xl font-bold text-red-400 mb-4">Profile Not Found</h2>
        <p className="text-zinc-400 mb-8">{error}</p>
        <Link to="/" className="text-emerald-400 hover:text-emerald-300 underline">Return Home</Link>
      </div>
    );
  }

  return (
    <div className="pt-8 pb-16">
      <div className="flex justify-between items-center mb-12 bg-zinc-900/50 p-6 rounded-3xl border border-white/5">
        <div>
          <h1 className="text-2xl font-bold mb-1">{isOwner ? "Your Profile" : `${user.email.split('@')[0]}'s Profile`}</h1>
          {isOwner && <p className="text-zinc-400 text-sm">{user.email}</p>}
        </div>
        <div className="flex flex-col items-end gap-3">
          {isOwner ? (
            <>
              <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-4 py-2 rounded-xl border border-emerald-500/20">
                <Zap size={16} />
                <span className="font-bold">{user.credits} Credits</span>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => { soundManager.playSound('sfx_ui_click', { volume: 0.3 }); handleShare(); }}
                  onMouseEnter={() => soundManager.playSound('sfx_ui_hover', { volume: 0.2 })}
                  className="text-sm text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
                >
                  <Share2 size={14} /> Share Profile
                </button>
                <button
                  onClick={() => { soundManager.playSound('sfx_ui_click', { volume: 0.3 }); handleLogout(); }}
                  onMouseEnter={() => soundManager.playSound('sfx_ui_hover', { volume: 0.2 })}
                  className="text-sm text-zinc-500 hover:text-red-400 flex items-center gap-1 transition-colors"
                >
                  <LogOut size={14} /> Logout
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={() => { soundManager.playSound('sfx_ui_click', { volume: 0.3 }); handleShare(); }}
              onMouseEnter={() => soundManager.playSound('sfx_ui_hover', { volume: 0.2 })}
              className="flex items-center gap-2 bg-zinc-800 text-white px-4 py-2 rounded-xl font-bold hover:bg-zinc-700 transition-colors text-sm"
            >
              <Share2 size={16} /> Share
            </button>
          )}
        </div>
      </div>

      <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold">{isOwner ? "Your Collection" : "Collection"}</h2>
            <span className="text-sm text-zinc-500">{filteredCards.length} Cards</span>
          </div>

          {cards.length > 0 && (
            <div className="flex bg-zinc-900/80 p-1 rounded-lg border border-white/5 w-fit mt-1">
              <button
                onClick={() => { soundManager.playSound('sfx_ui_click', { volume: 0.2 }); setFilterMode('canon'); }}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${filterMode === 'canon' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                Main Canon
              </button>
              <button
                onClick={() => { soundManager.playSound('sfx_ui_click', { volume: 0.2 }); setFilterMode('all'); }}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${filterMode === 'all' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                All Variants
              </button>
            </div>
          )}
        </div>
        {isOwner && cards.length >= 2 && (
          <Link
            to="/duel"
            onMouseEnter={() => soundManager.playSound('sfx_ui_hover', { volume: 0.2 })}
            onClick={() => soundManager.playSound('sfx_ui_click', { volume: 0.3 })}
            className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white px-4 py-2 rounded-xl font-bold shadow-[0_0_15px_rgba(239,68,68,0.3)] transition-all text-sm uppercase tracking-wider"
          >
            <Swords size={16} /> Enter Arena
          </Link>
        )}
      </div>

      {cards.length === 0 ? (
        <div className="text-center py-24 bg-zinc-900/30 rounded-3xl border border-white/5 border-dashed">
          <Sparkles className="mx-auto text-zinc-600 mb-4" size={32} />
          <h3 className="text-lg font-medium text-zinc-300 mb-2">No cards yet</h3>
          {isOwner ? (
            <>
              <p className="text-zinc-500 mb-6">It's time to discover your first Final Form.</p>
              <Link
                to="/create"
                onClick={() => soundManager.playSound('sfx_ui_click', { volume: 0.4 })}
                onMouseEnter={() => soundManager.playSound('sfx_ui_hover', { volume: 0.2 })}
                className="inline-flex items-center gap-2 bg-emerald-500 text-zinc-950 px-6 py-3 rounded-xl font-bold hover:bg-emerald-400 transition-colors"
              >
                <PlusCircle size={20} />
                Create Card
              </Link>
            </>
          ) : (
            <p className="text-zinc-500">This user hasn't created any cards yet.</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mt-6">
          {filteredCards.map((card, i) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="relative"
            >
              {card.is_featured_version === 1 && (
                <div className="absolute -top-3 -right-3 bg-amber-500 text-black px-3 py-1 rounded-full z-10 flex items-center gap-1 shadow-lg font-black text-[10px] uppercase tracking-wider">
                  Featured
                </div>
              )}
              {card.version_number > 1 && card.is_featured_version !== 1 && (
                <div className="absolute -top-3 -right-3 bg-zinc-800 text-purple-400 px-3 py-1 rounded-full z-10 flex items-center gap-1 border border-purple-500/30 shadow-lg font-bold text-[10px] uppercase tracking-wider">
                  Variant v{card.version_number}
                </div>
              )}
              {card.is_public === 1 && (
                <div title="Publicly Visible" className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-emerald-400 p-1.5 rounded-full z-10 border border-emerald-500/30 shadow-lg">
                  <Globe size={14} />
                </div>
              )}
              <Link
                to={`/card/${card.short_id || card.id}`}
                onClick={() => soundManager.playSound('sfx_ui_click', { volume: 0.3 })}
                className="block transition-transform hover:scale-[1.02]"
              >
                <Card card={card} />
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
