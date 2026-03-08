import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Wand2, Shield, Zap, Skull, Crown, X } from 'lucide-react';
import { soundManager } from '../lib/soundManager';

export default function RemixModal({
    isOpen,
    onClose,
    onRemix
}: {
    isOpen: boolean;
    onClose: () => void;
    onRemix: (instructions: string, mode: string, chips: string[]) => void;
}) {
    const [instructions, setInstructions] = useState('');
    const [mode, setMode] = useState('visual');
    const [selectedChips, setSelectedChips] = useState<string[]>([]);

    const quickChips = [
        "More Mythic", "Darker Tone", "More Sci-Fi",
        "More Fantasy", "Funnier", "More Serious",
        "Better Armor", "Better Weapon", "Cleaner Text"
    ];

    useEffect(() => {
        if (isOpen) {
            soundManager.playSound('sfx_ui_open', { volume: 0.5 });
        } else {
            soundManager.playSound('sfx_ui_close', { volume: 0.4 });
        }
    }, [isOpen]);

    const handleChipToggle = (chip: string) => {
        soundManager.playSound('sfx_chip_toggle', { volume: 0.3 });
        setSelectedChips(prev =>
            prev.includes(chip) ? prev.filter(c => c !== chip) : [...prev, chip]
        );
    };

    const handleSubmit = () => {
        soundManager.playSound('sfx_reforge_start', { volume: 0.8 });
        onRemix(instructions, mode, selectedChips);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, y: 100 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 100 }}
                    className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
                >
                    <div className="p-4 border-b border-white/10 flex justify-between items-center bg-zinc-950/50">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Wand2 className="text-purple-400" size={20} />
                            Reforge / Remix
                        </h2>
                        <button onClick={onClose} className="p-2 text-zinc-500 hover:text-white rounded-full hover:bg-white/5 transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-6 overflow-y-auto flex-1 space-y-6">

                        {/* Mode Selector */}
                        <div className="space-y-3">
                            <label className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Reforge Mode</label>
                            <div className="grid grid-cols-1 gap-2">
                                <button
                                    onClick={() => { soundManager.playSound('sfx_chip_toggle', { volume: 0.2 }); setMode('visual'); }}
                                    className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-colors ${mode === 'visual' ? 'bg-purple-500/10 border-purple-500/50' : 'bg-zinc-950/50 border-white/5 hover:border-white/20'}`}
                                >
                                    <Shield size={18} className={`mt-0.5 ${mode === 'visual' ? 'text-purple-400' : 'text-zinc-500'}`} />
                                    <div>
                                        <div className={`font-bold ${mode === 'visual' ? 'text-purple-300' : 'text-zinc-300'}`}>Visual Reforge</div>
                                        <div className="text-xs text-zinc-500 mt-1">Change visual presentation (armor, aura, pose) while preserving lore and identity.</div>
                                    </div>
                                </button>

                                <button
                                    onClick={() => { soundManager.playSound('sfx_chip_toggle', { volume: 0.2 }); setMode('character'); }}
                                    className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-colors ${mode === 'character' ? 'bg-emerald-500/10 border-emerald-500/50' : 'bg-zinc-950/50 border-white/5 hover:border-white/20'}`}
                                >
                                    <Zap size={18} className={`mt-0.5 ${mode === 'character' ? 'text-emerald-400' : 'text-zinc-500'}`} />
                                    <div>
                                        <div className={`font-bold ${mode === 'character' ? 'text-emerald-300' : 'text-zinc-300'}`}>Character Evolution</div>
                                        <div className="text-xs text-zinc-500 mt-1">Evolve the lore, archetype, ultimate ability, and styling concurrently.</div>
                                    </div>
                                </button>

                                <button
                                    onClick={() => { soundManager.playSound('sfx_chip_toggle', { volume: 0.2 }); setMode('boss'); }}
                                    className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-colors ${mode === 'boss' ? 'bg-red-500/10 border-red-500/50' : 'bg-zinc-950/50 border-white/5 hover:border-white/20'}`}
                                >
                                    <Skull size={18} className={`mt-0.5 ${mode === 'boss' ? 'text-red-400' : 'text-zinc-500'}`} />
                                    <div>
                                        <div className={`font-bold ${mode === 'boss' ? 'text-red-300' : 'text-zinc-300'}`}>Final Boss Ascension</div>
                                        <div className="text-xs text-zinc-500 mt-1">Push harder. Massive scale, mythic border, high intimidation. (Premium)</div>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Custom Instructions */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Custom Refinements</label>
                            <textarea
                                value={instructions}
                                onChange={(e) => setInstructions(e.target.value)}
                                placeholder="Describe what you want changed (e.g. 'Make the armor more celestial', 'Change the weapon to a flaming scythe')"
                                className="w-full h-24 bg-zinc-950 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-purple-500/50 resize-none"
                            />
                        </div>

                        {/* Quick Chips */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Quick Traits</label>
                            <div className="flex flex-wrap gap-2">
                                {quickChips.map(chip => (
                                    <button
                                        key={chip}
                                        onClick={() => handleChipToggle(chip)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${selectedChips.includes(chip) ? 'bg-purple-500/20 border-purple-500/50 text-purple-300' : 'bg-zinc-950 border-white/10 text-zinc-400 hover:text-white hover:border-white/30'}`}
                                    >
                                        {chip}
                                    </button>
                                ))}
                            </div>
                        </div>

                    </div>

                    <div className="p-4 border-t border-white/10 bg-zinc-950">
                        <button
                            onClick={handleSubmit}
                            className="w-full flex justify-center items-center gap-2 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                        >
                            <Sparkles size={18} />
                            Reforge Card (2 Credits)
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
