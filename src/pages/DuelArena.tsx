import { useState, useEffect } from "react";
import { useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchWithAuth } from "../lib/api";
import Card from "../components/Card";
import { motion, AnimatePresence } from "motion/react";
import { Copy, Sparkles, Swords, ChevronLeft, Check, FastForward, Download } from "lucide-react";
import * as htmlToImage from "html-to-image";
import { soundManager } from "../lib/soundManager";
import { DuelResult, resolveDuel } from "../lib/duelResolver";

export default function DuelArena() {
    const [cards, setCards] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [fighter1, setFighter1] = useState<any | null>(null);
    const [fighter2, setFighter2] = useState<any | null>(null);
    const [result, setResult] = useState<DuelResult | null>(null);
    const [copied, setCopied] = useState(false);
    const [exporting, setExporting] = useState(false);
    const navigate = useNavigate();
    const posterRef = useRef<HTMLDivElement>(null);

    const handleExportMatch = async () => {
        if (!posterRef.current) return;
        setExporting(true);
        soundManager.playSound('sfx_ui_click', { volume: 0.5 });
        try {
            await new Promise(r => setTimeout(r, 500));
            const dataUrl = await htmlToImage.toPng(posterRef.current, { quality: 1.0, pixelRatio: 2 });
            const link = document.createElement("a");
            const safeName1 = fighter1?.identity?.replace(/[^a-zA-Z0-9]/g, "") || "Fighter1";
            const safeName2 = fighter2?.identity?.replace(/[^a-zA-Z0-9]/g, "") || "Fighter2";
            link.download = `Versus_${safeName1}_VS_${safeName2}.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error("Export failed:", err);
            alert("Failed to export match result.");
        } finally {
            setExporting(false);
        }
    };

    useEffect(() => {
        fetchWithAuth("/cards/my-cards")
            .then((data) => {
                setCards(Array.isArray(data.cards) ? data.cards : []);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Fetch cards error:", err);
                navigate("/auth");
            });
    }, [navigate]);

    const toggleSelect = (card: any) => {
        soundManager.playSound('sfx_ui_click', { volume: 0.3 });
        if (fighter1?.id === card.id) {
            setFighter1(null);
            return;
        }
        if (fighter2?.id === card.id) {
            setFighter2(null);
            return;
        }

        if (!fighter1) {
            setFighter1(card);
        } else if (!fighter2) {
            setFighter2(card);
        }
    };

    const handleStartDuel = () => {
        if (!fighter1 || !fighter2) return;
        soundManager.playSound('sfx_reforge_start', { volume: 0.5 });
        const match = resolveDuel(fighter1, fighter2);
        setResult(match);
    };

    const resetDuel = () => {
        soundManager.playSound('sfx_ui_close', { volume: 0.3 });
        setFighter1(null);
        setFighter2(null);
        setResult(null);
    };

    const handleCopy = () => {
        soundManager.playSound('sfx_ui_click', { volume: 0.3 });
        if (result) {
            navigator.clipboard.writeText(result.veoPrompt);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const isSelected = (id: string) => fighter1?.id === id || fighter2?.id === id;

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <Sparkles className="animate-spin text-emerald-400" size={32} />
            </div>
        );
    }

    return (
        <div className="pt-8 pb-16">
            <Link
                to="/profile"
                onMouseEnter={() => soundManager.playSound('sfx_ui_hover', { volume: 0.2 })}
                onClick={() => soundManager.playSound('sfx_ui_click', { volume: 0.3 })}
                className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-8 transition-colors"
            >
                <ChevronLeft size={20} /> Back to Collection
            </Link>

            <div className="text-center mb-10">
                <h1 className="text-4xl font-black italic tracking-wide text-transparent bg-clip-text bg-gradient-to-br from-red-400 overflow-visible to-amber-500 flex justify-center items-center gap-4 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]">
                    <Swords size={36} className="text-red-400" /> BATTLE ARENA
                </h1>
                <p className="text-zinc-400 mt-2 font-medium">Select two avatars from your collection to violently clash.</p>
            </div>

            <AnimatePresence mode="wait">
                {!result ? (
                    <motion.div key="selection" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        {/* Duel Setup Container */}
                        <div className="bg-zinc-900/60 border border-white/10 rounded-3xl p-6 lg:p-8 mb-12 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                            <div className="flex flex-col md:flex-row items-center justify-center gap-6 lg:gap-12 min-h-[300px]">
                                {/* Fighter 1 Slot */}
                                <div className="w-full md:w-64 max-w-xs flex flex-col items-center">
                                    <div className="text-sm font-black text-zinc-500 uppercase tracking-widest mb-4">Competitor One</div>
                                    {fighter1 ? (
                                        <div className="w-full relative scale-95 origin-top transition-all">
                                            <Card card={fighter1} />
                                            <button onClick={() => toggleSelect(fighter1)} className="absolute -top-3 -right-3 w-8 h-8 bg-zinc-800 text-white rounded-full border border-white/20 hover:bg-red-500 hover:border-red-400 flex justify-center items-center font-bold z-10 transition-colors">X</button>
                                        </div>
                                    ) : (
                                        <div className="w-full aspect-[2/3] border-2 border-dashed border-zinc-700/50 rounded-2xl flex items-center justify-center text-zinc-600 font-bold">Select Card</div>
                                    )}
                                </div>

                                {/* VS Element */}
                                <div className="flex-shrink-0 flex items-center justify-center -my-4 md:my-0 h-16 w-16 md:w-auto relative z-10">
                                    <div className="bg-red-500/20 text-red-500 font-black text-3xl italic w-16 h-16 rounded-full flex items-center justify-center border border-red-500/20 backdrop-blur-md shadow-[0_0_20px_rgba(239,68,68,0.3)]">VS</div>
                                </div>

                                {/* Fighter 2 Slot */}
                                <div className="w-full md:w-64 max-w-xs flex flex-col items-center">
                                    <div className="text-sm font-black text-zinc-500 uppercase tracking-widest mb-4">Competitor Two</div>
                                    {fighter2 ? (
                                        <div className="w-full relative scale-95 origin-top transition-all">
                                            <Card card={fighter2} />
                                            <button onClick={() => toggleSelect(fighter2)} className="absolute -top-3 -right-3 w-8 h-8 bg-zinc-800 text-white rounded-full border border-white/20 hover:bg-red-500 hover:border-red-400 flex justify-center items-center font-bold z-10 transition-colors">X</button>
                                        </div>
                                    ) : (
                                        <div className="w-full aspect-[2/3] border-2 border-dashed border-zinc-700/50 rounded-2xl flex items-center justify-center text-zinc-600 font-bold">Select Card</div>
                                    )}
                                </div>
                            </div>

                            {/* Start Button */}
                            <div className="mt-8 flex justify-center">
                                <button
                                    onClick={handleStartDuel}
                                    disabled={!fighter1 || !fighter2}
                                    onMouseEnter={() => fighter1 && fighter2 && soundManager.playSound('sfx_ui_hover', { volume: 0.2 })}
                                    className="px-8 py-4 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 disabled:opacity-50 disabled:grayscale text-white font-black text-lg tracking-widest uppercase rounded-2xl shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all flex items-center gap-3 w-full md:w-auto justify-center"
                                >
                                    <FastForward size={24} /> Generate Cinematic Duel
                                </button>
                            </div>
                        </div>

                        {/* Collection Grid */}
                        <div className="border-t border-white/5 pt-10">
                            <h3 className="text-xl font-bold mb-6 text-zinc-300">Choose Fighters</h3>
                            {cards.length < 2 ? (
                                <div className="text-center py-12 text-zinc-500 font-medium bg-zinc-900/40 rounded-3xl border border-white/5">
                                    You need at least 2 cards to enter the Arena. Go forge some!
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                    {cards.map((card) => {
                                        const selected = isSelected(card.id);
                                        return (
                                            <div
                                                key={card.id}
                                                onClick={() => toggleSelect(card)}
                                                className={`cursor-pointer transition-all ${selected ? 'ring-4 ring-offset-4 ring-offset-zinc-950 ring-red-500 brightness-110 scale-95' : 'hover:scale-105 opacity-80 hover:opacity-100 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]'}`}
                                            >
                                                <div className="pointer-events-none">
                                                    <Card card={card} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </motion.div>
                ) : (
                    <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-4xl mx-auto space-y-8">

                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-black uppercase tracking-widest text-zinc-300">Match Concluded</h2>
                            <button
                                onClick={handleExportMatch}
                                disabled={exporting}
                                className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black px-4 py-2 rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                            >
                                {exporting ? <Sparkles className="animate-spin" size={16} /> : <Download size={16} />}
                                {exporting ? 'Rendering...' : 'Export Poster'}
                            </button>
                        </div>

                        {/* Premium Shareable Poster Container */}
                        <div
                            ref={posterRef}
                            className="bg-black border border-white/5 rounded-3xl overflow-hidden relative flex flex-col shadow-[0_30px_100px_rgba(0,0,0,1)]"
                            style={{ minHeight: '800px' }}
                        >
                            {/* Dramatic Split Background */}
                            <div className="absolute inset-0 flex">
                                <div className="w-1/2 h-full opacity-30 select-none">
                                    <img src={`/api${fighter1.image_url}`} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(30px) saturate(0.5)' }} />
                                </div>
                                <div className="w-1/2 h-full opacity-30 select-none">
                                    <img src={`/api${fighter2.image_url}`} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(30px) saturate(0.5)' }} />
                                </div>
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

                            {/* Versus Presentation */}
                            <div className="relative z-10 p-12 flex flex-col items-center flex-1">
                                <div className="text-center mb-8 bg-black/60 backdrop-blur-md border border-white/10 px-8 py-2 rounded-full">
                                    <p className="font-black text-zinc-400 uppercase tracking-[0.5em] text-sm">Official Duel Result</p>
                                </div>

                                <div className="flex justify-center items-center gap-8 w-full">
                                    <div className={`w-[280px] transition-all duration-1000 ${result.winnerCard.id === fighter1.id ? 'scale-110 z-20 shadow-[0_0_50px_rgba(255,255,255,0.2)]' : 'scale-90 opacity-70 grayscale-[0.3]'}`}>
                                        {result.winnerCard.id === fighter1.id && (
                                            <div className="absolute -top-6 inset-x-0 flex justify-center z-30">
                                                <div className="bg-amber-500 text-black font-black uppercase tracking-widest px-4 py-1 rounded shadow-[0_0_20px_rgba(245,158,11,0.5)]">Victor</div>
                                            </div>
                                        )}
                                        <Card card={fighter1} isReveal={false} motionEnabled={false} />
                                    </div>

                                    <div className="flex-shrink-0 flex items-center justify-center -my-4 md:my-0 h-24 w-24 relative z-30">
                                        <div className="bg-red-500/90 text-black font-black text-5xl italic w-24 h-24 rounded-full flex items-center justify-center border-4 border-black shadow-[0_0_30px_rgba(239,68,68,0.5)]">VS</div>
                                    </div>

                                    <div className={`w-[280px] transition-all duration-1000 ${result.winnerCard.id === fighter2.id ? 'scale-110 z-20 shadow-[0_0_50px_rgba(255,255,255,0.2)]' : 'scale-90 opacity-70 grayscale-[0.3]'}`}>
                                        {result.winnerCard.id === fighter2.id && (
                                            <div className="absolute -top-6 inset-x-0 flex justify-center z-30">
                                                <div className="bg-amber-500 text-black font-black uppercase tracking-widest px-4 py-1 rounded shadow-[0_0_20px_rgba(245,158,11,0.5)]">Victor</div>
                                            </div>
                                        )}
                                        <Card card={fighter2} isReveal={false} motionEnabled={false} />
                                    </div>
                                </div>
                            </div>

                            {/* Match Summary Block */}
                            <div className="relative z-10 bg-black/80 backdrop-blur-xl border-t border-white/10 p-10 flex flex-col items-center text-center mt-auto">
                                <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-4">
                                    {result.winnerCard.identity} <span className="text-zinc-500 font-medium">Takes the Victory</span>
                                </h2>
                                <div className="text-emerald-400 font-bold uppercase tracking-widest text-xs mb-4 flex items-center justify-center gap-2">
                                    Final Prediction Confidence: <span className="bg-emerald-500/20 px-2 py-0.5 rounded">{result.confidence}</span>
                                </div>
                                <div className="max-w-2xl">
                                    <p className="text-zinc-400 text-lg leading-relaxed italic">"{result.summary}"</p>
                                </div>
                            </div>
                        </div>

                        {/* Veo Prompt Section */}
                        <div className="bg-zinc-900/80 border border-white/10 rounded-3xl p-6 lg:p-8">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                                        <Sparkles className="text-amber-400" /> Veo 3 Cinematic Prompt
                                    </h3>
                                    <p className="text-zinc-400 text-sm mt-1">Copy this text and supply images of both cards to generate an 8-second trailer.</p>
                                </div>
                                <button
                                    onClick={handleCopy}
                                    className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold transition-all shadow-lg ${copied ? "bg-emerald-500 text-zinc-950 shadow-emerald-500/20" : "bg-white text-zinc-950 hover:bg-zinc-200"}`}
                                >
                                    {copied ? <Check size={18} /> : <Copy size={18} />}
                                    {copied ? "Copied!" : "Copy Prompt"}
                                </button>
                            </div>

                            <div className="bg-black/60 rounded-2xl p-6 border border-white/5">
                                <pre className="text-zinc-300 font-mono text-[13px] leading-relaxed whitespace-pre-wrap">
                                    {result.veoPrompt}
                                </pre>
                            </div>
                        </div>

                        <div className="pt-4 flex justify-center">
                            <button
                                onClick={resetDuel}
                                className="px-6 py-3 border border-white/10 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-300 font-bold rounded-full transition-colors"
                            >
                                Return to Arena
                            </button>
                        </div>

                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
