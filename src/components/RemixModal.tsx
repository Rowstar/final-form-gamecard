import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Wand2, Shield, Zap, Skull, Crown, X, ChevronLeft, Target, Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { soundManager } from '../lib/soundManager';

export default function RemixModal({
    isOpen,
    onClose,
    onRemix,
    isMythic
}: {
    isOpen: boolean;
    onClose: () => void;
    onRemix: (instructions: string, mode: string, chips: string[], locks: string[], strength: string) => void;
    isMythic?: boolean;
}) {
    const [path, setPath] = useState<'quick' | 'precision' | 'advanced' | null>(null);
    const [instructions, setInstructions] = useState('');
    const [mode, setMode] = useState('visual');
    const [selectedChips, setSelectedChips] = useState<string[]>([]);
    const [preservationLocks, setLocks] = useState<string[]>(['Face Likeness', 'Color Palette', 'Illustration Style']);
    const [variationStrength, setVariationStrength] = useState<string>('Subtle');

    // Quick Path State
    const [selectedPreset, setSelectedPreset] = useState<any>(null);

    // Precision Path State
    const [tweakTarget, setTweakTarget] = useState<string>('');
    const [showAdvancedTweak, setShowAdvancedTweak] = useState(false);

    const standardPresets = [
        { name: "Clean Up", icon: <Sparkles size={14} />, desc: "Refine details. Minimal drift.", mode: "visual", strength: "Subtle", locks: ["Face Likeness", "Color Palette", "Archetype", "Pose", "Illustration Style"], prompt: "Clean up and polish the design. Improve rendering quality. Keep exact identity." },
        { name: "Ascend", icon: <Crown size={14} />, desc: "Mythic evolution.", mode: "ascend", strength: "Moderate", locks: ["Face Likeness", "Color Palette", "Illustration Style"], prompt: "Ascend to a higher mythic plane. Brighter aura, glowing eyes, transcendent premium armor." },
        { name: "Bossify", icon: <Skull size={14} />, desc: "Massive scale.", mode: "boss", strength: "Strong", locks: ["Color Palette", "Archetype"], prompt: "Evolve into an intimidating endgame final boss. Massive scale, threatening posture, dominant presence." },
        { name: "Corrupt", icon: <Zap size={14} />, desc: "Twisted dark energy.", mode: "character", strength: "Strong", locks: ["Pose", "Illustration Style"], prompt: "Corrupt this character. Add dark crackling energy, twisted details, and a sinister aura." }
    ];

    const mythicPresets = [
        { name: "Refine Mythic", icon: <Sparkles size={14} />, desc: "Subtle polish & coherence.", mode: "refine_mythic", strength: "Subtle", locks: ["Face Likeness", "Color Palette", "Archetype", "Pose", "Border Style", "Illustration Style"], prompt: "Subtle improvement, cleaner coherence, reading typography polish. Maintain mythic prestige." },
        { name: "Bossify Mythic", icon: <Skull size={14} />, desc: "Ultimate dominance.", mode: "bossify_mythic", strength: "Moderate", locks: ["Face Likeness", "Color Palette", "Border Style", "Illustration Style"], prompt: "Preserve identity while increasing dominance, threat, and high intimidation." },
        { name: "Corrupt Mythic", icon: <Zap size={14} />, desc: "Fallen grandeur.", mode: "corrupt_mythic", strength: "Moderate", locks: ["Color Palette", "Border Style", "Illustration Style"], prompt: "Introduce dark mythic branch energy, corruption, fallen grandeur, twisted prestige." },
        { name: "Echo Variant", icon: <Wand2 size={14} />, desc: "Alternate premium branch.", mode: "echo_variant", strength: "Moderate", locks: ["Face Likeness", "Border Style", "Illustration Style"], prompt: "Create an alternate but highly recognizable premium branch. Slightly mutated colorway." }
    ];

    const reforgePresets = isMythic ? mythicPresets : standardPresets;

    const precisionTweaks = [
        {
            category: "Clarity",
            items: [
                { id: "cleaner_text", label: "Cleaner Text", locks: ['Face Likeness', 'Color Palette', 'Archetype', 'Pose', 'Border Style', 'Illustration Style'] },
                { id: "improve_readability", label: "Improve Readability", locks: ['Face Likeness', 'Color Palette', 'Archetype', 'Pose', 'Border Style', 'Illustration Style'] },
                { id: "better_border_clarity", label: "Better Border Clarity", locks: ['Face Likeness', 'Color Palette', 'Archetype', 'Pose', 'Illustration Style'] }
            ]
        },
        {
            category: "Visual Polish",
            items: [
                { id: "better_armor", label: "Better Armor", locks: ['Face Likeness', 'Color Palette', 'Archetype', 'Pose', 'Border Style', 'Illustration Style'] },
                { id: "better_weapon", label: "Better Weapon", locks: ['Face Likeness', 'Color Palette', 'Archetype', 'Pose', 'Border Style', 'Illustration Style'] },
                { id: "stronger_aura", label: "Stronger Aura", locks: ['Face Likeness', 'Color Palette', 'Archetype', 'Pose', 'Border Style', 'Illustration Style'] },
                { id: "improve_pose_slightly", label: "Improve Pose Slightly", locks: ['Face Likeness', 'Color Palette', 'Archetype', 'Border Style', 'Illustration Style'] }
            ]
        },
        {
            category: "Mood / Tone",
            items: [
                { id: "darker_background", label: "Darker Background", locks: ['Face Likeness', 'Color Palette', 'Archetype', 'Pose', 'Border Style', 'Illustration Style'] },
                { id: "more_serious", label: "More Serious", locks: ['Face Likeness', 'Color Palette', 'Archetype', 'Pose', 'Border Style', 'Illustration Style'] },
                { id: "slightly_more_mythic", label: "Slightly More Mythic", locks: ['Face Likeness', 'Archetype', 'Pose', 'Border Style', 'Illustration Style'] },
                { id: "more_fantasy", label: "More Fantasy", locks: ['Face Likeness', 'Color Palette', 'Archetype', 'Pose', 'Border Style', 'Illustration Style'] }
            ]
        }
    ];

    const quickChips = [
        "More Mythic", "Darker Tone", "More Sci-Fi",
        "More Fantasy", "Funnier", "More Serious",
        "Better Armor", "Better Weapon", "Cleaner Text"
    ];

    const availableLocks = ["Face Likeness", "Color Palette", "Archetype", "Pose", "Border Style", "Illustration Style"];
    const strengthLevels = isMythic ? ["Subtle", "Moderate"] : ["Subtle", "Moderate", "Strong", "Wild"];

    useEffect(() => {
        if (isOpen) {
            soundManager.playSound('sfx_ui_open', { volume: 0.5 });
            // Reset state on open
            setPath(null);
            setInstructions('');
            setMode('visual');
            setSelectedChips([]);
            setLocks(['Face Likeness', 'Color Palette', 'Illustration Style']);
            setVariationStrength('Subtle');
            setSelectedPreset(null);
            setTweakTarget('');
            setShowAdvancedTweak(false);
        } else {
            soundManager.playSound('sfx_ui_close', { volume: 0.4 });
        }
    }, [isOpen]);

    const handleBack = () => {
        soundManager.playSound('sfx_ui_click', { volume: 0.4 });
        setPath(null);
    };

    const applyPreset = (preset: any) => {
        soundManager.playSound('sfx_ui_click', { volume: 0.5 });
        setSelectedPreset(preset);
        setMode(preset.mode);
        setVariationStrength(preset.strength);
        setLocks(preset.locks);
        // We do not set instructions from the preset prompt here, we let the user type custom instructions
        // But we will inject the preset's prompt into the backend payload
        setSelectedChips([]);
    };

    const handleChipToggle = (chip: string) => {
        soundManager.playSound('sfx_chip_toggle', { volume: 0.3 });
        setSelectedChips(prev =>
            prev.includes(chip) ? prev.filter(c => c !== chip) : [...prev, chip]
        );
    };

    const selectTweak = (tweak: any) => {
        soundManager.playSound('sfx_ui_click', { volume: 0.5 });
        setTweakTarget(tweak.label);
        setLocks(tweak.locks);
        setVariationStrength('Subtle');
    };

    const handleSubmit = () => {
        soundManager.playSound('sfx_reforge_start', { volume: 0.8 });

        let finalInstructions = instructions;

        if (path === 'quick' && selectedPreset) {
            finalInstructions = `${selectedPreset.prompt} ${instructions ? '- ' + instructions : ''}`.trim();
        } else if (path === 'precision') {
            finalInstructions = `Tweak Target: ${tweakTarget}. ${instructions ? '- ' + instructions : ''}`.trim();
            // Force mode to visual for simple tweaks to prevent archetype jumps
            if (!mode) setMode('visual');
        }

        onRemix(finalInstructions, mode, selectedChips, preservationLocks, variationStrength);
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
                    <div className="p-4 border-b border-white/10 flex items-center bg-zinc-950/50">
                        {path && (
                            <button onClick={handleBack} className="p-2 mr-2 -ml-2 text-zinc-400 hover:text-white rounded-full hover:bg-white/5 transition-colors">
                                <ChevronLeft size={20} />
                            </button>
                        )}
                        <h2 className={`text-xl font-bold flex items-center gap-2 flex-1 ${isMythic ? 'text-amber-400' : ''}`}>
                            {isMythic ? <Crown className="text-amber-400" size={20} /> : <Wand2 className="text-purple-400" size={20} />}
                            {path === 'quick' && "Quick Reforge"}
                            {path === 'precision' && "Precision Tweak"}
                            {path === 'advanced' && "Advanced Reforge"}
                            {!path && (isMythic ? 'Mythic Reforge' : 'Reforge / Remix')}
                        </h2>
                        <button onClick={onClose} className="p-2 -mr-2 text-zinc-500 hover:text-white rounded-full hover:bg-white/5 transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-6 overflow-y-auto flex-1 space-y-6">

                        {/* ===================================== */}
                        {/* PATH CHOOSER (DEFAULT SCREEN) */}
                        {/* ===================================== */}
                        {!path && (
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-1">Choose your path</label>

                                <button
                                    onClick={() => { soundManager.playSound('sfx_ui_click', { volume: 0.5 }); setPath('quick'); setMode('visual'); }}
                                    className="w-full group flex items-start gap-4 p-4 rounded-2xl border border-white/5 bg-zinc-950 hover:bg-purple-900/10 hover:border-purple-500/30 transition-all text-left"
                                >
                                    <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl group-hover:scale-110 transition-transform">
                                        <Sparkles size={24} />
                                    </div>
                                    <div>
                                        <div className="font-bold text-white text-lg">Quick Reforge</div>
                                        <div className="text-sm text-zinc-400 mt-1">Guided transformations. Fast and powerful.</div>
                                    </div>
                                </button>

                                <button
                                    onClick={() => { soundManager.playSound('sfx_ui_click', { volume: 0.5 }); setPath('precision'); setMode('visual'); }}
                                    className="w-full group flex items-start gap-4 p-4 rounded-2xl border border-white/5 bg-zinc-950 hover:bg-blue-900/10 hover:border-blue-500/30 transition-all text-left"
                                >
                                    <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl group-hover:scale-110 transition-transform">
                                        <Target size={24} />
                                    </div>
                                    <div>
                                        <div className="font-bold text-white text-lg">Precision Tweak</div>
                                        <div className="text-sm text-zinc-400 mt-1">One careful improvement. Maximum preservation.</div>
                                    </div>
                                </button>

                                <button
                                    onClick={() => { soundManager.playSound('sfx_ui_click', { volume: 0.5 }); setPath('advanced'); setMode('visual'); }}
                                    className="w-full group flex items-start gap-4 p-4 rounded-2xl border border-white/5 bg-zinc-950 hover:bg-zinc-800 hover:border-white/20 transition-all text-left"
                                >
                                    <div className="p-3 bg-zinc-800 text-zinc-300 rounded-xl group-hover:scale-110 transition-transform">
                                        <Settings size={24} />
                                    </div>
                                    <div>
                                        <div className="font-bold text-white text-lg">Advanced Reforge</div>
                                        <div className="text-sm text-zinc-400 mt-1">Full forge control. All parameters unlocked.</div>
                                    </div>
                                </button>
                            </div>
                        )}

                        {/* ===================================== */}
                        {/* QUICK REFORGE PATH */}
                        {/* ===================================== */}
                        {path === 'quick' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="space-y-3">
                                    <label className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Select Preset</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {reforgePresets.map(preset => (
                                            <button
                                                key={preset.name}
                                                onClick={() => applyPreset(preset)}
                                                className={`flex flex-col items-start gap-1 p-3 rounded-xl border transition-all text-left ${selectedPreset?.name === preset.name ? 'bg-purple-500/20 border-purple-500/50' : 'bg-zinc-950 border-white/5 hover:bg-zinc-800 hover:border-white/20'}`}
                                            >
                                                <div className={`font-bold flex items-center gap-1 ${selectedPreset?.name === preset.name ? 'text-purple-300' : 'text-zinc-200'}`}>
                                                    {preset.icon} {preset.name}
                                                </div>
                                                <div className="text-[10px] text-zinc-500 leading-tight">{preset.desc}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {selectedPreset && (
                                    <div className="p-3 rounded-xl bg-zinc-950/50 border border-white/5 text-sm">
                                        <div className="font-bold text-zinc-300 mb-1 flex items-center gap-2">
                                            <Shield size={14} className="text-emerald-400" />
                                            Trust Summary
                                        </div>
                                        <ul className="text-zinc-400 space-y-1 ml-5 list-disc text-xs">
                                            <li>Focuses heavily on: <span className="text-zinc-200">{selectedPreset.name}</span> logic</li>
                                            <li>Safely locks: {selectedPreset.locks.join(', ')}</li>
                                            <li>Uses <span className="text-purple-300 font-bold">{selectedPreset.strength}</span> variation drift</li>
                                        </ul>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Additional Request (Optional)</label>
                                    <textarea
                                        value={instructions}
                                        onChange={(e) => setInstructions(e.target.value)}
                                        placeholder="Add a tiny note (e.g. 'Make the armor glowing')"
                                        className="w-full h-16 bg-zinc-950 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-purple-500/50 resize-none"
                                    />
                                </div>
                            </div>
                        )}

                        {/* ===================================== */}
                        {/* PRECISION TWEAK PATH */}
                        {/* ===================================== */}
                        {path === 'precision' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">

                                <div className="p-3 rounded-xl bg-blue-900/10 border border-blue-500/20 flex flex-col gap-2">
                                    <div className="font-bold text-blue-300 text-sm flex items-center gap-2">
                                        <Shield size={16} /> Protected by default
                                    </div>
                                    <div className="text-xs text-blue-400/70 leading-relaxed">
                                        Identity, Illustration Style, Face Likeness, Border, and Color Palette are strictly preserved. Drift is forced to minimum.
                                    </div>
                                </div>

                                <div className="space-y-5">
                                    {precisionTweaks.map(category => (
                                        <div key={category.category} className="space-y-2">
                                            <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest pl-1">{category.category}</label>
                                            <div className="flex flex-wrap gap-2">
                                                {category.items.map(tweak => (
                                                    <button
                                                        key={tweak.id}
                                                        onClick={() => selectTweak(tweak)}
                                                        className={`px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${tweakTarget === tweak.label ? 'bg-blue-500/20 border-blue-500/50 text-blue-300 shadow-[0_0_10px_rgba(59,130,246,0.2)]' : 'bg-zinc-950 border-white/10 text-zinc-300 hover:text-white hover:border-white/30'}`}
                                                    >
                                                        {tweak.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider pl-1">Target Note (Optional)</label>
                                    <input
                                        type="text"
                                        value={instructions}
                                        onChange={(e) => setInstructions(e.target.value)}
                                        placeholder="Best for one small refinement..."
                                        className="w-full bg-zinc-950 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500/50"
                                    />
                                </div>

                                <div className="border border-white/5 rounded-xl bg-zinc-950 overflow-hidden">
                                    <button
                                        onClick={() => setShowAdvancedTweak(!showAdvancedTweak)}
                                        className="w-full flex items-center justify-between p-3 text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition-colors"
                                    >
                                        <span className="flex items-center gap-2"><Settings size={14} /> Advanced Tweaks</span>
                                        {showAdvancedTweak ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                    </button>

                                    {showAdvancedTweak && (
                                        <div className="p-4 border-t border-white/5 space-y-4 animate-in slide-in-from-top-2 duration-200">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Adjustment Locks</label>
                                                <div className="flex flex-wrap gap-1">
                                                    {availableLocks.map(lock => (
                                                        <button
                                                            key={lock}
                                                            onClick={() => {
                                                                soundManager.playSound('sfx_chip_toggle', { volume: 0.2 });
                                                                setLocks(prev => prev.includes(lock) ? prev.filter(l => l !== lock) : [...prev, lock]);
                                                            }}
                                                            className={`px-2 py-1 rounded-full text-[10px] font-medium border transition-colors ${preservationLocks.includes(lock) ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300' : 'bg-zinc-900 border-white/10 text-zinc-500 hover:text-white hover:border-white/30'}`}
                                                        >
                                                            {lock}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Forced Strength</label>
                                                <div className={`grid gap-1 ${isMythic ? 'grid-cols-2' : 'grid-cols-4'}`}>
                                                    {strengthLevels.map(level => (
                                                        <button
                                                            key={level}
                                                            onClick={() => {
                                                                soundManager.playSound('sfx_chip_toggle', { volume: 0.2 });
                                                                setVariationStrength(level);
                                                            }}
                                                            className={`py-1.5 rounded-lg text-[10px] font-bold border transition-colors text-center ${variationStrength === level ? 'bg-blue-500/20 border-blue-500/50 text-blue-300' : 'bg-zinc-900 border-white/5 text-zinc-500 hover:text-white hover:border-white/20'}`}
                                                        >
                                                            {level}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ===================================== */}
                        {/* ADVANCED REFORGE PATH */}
                        {/* ===================================== */}
                        {path === 'advanced' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
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
                                                className={`py-2 rounded-xl text-xs font-bold border transition-colors text-center ${variationStrength === level ? 'bg-violet-500/20 border-violet-500/50 text-violet-300' : 'bg-zinc-950/50 border-white/5 text-zinc-500 hover:text-white hover:border-white/20'}`}
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
                        )}

                    </div>

                    <div className="p-4 border-t border-white/10 bg-zinc-950">
                        <button
                            onClick={handleSubmit}
                            disabled={!path || (path === 'quick' && !selectedPreset) || (path === 'precision' && !tweakTarget)}
                            className={`w-full flex justify-center items-center gap-2 ${(path && ((path === 'quick' && selectedPreset) || (path === 'precision' && tweakTarget) || path === 'advanced')) ? (isMythic ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-[0_0_15px_rgba(245,158,11,0.4)] text-white' : 'bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 shadow-[0_0_15px_rgba(168,85,247,0.4)] text-white') : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'} font-bold py-4 px-6 rounded-xl transition-all duration-300`}
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
