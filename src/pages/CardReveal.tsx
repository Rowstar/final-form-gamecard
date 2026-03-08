import React, { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchWithAuth, API_URL, getAuthToken } from "../lib/api.ts";
import Card from "../components/Card.tsx";
import CardRevealSequence from "../components/CardRevealSequence.tsx";
import RemixModal from "../components/RemixModal.tsx";
import { motion, AnimatePresence } from "motion/react";
import { Download, Share2, Sparkles, Image as ImageIcon, Wand2, ArrowLeft, Crown } from "lucide-react";
import * as htmlToImage from 'html-to-image';
import { soundManager } from '../lib/soundManager';

export default function CardReveal() {
  const { id } = useParams();
  const [card, setCard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const [motionEnabled, setMotionEnabled] = useState(true);
  const [upgrading, setUpgrading] = useState(false);

  // Cinematic Reveal State
  const [showReveal, setShowReveal] = useState(() => {
    return new URLSearchParams(window.location.search).get('new') === 'true';
  });

  // Remix State
  const [isRemixModalOpen, setIsRemixModalOpen] = useState(false);
  const [remixing, setRemixing] = useState(false);

  // Parent / Lineage State
  const [parentCard, setParentCard] = useState<any>(null);

  useEffect(() => {
    if (getAuthToken()) {
      fetchWithAuth("/auth/me")
        .then((data) => setCurrentUser(data.user))
        .catch(() => { });
    }

    fetchWithAuth(`/cards/${id}`)
      .then((data) => {
        setCard(data.card);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  // Fetch parent card if this is a remix
  useEffect(() => {
    if (card?.parent_id) {
      fetchWithAuth(`/cards/${card.parent_id}`)
        .then(data => setParentCard(data.card))
        .catch(() => console.warn("Failed to fetch parent card"));
    } else {
      setParentCard(null);
    }
  }, [card]);

  const handleUpgrade = async () => {
    if (!currentUser) return;
    if (currentUser.credits < 1) {
      alert("You need at least 1 credit to remove the watermark.");
      return;
    }

    setUpgrading(true);
    try {
      await fetchWithAuth(`/cards/${card.id}/upgrade`, { method: "POST" });
      setCard({ ...card, is_premium: 1 });
      setCurrentUser({ ...currentUser, credits: currentUser.credits - 1 });
    } catch (err: any) {
      alert(err.message || "Failed to upgrade card");
    } finally {
      setUpgrading(false);
    }
  };

  const handleRemix = async (instructions: string, mode: string, chips: string[]) => {
    setRemixing(true);
    setIsRemixModalOpen(false);
    try {
      const res = await fetch(`${API_URL}/cards/${card.id}/remix`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({ instructions, mode, chips }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to remix");

      // Replace URL and state with new card, triggering reveal
      window.history.pushState({}, '', `/card/${result.card.short_id || result.card.id}`);
      setCard(result.card);
      setShowReveal(true);
      if (currentUser) {
        const cost = mode === "ascend" ? 3 : 2;
        setCurrentUser({ ...currentUser, credits: currentUser.credits - cost }); // Ensure UI reflects credit cost
      }
    } catch (err: any) {
      alert(err.message || "Remix failed.");
    } finally {
      setRemixing(false);
    }
  };

  if (loading || remixing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Sparkles className="animate-spin text-emerald-400" size={32} />
        <p className="text-zinc-400 font-medium animate-pulse">
          {remixing ? "Reforging character matrix..." : "Forging your final form..."}
        </p>
      </div>
    );
  }

  if (error || !card) {
    return (
      <div className="text-center mt-24">
        <h2 className="text-2xl font-bold text-red-400 mb-4">Card Not Found</h2>
        <p className="text-zinc-400 mb-8">{error}</p>
        <Link to="/" className="text-emerald-400 hover:text-emerald-300 underline">Return Home</Link>
      </div>
    );
  }

  const handleShare = async () => {
    soundManager.playSound('sfx_share', { volume: 0.6 });
    const url = `${window.location.origin}/card/${card.short_id || card.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Final Form: ${card.identity}`,
          text: `Check out my Ultimate Game Card Form! (${card.tier?.toUpperCase() || 'EPIC'})`,
          url: url,
        });
      } catch (err) {
        console.error("Error sharing", err);
      }
    } else {
      navigator.clipboard.writeText(url);
      alert("Link copied to clipboard!");
    }
  };

  const downloadImage = async (ref: React.RefObject<HTMLDivElement>, filename: string) => {
    if (!ref.current) return;
    try {
      const dataUrl = await htmlToImage.toPng(ref.current, {
        quality: 1.0,
        pixelRatio: 2,
        cacheBust: true,
      });

      const link = document.createElement("a");
      link.download = filename;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Error generating image", err);
      alert("Failed to download image. Please try again.");
    }
  };

  const handleDownloadFront = async () => {
    soundManager.playSound('sfx_save_card', { volume: 0.7 });
    const identityStr = typeof card.identity === 'string' ? card.identity.replace(/\s+/g, '-') : 'Unknown';
    downloadImage(cardRef, `Final-Form-${identityStr}.png`);
  };

  const handleDownloadArt = async () => {
    soundManager.playSound('sfx_save_card', { volume: 0.7 });
    try {
      const imageUrl = `${API_URL.replace('/api', '')}${card.image_url}`;
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      const identityStr = typeof card.identity === 'string' ? card.identity.replace(/\s+/g, '-') : 'Unknown';
      link.download = `Final-Form-${identityStr}-Art.png`;
      link.href = url;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading art", err);
      alert("Failed to download art. Please try again.");
    }
  };

  if (showReveal && card) {
    return (
      <CardRevealSequence
        card={card}
        onComplete={() => setShowReveal(false)}
      />
    );
  }

  return (
    <div className="flex flex-col items-center pt-8 pb-16 relative overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center"
      >
        {card.is_remix ? (
          <div className="flex flex-col items-center">
            <h1 className="text-4xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-400 mb-2">
              Reforged Form
            </h1>
            <p className="text-purple-300 font-medium">An evolved iteration of this character.</p>
          </div>
        ) : (
          <>
            <h1 className="text-4xl font-black uppercase tracking-tighter text-white mb-2">
              Ultimate Form
            </h1>
            <p className="text-emerald-400 font-medium">Your final game card character.</p>
          </>
        )}
      </motion.div>

      <div className="w-full max-w-sm px-4 relative" ref={cardRef}>
        <Card
          card={card}
          isReveal={true}
          motionEnabled={motionEnabled}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="mt-12 flex flex-col gap-4 w-full max-w-sm px-4"
      >
        {!card.is_premium && currentUser && currentUser.id === card.user_id && (
          <button
            onClick={handleUpgrade}
            disabled={upgrading}
            className="flex items-center justify-center gap-2 bg-amber-500/10 border border-amber-500/50 text-amber-400 px-6 py-3 rounded-xl font-bold hover:bg-amber-500/20 transition-colors w-full disabled:opacity-50"
          >
            {upgrading ? (
              <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>Remove Watermark (1 Credit)</>
            )}
          </button>
        )}

        <button
          onClick={handleShare}
          className="flex items-center justify-center gap-2 bg-zinc-900 border border-white/10 text-white px-6 py-3 rounded-xl font-bold hover:bg-zinc-800 transition-colors w-full"
        >
          <Share2 size={18} /> Share Link
        </button>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={handleDownloadFront}
            className="flex items-center justify-center gap-2 bg-emerald-500 text-zinc-950 px-4 py-3 rounded-xl font-bold hover:bg-emerald-400 transition-colors text-sm"
          >
            <Download size={16} /> Save Card
          </button>

          <button
            onClick={handleDownloadArt}
            className="flex items-center justify-center gap-2 bg-zinc-800 text-white px-4 py-3 rounded-xl font-bold hover:bg-zinc-700 transition-colors text-sm"
          >
            <ImageIcon size={16} /> Art Only
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          {card.tier === 'mythic' ? (
            <div className="col-span-2 flex flex-col items-center justify-center gap-1 bg-zinc-950/80 border border-amber-500/20 px-4 py-4 rounded-xl shadow-inner cursor-not-allowed">
              <div className="flex items-center gap-2 font-black text-amber-500/60 uppercase tracking-widest text-sm">
                <Crown size={16} /> Maximum Mythic Quality
              </div>
              <div className="text-[11px] font-bold text-zinc-500">This artifact cannot be reforged further.</div>
            </div>
          ) : (
            <>
              <button
                onClick={() => {
                  if (window.confirm("Spend 3 Credits to Ascend this card to guaranteed Mythic quality?")) {
                    handleRemix("Ascend this character to ultimate mythic quality.", "ascend", []);
                  }
                }}
                className="col-span-2 flex items-center justify-center gap-2 bg-zinc-950 border border-amber-500/50 text-amber-400 px-4 py-4 rounded-xl font-black hover:bg-amber-500/10 transition-all shadow-[0_0_20px_rgba(245,158,11,0.15)] hover:shadow-[0_0_30px_rgba(245,158,11,0.3)]"
              >
                <Crown size={20} /> Ascend to Mythic <span className="text-amber-500/60 font-bold ml-1 text-xs px-2 py-0.5 rounded border border-amber-500/30">3 Credits</span>
              </button>

              <button
                onClick={() => setIsRemixModalOpen(true)}
                className="col-span-2 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white px-4 py-3 rounded-xl font-bold hover:from-purple-500 hover:to-fuchsia-500 transition-colors shadow-[0_0_15px_rgba(147,51,234,0.3)]"
              >
                <Wand2 size={18} /> Normal Reforge <span className="text-white/80 font-bold ml-1 text-xs px-2 py-0.5 rounded border border-white/20 bg-black/20">2 Credits</span>
              </button>
            </>
          )}

          <button
            onClick={() => window.location.href = '/create'}
            className="flex items-center justify-center gap-2 bg-zinc-800 text-white px-4 py-3 rounded-xl font-bold hover:bg-zinc-700 transition-colors text-sm"
          >
            Generate Another
          </button>
          <button
            onClick={() => window.location.href = '/forge-lab'}
            className="flex items-center justify-center gap-2 bg-zinc-800 text-white px-4 py-3 rounded-xl font-bold hover:bg-zinc-700 transition-colors text-sm"
          >
            <Sparkles size={16} /> Forge Lab
          </button>
        </div>

        {/* Lineage / Navigation for Remixed cards */}
        {card.is_remix && parentCard && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="mt-8 pt-6 border-t border-white/10 w-full text-center"
          >
            <p className="text-xs text-zinc-500 mb-3 uppercase tracking-wider font-bold">Evolution Lineage</p>
            <Link
              to={`/card/${parentCard.short_id || parentCard.id}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-white/5 rounded-lg text-sm text-zinc-400 hover:text-white hover:border-white/20 transition-all"
            >
              <ArrowLeft size={14} /> View Previous Form
            </Link>
          </motion.div>
        )}
      </motion.div>

      <RemixModal
        isOpen={isRemixModalOpen}
        onClose={() => setIsRemixModalOpen(false)}
        onRemix={handleRemix}
      />
    </div>
  );
}
