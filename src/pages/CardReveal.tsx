import React, { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchWithAuth, API_URL, getAuthToken } from "../lib/api.ts";
import Card from "../components/Card.tsx";
import CardRevealSequence from "../components/CardRevealSequence.tsx";
import RemixModal from "../components/RemixModal.tsx";
import ShowcaseModal from "../components/ShowcaseModal.tsx";
import ExportModal from "../components/ExportModal.tsx";
import { motion, AnimatePresence } from "motion/react";
import { Download, Share2, Sparkles, Image as ImageIcon, Wand2, ArrowLeft, ArrowRight, Crown, GitBranch, Star, Globe } from "lucide-react";
import * as htmlToImage from 'html-to-image';
import { soundManager } from '../lib/soundManager';

export default function CardReveal() {
  const { id } = useParams();
  const [card, setCard] = useState<any>(null);
  const [relationships, setRelationships] = useState<any>({});
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

  // Showcase / Privacy State
  const [isShowcaseModalOpen, setIsShowcaseModalOpen] = useState(false);

  // Export State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Parent / Lineage State
  const [parentCard, setParentCard] = useState<any>(null);

  // Compare View State
  const [compareCandidate, setCompareCandidate] = useState<any>(null);
  const [showCompareView, setShowCompareView] = useState(false);

  // Lineage Strip State
  const [lineage, setLineage] = useState<any[]>([]);
  const [fetchingLineage, setFetchingLineage] = useState(false);

  useEffect(() => {
    if (getAuthToken()) {
      fetchWithAuth("/auth/me")
        .then((data) => setCurrentUser(data.user))
        .catch(() => { });
    }

    fetchWithAuth(`/cards/${id}`)
      .then((data) => {
        setCard(data.card);
        setRelationships(data.relationships || {});
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

    // Fetch full lineage
    if (card?.id) {
      setFetchingLineage(true);
      fetchWithAuth(`/cards/${card.short_id || card.id}/lineage`)
        .then(data => {
          setLineage(data.variants || []);
          setFetchingLineage(false);
        })
        .catch(() => {
          console.warn("Failed to fetch lineage");
          setFetchingLineage(false);
        });
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

  const handleSetFeatured = async () => {
    try {
      soundManager.playSound('sfx_ui_click', { volume: 0.5 });
      await fetchWithAuth(`/cards/${card.short_id || card.id}/feature`, { method: "POST" });
      setLineage(lineage.map(v => ({ ...v, is_featured_version: v.id === card.id ? 1 : 0 })));
      setCard({ ...card, is_featured_version: 1 });
    } catch (err: any) {
      console.warn("Failed to set featured:", err);
    }
  };

  const handleRemix = async (instructions: string, mode: string, chips: string[], preservationLocks: string[] = [], variationStrength: string = "Subtle") => {
    setRemixing(true);
    setIsRemixModalOpen(false);
    try {
      const res = await fetch(`${API_URL}/cards/${card.id}/remix`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({ instructions, mode, chips, preservationLocks, variationStrength }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to remix");

      window.history.pushState({}, '', `/card/${result.card.short_id || result.card.id}`);
      setCompareCandidate(result.card);
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

  if (showReveal && (compareCandidate || card)) {
    return (
      <CardRevealSequence
        card={compareCandidate || card}
        onComplete={() => {
          setShowReveal(false);
          if (compareCandidate) {
            setShowCompareView(true);
          }
        }}
      />
    );
  }

  if (showCompareView && compareCandidate) {
    let deltaSummary: any = null;
    try {
      if (typeof compareCandidate.generation_delta === 'string') {
        deltaSummary = JSON.parse(compareCandidate.generation_delta);
      } else {
        deltaSummary = compareCandidate.generation_delta;
      }
    } catch (e) { }

    return (
      <div className="flex flex-col items-center pt-8 pb-16 relative overflow-hidden px-4 md:px-12 w-full max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center">
          <h1 className="text-3xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 mb-2">
            Reforge Complete
          </h1>
          <p className="text-zinc-400 font-medium">Compare the original artifact with its new evolution.</p>
        </motion.div>

        <div className="flex flex-col md:flex-row gap-8 lg:gap-16 items-center justify-center w-full">
          {/* Original Card */}
          <div className="flex flex-col items-center w-full max-w-sm">
            <p className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4">Original</p>
            <div className="opacity-80 scale-95 transition-all hover:opacity-100 hover:scale-100 w-full">
              <Card card={card} isReveal={false} motionEnabled={false} />
            </div>
          </div>

          {/* VS Divider */}
          <div className="hidden md:flex flex-col items-center justify-center text-zinc-600">
            <Sparkles size={32} className="text-purple-500/50 mb-2 opacity-50" />
            <div className="w-px h-32 bg-gradient-to-b from-transparent via-white/10 to-transparent"></div>
          </div>

          {/* New Candidate Card */}
          <div className="flex flex-col items-center w-full max-w-sm">
            <p className="text-sm font-bold text-purple-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Crown size={16} /> New Evolution
            </p>
            <div className="shadow-[0_0_30px_rgba(168,85,247,0.2)] rounded-2xl w-full">
              <Card card={compareCandidate} isReveal={false} motionEnabled={true} />
            </div>
          </div>
        </div>

        {/* Change Summary Panel */}
        {deltaSummary && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-12 w-full max-w-2xl bg-zinc-900/80 border border-white/10 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Wand2 size={16} className="text-purple-400" /> Reforge Summary
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-zinc-950 p-4 rounded-xl border border-white/5">
                <span className="text-xs text-zinc-500 uppercase font-bold block mb-1">Preserved Locks</span>
                <span className="text-emerald-400 text-sm font-medium">{(deltaSummary.preservationLocks || []).join(', ') || 'None'}</span>
              </div>
              <div className="bg-zinc-950 p-4 rounded-xl border border-white/5">
                <span className="text-xs text-zinc-500 uppercase font-bold block mb-1">Variation Strength</span>
                <span className="text-blue-400 text-sm font-medium">{deltaSummary.variationStrength || 'Moderate'}</span>
              </div>
              <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 col-span-2">
                <span className="text-xs text-zinc-500 uppercase font-bold block mb-1">Instruction / Preset Delta</span>
                <span className="text-zinc-300 text-sm italic">"{deltaSummary.instructions || 'Standard Reforge'}"</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Action Bar */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-8 flex flex-wrap justify-center gap-4">
          <button
            onClick={() => {
              soundManager.playSound('sfx_ui_click', { volume: 0.5 });
              setCard(compareCandidate);
              setShowCompareView(false);
              setCompareCandidate(null);
            }}
            className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold rounded-xl shadow-lg transition-all flex items-center gap-2"
          >
            Accept New Evolution
          </button>

          <button
            onClick={() => {
              soundManager.playSound('sfx_ui_close', { volume: 0.5 });
              // Simply close view, card remains in DB
              setShowCompareView(false);
              setCompareCandidate(null);
              window.history.pushState({}, '', `/card/${card.short_id || card.id}`);
            }}
            className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-all"
          >
            Keep Original (Discard Variant)
          </button>
        </motion.div>
      </div>
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

      {/* Relationships */}
      {(relationships.rival || relationships.duo) && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8 w-full max-w-sm px-4">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 flex items-center justify-between">
            <span>Mythology Links</span>
          </h3>
          <div className="flex flex-col gap-2">
            {relationships.rival && (
              <Link to={`/card/${relationships.rival.short_id || relationships.rival.id}`} className="group flex justify-between items-center p-3 rounded-lg bg-red-950/20 border border-red-500/10 hover:bg-red-900/30 hover:border-red-500/30 transition-all">
                <div className="flex flex-col">
                  <span className="text-[9px] text-red-400 font-bold uppercase tracking-wider mb-0.5">Rival Artifact</span>
                  <span className="text-zinc-200 text-sm font-bold">{relationships.rival.identity}</span>
                </div>
                <ArrowRight size={14} className="text-red-400 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </Link>
            )}
            {relationships.duo && (
              <Link to={`/card/${relationships.duo.short_id || relationships.duo.id}`} className="group flex justify-between items-center p-3 rounded-lg bg-blue-950/20 border border-blue-500/10 hover:bg-blue-900/30 hover:border-blue-500/30 transition-all">
                <div className="flex flex-col">
                  <span className="text-[9px] text-blue-400 font-bold uppercase tracking-wider mb-0.5">Duo Partner</span>
                  <span className="text-zinc-200 text-sm font-bold">{relationships.duo.identity}</span>
                </div>
                <ArrowRight size={14} className="text-blue-400 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </Link>
            )}
          </div>
        </motion.div>
      )}

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

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={handleShare}
            className="flex items-center justify-center gap-2 bg-zinc-900 border border-white/10 text-white px-4 py-3 rounded-xl font-bold hover:bg-zinc-800 transition-colors"
          >
            <Share2 size={18} /> Direct Link
          </button>

          {currentUser && currentUser.id === card.user_id && (
            <button
              onClick={() => setIsShowcaseModalOpen(true)}
              className={`flex items-center justify-center gap-2 border px-4 py-3 rounded-xl font-bold transition-all ${card.is_public ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20' : 'bg-zinc-900 text-zinc-400 border-white/10 hover:text-white hover:bg-zinc-800'}`}
            >
              <Globe size={18} /> {card.is_public ? 'Public' : 'Private'}
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-emerald-500 text-zinc-950 px-4 py-3 rounded-xl font-bold hover:bg-emerald-400 transition-colors text-sm"
          >
            <Download size={16} /> Export Center
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
            <>
              <button
                onClick={() => setIsRemixModalOpen(true)}
                className="col-span-2 flex items-center justify-center gap-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white px-4 py-3 rounded-xl font-bold hover:from-amber-500 hover:to-orange-500 transition-colors shadow-[0_0_15px_rgba(245,158,11,0.3)]"
              >
                <Crown size={18} /> Mythic Reforge <span className="text-white/80 font-bold ml-1 text-xs px-2 py-0.5 rounded border border-white/20 bg-black/20">2 Credits</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  if (window.confirm("Spend 3 Credits to Ascend this card to guaranteed Mythic quality?")) {
                    handleRemix("Ascend this character to ultimate mythic quality.", "ascend", [], ["Identity", "Layout", "Color Palette"], "Subtle");
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
            Forge New Card
          </button>
          <button
            onClick={() => window.location.href = '/forge-lab'}
            className="flex items-center justify-center gap-2 bg-zinc-800 text-white px-4 py-3 rounded-xl font-bold hover:bg-zinc-700 transition-colors text-sm"
          >
            <Sparkles size={16} /> Forge Lab
          </button>
        </div>

        {/* Lineage / Navigation Strip */}
        {lineage.length > 1 && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="mt-8 pt-6 border-t border-white/10 w-full"
          >
            <div className="flex items-center justify-between mb-4">
              <p className="flex items-center gap-2 text-xs text-zinc-400 uppercase tracking-wider font-bold">
                <GitBranch size={16} /> Evolution Lineage
              </p>
              {currentUser?.id === card.user_id && !card.is_featured_version && (
                <button onClick={handleSetFeatured} className="text-[10px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2 py-1 flex items-center gap-1 rounded font-bold transition-all border border-white/5">
                  <Star size={12} /> Set Featured
                </button>
              )}
              {card.is_featured_version && (
                <span className="text-[10px] text-amber-500/80 uppercase font-bold tracking-widest flex items-center gap-1"><Star size={12} className="fill-amber-500/50" /> Featured Canon</span>
              )}
            </div>

            <div className="flex gap-3 overflow-x-auto pb-4 snap-x">
              {lineage.map((variant, index) => {
                const isCurrent = variant.id === card.id;
                return (
                  <Link
                    key={variant.id}
                    to={`/card/${variant.short_id || variant.id}`}
                    className={`relative flex-shrink-0 w-16 h-24 rounded-lg overflow-hidden border-2 snap-center transition-all ${isCurrent ? 'border-emerald-500/80 scale-105 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'border-white/10 opacity-60 hover:opacity-100 hover:border-white/30'}`}
                  >
                    <img src={`${API_URL.replace('/api', '')}${variant.image_url}`} alt="Variant" className="w-full h-full object-cover" />
                    <div className="absolute bottom-0 inset-x-0 bg-black/80 text-[9px] font-bold text-center text-white/80 py-0.5">
                      v{variant.version_number || (index + 1)}
                    </div>
                    {variant.is_featured_version === 1 && (
                      <div className="absolute -top-1 -right-1 bg-amber-500 text-black p-0.5 rounded-full z-10">
                        <Star size={8} className="fill-black" />
                      </div>
                    )}
                  </Link>
                )
              })}
            </div>
          </motion.div>
        )}
      </motion.div>

      <RemixModal
        isOpen={isRemixModalOpen}
        onClose={() => setIsRemixModalOpen(false)}
        onRemix={handleRemix}
        isMythic={card.tier === 'mythic'}
      />

      {currentUser && currentUser.id === card.user_id && (
        <ShowcaseModal
          isOpen={isShowcaseModalOpen}
          onClose={() => setIsShowcaseModalOpen(false)}
          card={card}
          onUpdate={(updatedCard) => {
            setCard(updatedCard);
            // Re-fetch relationships to display instantly
            fetchWithAuth(`/cards/${card.short_id || card.id}`)
              .then(data => setRelationships(data.relationships || {}))
              .catch(console.error);
          }}
        />
      )}
    </div>
  );
}
