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
    onRemix: (instructions: string, mode: string, chips: string[], locks: string[], strength: string) => void;
    isMythic?: boolean;
}) {
    const [instructions, setInstructions] = useState('');
    const [mode, setMode] = useState('visual');
    const [selectedChips, setSelectedChips] = useState<string[]>([]);
    const [preservationLocks, setLocks] = useState<string[]>(['Face Likeness', 'Color Palette']);
    const [variationStrength, setVariationStrength] = useState<string>('Subtle');

    const standardPresets = [
        { name: "Clean Up", icon: <Sparkles size={14} />, desc: "Refine details. Minimal drift.", mode: "visual", strength: "Subtle", locks: ["Face Likeness", "Color Palette", "Archetype", "Pose"], prompt: "Clean up and polish the design. Improve rendering quality. Keep exact identity." },
        { name: "Ascend", icon: <Crown size={14} />, desc: "Mythic evolution.", mode: "character", strength: "Moderate", locks: ["Face Likeness", "Color Palette"], prompt: "Ascend to a higher mythic plane. Brighter aura, glowing eyes, transcendent premium armor." },
        { name: "Bossify", icon: <Skull size={14} />, desc: "Massive final boss scale.", mode: "boss", strength: "Strong", locks: ["Color Palette", "Archetype"], prompt: "Evolve into an intimidating endgame final boss. Massive scale, threatening posture, dominant presence." },
        { name: "Corrupt", icon: <Zap size={14} />, desc: "Twisted dark energy.", mode: "character", strength: "Strong", locks: ["Pose"], prompt: "Corrupt this character. Add dark crackling energy, twisted details, and a sinister aura." }
    ];

    const mythicPresets = [
        { name: "Refine Mythic", icon: <Sparkles size={14} />, desc: "Subtle polish & coherence.", mode: "refine_mythic", strength: "Subtle", locks: ["Face Likeness", "Color Palette", "Archetype", "Pose", "Border Style"], prompt: "Subtle improvement, cleaner coherence, reading typography polish. Maintain mythic prestige." },
        { name: "Bossify Mythic", icon: <Skull size={14} />, desc: "Ultimate dominance.", mode: "bossify_mythic", strength: "Moderate", locks: ["Face Likeness", "Color Palette", "Border Style"], prompt: "Preserve identity while increasing dominance, threat, and heavy mythic intimidation." },
        { name: "Corrupt Mythic", icon: <Zap size={14} />, desc: "Fallen grandeur.", mode: "corrupt_mythic", strength: "Moderate", locks: ["Color Palette", "Border Style"], prompt: "Introduce dark mythic branch energy, corruption, fallen grandeur, twisted prestige." },
        { name: "Echo Variant", icon: <Wand2 size={14} />, desc: "Alternate premium branch.", mode: "echo_variant", strength: "Moderate", locks: ["Face Likeness", "Border Style"], prompt: "Create an alternate but highly recognizable premium branch. Slightly mutated colorway." }
    ];

    const reforgePresets = isMythic ? mythicPresets : standardPresets;

    const applyPreset = (preset: any) => {
        soundManager.playSound('sfx_ui_click', { volume: 0.5 });
        setMode(preset.mode);
        setVariationStrength(preset.strength);
        setLocks(preset.locks);
        setInstructions(preset.prompt);
        setSelectedChips([]); // Clear manual chips when using a preset
    };

    const quickChips = [
        "More Mythic", "Darker Tone", "More Sci-Fi",
        "More Fantasy", "Funnier", "More Serious",
        "Better Armor", "Better Weapon", "Cleaner Text"
    ];

    const availableLocks = ["Face Likeness", "Color Palette", "Archetype", "Pose", "Border Style"];
    const strengthLevels = isMythic ? ["Subtle", "Moderate"] : ["Subtle", "Moderate", "Strong", "Wild"];

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
        onRemix(instructions, mode, selectedChips, preservationLocks, variationStrength);
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
                        <h2 className={`text-xl font-bold flex items-center gap-2 ${isMythic ? 'text-amber-400' : ''}`}>
                            {isMythic ? <Crown className="text-amber-400" size={20} /> : <Wand2 className="text-purple-400" size={20} />}
                            {isMythic ? 'Mythic Reforge' : 'Reforge / Remix'}
                        </h2>
                        <button onClick={onClose} className="p-2 text-zinc-500 hover:text-white rounded-full hover:bg-white/5 transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-6 overflow-y-auto flex-1 space-y-6">

                        {/* Presets */}
                        <div className="space-y-3">
                            <label className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Quick Presets</label>
                            <div className="grid grid-cols-2 gap-2">
                                {reforgePresets.map(preset => (
                                    <button
                                        key={preset.name}
                                        onClick={() => applyPreset(preset)}
                                        className="flex flex-col items-start gap-1 p-3 rounded-xl border border-white/5 bg-zinc-950 hover:bg-zinc-800 hover:border-white/20 transition-all text-left"
                                    >
                                        <div className="font-bold flex items-center gap-1 text-zinc-200">
                                            {preset.icon} {preset.name}
                                        </div>
                                        <div className="text-[10px] text-zinc-500 leading-tight">{preset.desc}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Mode Selector */}
                        {!isMythic && (
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
                                            <div className={`font-bold ${mode === 'boss' ? 'text-red-300' : 'text-zinc-300'}`}>Final Boss Ascension</div>
                                            <div className="text-xs text-zinc-500 mt-1">Push harder. Massive scale, mythic border, high intimidation. (Premium)</div>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        )}

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

                        {/* Preservation Locks */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Preservation Locks</label>
                            <div className="flex flex-wrap gap-2">
                                {availableLocks.map(lock => (
                                    <button
                                        key={lock}
                                        onClick={() => {
                                            soundManager.playSound('sfx_chip_toggle', { volume: 0.2 });
                                            setLocks(prev => prev.includes(lock) ? prev.filter(l => l !== lock) : [...prev, lock]);
                                        }}
                                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${preservationLocks.includes(lock) ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300' : 'bg-zinc-950 border-white/10 text-zinc-400 hover:text-white hover:border-white/30'}`}
                                    >
                                        <Shield size={12} className="inline mr-1 mb-0.5" />
                                        {lock}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Variation Strength */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Variation Strength</label>
                            <div className={`grid gap-2 ${isMythic ? 'grid-cols-2' : 'grid-cols-4'}`}>
                                {strengthLevels.map(level => (
                                    <button
                                        key={level}
                                        onClick={() => {
                                            soundManager.playSound('sfx_chip_toggle', { volume: 0.2 });
                                            setVariationStrength(level);
                                        }}
                                        className={`py-2 rounded-xl text-xs font-bold border transition-colors text-center ${variationStrength === level ? 'bg-blue-500/20 border-blue-500/50 text-blue-300' : 'bg-zinc-950/50 border-white/5 text-zinc-500 hover:text-white hover:border-white/20'}`}
                                    >
                                        {level}
                                    </button>
                                ))}
                            </div>
                            <div className="text-[11px] text-zinc-500 px-1 pt-1 italic">
                                {variationStrength === 'Subtle' && "Keeps the artifact closely aligned. Minimal AI drift."}
                                {variationStrength === 'Moderate' && "Balanced variation. Allows stylistic drift but remains highly recognizable."}
                                {variationStrength === 'Strong' && "Expressive variation. Core identity remains, visual forms shift significantly."}
                                {variationStrength === 'Wild' && "Allows broad divergence, completely reimagining the character while preserving essence."}
                            </div>
                        </div>

                    </div>

                    <div className="p-4 border-t border-white/10 bg-zinc-950">
                        <button
                            onClick={handleSubmit}
                            className={`w-full flex justify-center items-center gap-2 ${isMythic ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-[0_0_15px_rgba(245,158,11,0.4)]' : 'bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 shadow-[0_0_15px_rgba(168,85,247,0.4)]'} text-white font-bold py-4 px-6 rounded-xl transition-all`}
                        >
                            {isMythic ? <Crown size={18} /> : <Sparkles size={18} />}
                            {isMythic ? 'Evolve Mythic Branch (2 Credits)' : 'Reforge Card (2 Credits)'}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
