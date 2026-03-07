import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchWithAuth, API_URL } from "../lib/api.ts";
import Card from "../components/Card.tsx";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, ArrowRight, Zap, Flame } from "lucide-react";

export default function ForgeLab() {
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCards, setSelectedCards] = useState<any[]>([]);
  const [forging, setForging] = useState(false);
  const [forgeResult, setForgeResult] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchWithAuth("/cards/my-cards")
      .then(data => {
        setCards(Array.isArray(data.cards) ? data.cards : []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch cards:", err);
        setLoading(false);
      });
  }, []);

  const handleSelectCard = (card: any) => {
    if (selectedCards.find(c => c.id === card.id)) {
      setSelectedCards(selectedCards.filter(c => c.id !== card.id));
    } else if (selectedCards.length < 2) {
      setSelectedCards([...selectedCards, card]);
    }
  };

  const handleForge = async () => {
    if (selectedCards.length === 0) return;

    setForging(true);
    try {
      const res = await fetchWithAuth("/cards/forge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardIds: selectedCards.map(c => c.id),
          type: selectedCards.length === 1 ? "reforge" : "merge"
        })
      });

      setForgeResult(res.card);
      // Remove used cards and add new one
      setCards(prev => [...prev.filter(c => !selectedCards.find(sc => sc.id === c.id)), res.card]);
      setSelectedCards([]);
    } catch (err: any) {
      alert(err.message || "Forge failed.");
    } finally {
      setForging(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Sparkles className="animate-spin text-purple-400" size={32} />
      </div>
    );
  }

  return (
    <div className="pt-8 pb-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-500 mb-2 drop-shadow-[0_0_15px_rgba(192,132,252,0.3)]">
          Forge Lab
        </h1>
        <p className="text-purple-300/80 font-medium">Merge two cards or reforge one into a new ultimate form.</p>
      </div>

      <div className="bg-zinc-900/50 border border-purple-500/20 rounded-3xl p-6 mb-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent pointer-events-none" />

        <div className="flex flex-col md:flex-row items-center justify-center gap-8 relative z-10">
          {/* Slot 1 */}
          <div className="w-full max-w-[240px] aspect-[2/3] rounded-2xl border-2 border-dashed border-purple-500/30 flex items-center justify-center bg-black/40 relative">
            {selectedCards[0] ? (
              <div className="absolute inset-0 p-2">
                <div className="relative w-full h-full pointer-events-none flex items-center justify-center">
                  <Card card={selectedCards[0]} motionEnabled={false} />
                </div>
                <button
                  onClick={() => handleSelectCard(selectedCards[0])}
                  className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg hover:bg-red-400"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="text-center p-4">
                <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-2">
                  <span className="text-purple-400 font-bold">1</span>
                </div>
                <p className="text-sm text-zinc-500 font-medium">Select a Card</p>
              </div>
            )}
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
              <Flame className="text-purple-400" size={24} />
            </div>
            <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">
              {selectedCards.length === 2 ? "Merge" : selectedCards.length === 1 ? "Reforge" : "Awaiting"}
            </span>
          </div>

          {/* Slot 2 */}
          <div className="w-full max-w-[240px] aspect-[2/3] rounded-2xl border-2 border-dashed border-purple-500/30 flex items-center justify-center bg-black/40 relative">
            {selectedCards[1] ? (
              <div className="absolute inset-0 p-2">
                <div className="relative w-full h-full pointer-events-none flex items-center justify-center">
                  <Card card={selectedCards[1]} motionEnabled={false} />
                </div>
                <button
                  onClick={() => handleSelectCard(selectedCards[1])}
                  className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg hover:bg-red-400"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="text-center p-4">
                <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-2">
                  <span className="text-purple-400 font-bold">2</span>
                </div>
                <p className="text-sm text-zinc-500 font-medium">Optional: Select 2nd</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 flex justify-center relative z-10">
          <button
            onClick={handleForge}
            disabled={selectedCards.length === 0 || forging}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white px-8 py-4 rounded-xl font-bold hover:from-purple-500 hover:to-fuchsia-500 transition-all shadow-[0_0_20px_rgba(192,132,252,0.4)] disabled:opacity-50 disabled:shadow-none min-w-[200px]"
          >
            {forging ? (
              <><Sparkles className="animate-spin" size={20} /> Forging...</>
            ) : (
              <><Zap size={20} /> {selectedCards.length === 2 ? "Merge Cards (3 credits)" : "Reforge Card (2 credits)"}</>
            )}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {forgeResult && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-12"
          >
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-emerald-400 mb-2">Forge Successful!</h2>
              <p className="text-zinc-400">A new reflection has awakened.</p>
            </div>
            <div className="flex justify-center">
              <div className="w-full max-w-sm">
                <Link to={`/card/${forgeResult.id}`}>
                  <Card card={forgeResult} motionEnabled={true} />
                </Link>
              </div>
            </div>
            <div className="flex justify-center mt-6">
              <button
                onClick={() => setForgeResult(null)}
                className="text-zinc-400 hover:text-white underline"
              >
                Clear Result
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mb-6">
        <h3 className="text-lg font-bold mb-2">Your Collection</h3>
        <p className="text-sm text-zinc-400">Select cards to place in the Forge.</p>
      </div>

      {cards.length === 0 ? (
        <div className="text-center py-12 bg-zinc-900/30 rounded-2xl border border-white/5">
          <p className="text-zinc-500">You don't have any cards yet.</p>
          <Link to="/create" className="text-purple-400 hover:text-purple-300 underline mt-2 inline-block">Go discover one!</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {cards.map((card) => {
            const isSelected = selectedCards.find(c => c.id === card.id);
            return (
              <div
                key={card.id}
                onClick={() => handleSelectCard(card)}
                className={`cursor-pointer transition-all duration-200 rounded-xl ${isSelected ? 'ring-2 ring-purple-500 scale-95' : 'hover:scale-[1.02]'}`}
              >
                <div className="pointer-events-none">
                  <Card card={card} motionEnabled={false} artOnly={true} />
                </div>
                <div className="mt-2 text-center">
                  <p className="text-xs font-bold text-white truncate px-1">{card.identity || "Unknown"}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
