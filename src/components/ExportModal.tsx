import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Download, Layout, Smartphone, Square, Image as ImageIcon } from "lucide-react";
import Card from "./Card.tsx";
import * as htmlToImage from "html-to-image";
import { soundManager } from "../lib/soundManager";

interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    card: any;
}

type ExportMode = "poster" | "square" | "story";

export default function ExportModal({ isOpen, onClose, card }: ExportModalProps) {
    const [exportMode, setExportMode] = useState<ExportMode>("poster");
    const [exporting, setExporting] = useState(false);
    const captureRef = useRef<HTMLDivElement>(null);

    if (!isOpen) return null;

    const handleExport = async () => {
        if (!captureRef.current) return;
        setExporting(true);
        soundManager.playSound('sfx_ui_click', { volume: 0.5 });

        try {
            // Ensure the images inside the card are loaded before capture by waiting a moment
            await new Promise(r => setTimeout(r, 500));

            const dataUrl = await htmlToImage.toPng(captureRef.current, {
                quality: 1.0,
                pixelRatio: 2, // High resolution
                skipFonts: false,
            });

            const link = document.createElement("a");
            link.download = `${card.identity?.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase()}_${exportMode}.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error("Export failed:", err);
            alert("Failed to export image. Please try again.");
        } finally {
            setExporting(false);
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/90 backdrop-blur-sm"
                    onClick={onClose}
                />

                {/* Hidden high-res capture containers (rendered off-screen) */}
                <div className="fixed top-0 left-[-9999px] pointer-events-none">
                    {exportMode === "poster" && (
                        <div ref={captureRef} className="w-[1000px] bg-black p-12 flex items-center justify-center relative overflow-hidden">
                            <div className="absolute inset-0 opacity-30 select-none">
                                <img src={`/api${card.image_url}`} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(40px)' }} />
                            </div>
                            <div className="w-[800px] relative z-10 shadow-[0_20px_100px_rgba(0,0,0,1)]">
                                <Card card={card} isReveal={false} motionEnabled={false} />
                            </div>
                        </div>
                    )}
                    {exportMode === "square" && (
                        <div ref={captureRef} className="w-[1080px] h-[1080px] bg-[#111] flex flex-col items-center justify-center relative overflow-hidden">
                            <div className="absolute inset-0 opacity-20 select-none">
                                <img src={`/api${card.image_url}`} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(60px)' }} />
                            </div>
                            <div className="w-[600px] relative z-10 shadow-[0_20px_100px_rgba(0,0,0,1)]">
                                <Card card={card} isReveal={false} motionEnabled={false} />
                            </div>
                            <div className="absolute bottom-12 text-center z-10">
                                <h2 className="text-white text-4xl font-black uppercase tracking-widest">{card.identity}</h2>
                                <p className="text-zinc-400 text-2xl font-bold mt-2">FINAL FORM GAMECARD</p>
                            </div>
                        </div>
                    )}
                    {exportMode === "story" && (
                        <div ref={captureRef} className="w-[1080px] h-[1920px] bg-[#050505] flex flex-col items-center justify-center relative overflow-hidden">
                            <div className="absolute inset-0 opacity-40 select-none">
                                <img src={`/api${card.image_url}`} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(80px)' }} />
                            </div>
                            {/* Top Brand */}
                            <div className="absolute top-24 text-center z-10 scale-150">
                                <p className="text-zinc-500 text-xl font-black tracking-[0.5em] mb-2 uppercase">FINAL FORM</p>
                                <h2 className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 to-zinc-500 text-5xl font-black uppercase tracking-tighter">
                                    {card.version_number > 1 ? `EVOLUTION v${card.version_number}` : 'ORIGINAL MYTH'}
                                </h2>
                            </div>

                            <div className="w-[750px] relative z-10 shadow-[0_30px_120px_rgba(0,0,0,0.8)] mt-32">
                                <Card card={card} isReveal={false} motionEnabled={false} />
                            </div>

                            {/* Bottom CTA */}
                            <div className="absolute bottom-32 text-center z-10">
                                <p className="text-emerald-400 text-3xl font-bold px-12 py-6 border border-emerald-500/30 rounded-full bg-black/50 backdrop-blur-md">
                                    CREATE YOUR OWN
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* User UI (Modal) */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative bg-zinc-900 border border-white/10 rounded-3xl w-full max-w-4xl p-6 md:p-10 shadow-2xl flex flex-col md:flex-row gap-10"
                >
                    {/* Settings Sidebar */}
                    <div className="w-full md:w-1/3 flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
                                    Export Room
                                </h2>
                                <button onClick={onClose} className="md:hidden text-zinc-500 hover:text-white transition-colors">
                                    <X size={24} />
                                </button>
                            </div>
                            <p className="text-zinc-400 text-sm mb-8 font-medium">Select a format to generate a high-quality artifact image for sharing.</p>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={() => setExportMode("poster")}
                                    className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${exportMode === 'poster' ? 'bg-zinc-800 border-emerald-500 text-white' : 'bg-zinc-950 border-white/5 text-zinc-400 hover:border-white/20'}`}
                                >
                                    <ImageIcon size={24} className={exportMode === 'poster' ? 'text-emerald-400' : ''} />
                                    <div className="text-left">
                                        <p className="font-bold text-sm uppercase tracking-wider">Poster</p>
                                        <p className="text-xs opacity-70">Clean, full-art presentation</p>
                                    </div>
                                </button>

                                <button
                                    onClick={() => setExportMode("square")}
                                    className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${exportMode === 'square' ? 'bg-zinc-800 border-purple-500 text-white' : 'bg-zinc-950 border-white/5 text-zinc-400 hover:border-white/20'}`}
                                >
                                    <Square size={24} className={exportMode === 'square' ? 'text-purple-400' : ''} />
                                    <div className="text-left">
                                        <p className="font-bold text-sm uppercase tracking-wider">Social Square</p>
                                        <p className="text-xs opacity-70">1:1 ration for Feeds</p>
                                    </div>
                                </button>

                                <button
                                    onClick={() => setExportMode("story")}
                                    className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${exportMode === 'story' ? 'bg-zinc-800 border-amber-500 text-white' : 'bg-zinc-950 border-white/5 text-zinc-400 hover:border-white/20'}`}
                                >
                                    <Smartphone size={24} className={exportMode === 'story' ? 'text-amber-400' : ''} />
                                    <div className="text-left">
                                        <p className="font-bold text-sm uppercase tracking-wider">Story Vertical</p>
                                        <p className="text-xs opacity-70">9:16 ratio for Stories / Reels</p>
                                    </div>
                                </button>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-white/10 hidden md:block">
                            <button onClick={onClose} className="w-full py-3 bg-zinc-950 hover:bg-zinc-800 border border-white/5 rounded-xl font-bold transition-all text-zinc-400 uppercase tracking-wider text-sm flex items-center justify-center gap-2">
                                <X size={16} /> Close
                            </button>
                        </div>
                    </div>

                    {/* Preview Panel */}
                    <div className="w-full md:w-2/3 bg-black border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center relative overflow-hidden min-h-[400px]">
                        {/* Approximate Visual Preview for the User (not the actual export render) */}
                        <div className="relative z-10 flex flex-col items-center w-full max-w-[250px] pointer-events-none origin-bottom opacity-80 scale-90">
                            {exportMode === "story" && (
                                <div className="mb-4 text-center">
                                    <h2 className="text-white text-lg font-black uppercase">Story Preview</h2>
                                </div>
                            )}
                            <Card card={card} isReveal={false} motionEnabled={false} />
                        </div>

                        <div className="absolute inset-x-0 bottom-0 top-1/2 bg-gradient-to-t from-black via-black/80 to-transparent z-20 pointer-events-none" />

                        <button
                            onClick={handleExport}
                            disabled={exporting}
                            className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_0_30px_rgba(16,185,129,0.3)] flex items-center gap-2 min-w-[200px] justify-center"
                        >
                            {exporting ? (
                                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <><Download size={18} /> Render & Save</>
                            )}
                        </button>
                    </div>

                </motion.div>
            </div>
        </AnimatePresence>
    );
}
