import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Card from './Card';
import { soundManager } from '../lib/soundManager';

const STATUS_LINES = [
    "Scanning identity signature...",
    "Stabilizing archetype matrix...",
    "Manifesting weapon form...",
    "Infusing aura field...",
    "Resolving final title...",
    "Locking mythic frame..."
];

export default function CardRevealSequence({
    card,
    onComplete
}: {
    card: any;
    onComplete: () => void;
}) {
    const [phase, setPhase] = useState<'scan' | 'tease' | 'reveal'>('scan');
    const [statusIndex, setStatusIndex] = useState(0);

    // Speed up or slow down based on rarity (tier)
    const isMythic = card.tier === 'mythic' || card.is_premium;
    const isLegendary = card.tier === 'legendary';

    const scanDuration = isMythic ? 2500 : isLegendary ? 2000 : 1800;
    const teaseDuration = isMythic ? 1200 : isLegendary ? 800 : 600;

    useEffect(() => {
        // Start ambient loop when sequence mounts
        soundManager.playLoop('sfx_reveal_ambient_loop', { volume: isMythic ? 0.8 : 0.4 });
        return () => soundManager.stopLoop('sfx_reveal_ambient_loop', 500);
    }, [isMythic]);

    useEffect(() => {
        // Cycle status text during scan phase
        let statusInterval: NodeJS.Timeout;
        if (phase === 'scan') {
            statusInterval = setInterval(() => {
                setStatusIndex(prev => {
                    const next = Math.min(prev + 1, STATUS_LINES.length - 1);
                    if (next > prev) {
                        soundManager.playSound('sfx_reveal_tick', { volume: 0.3 });
                    }
                    return next;
                });
            }, scanDuration / STATUS_LINES.length);
        }
        return () => clearInterval(statusInterval);
    }, [phase, scanDuration]);

    useEffect(() => {
        // Phase transitions
        if (phase === 'scan') {
            const timer = setTimeout(() => {
                soundManager.playSound('sfx_reveal_tease', { volume: isMythic ? 0.9 : 0.6 });
                setPhase('tease');
            }, scanDuration);
            return () => clearTimeout(timer);
        } else if (phase === 'tease') {
            const timer = setTimeout(() => {
                soundManager.stopLoop('sfx_reveal_ambient_loop', 300);
                soundManager.playSound('sfx_card_flip', { volume: isLegendary || isMythic ? 1 : 0.7 });
                setPhase('reveal');

                // Trigger impact when the spring animation lands
                setTimeout(() => {
                    soundManager.playSound('sfx_card_impact', { volume: isMythic ? 1 : 0.8 });

                    // Trigger shimmer shortly after impact
                    setTimeout(() => {
                        soundManager.playSound('sfx_foil_shimmer', { volume: isLegendary || isMythic ? 0.8 : 0.5 });
                    }, 800);
                }, 600);
            }, teaseDuration);
            return () => clearTimeout(timer);
        } else if (phase === 'reveal') {
            // Allow the reveal animation to play, then signal completion to parent
            const timer = setTimeout(() => onComplete(), 2000);
            return () => clearTimeout(timer);
        }
    }, [phase, scanDuration, teaseDuration, onComplete, isMythic, isLegendary]);

    const handleSkip = () => {
        soundManager.stopLoop('sfx_reveal_ambient_loop', 0);
        soundManager.playSound('sfx_card_impact', { volume: 0.5 });
        setPhase('reveal');
        onComplete();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950 overflow-hidden">
            {/* Dynamic Background */}
            <motion.div
                className="absolute inset-0 z-0 bg-gradient-to-b from-purple-900/20 to-black"
                animate={{
                    opacity: phase === 'reveal' ? 0.3 : 1,
                    scale: phase === 'reveal' ? 1.1 : 1
                }}
                transition={{ duration: 1 }}
            />

            <AnimatePresence mode="wait">
                {phase === 'scan' && (
                    <motion.div
                        key="scan"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, scale: 1.1 }}
                        className="relative z-10 flex flex-col items-center justify-center w-full max-w-sm"
                    >
                        <div className="relative w-48 h-72 mb-8 rounded-xl border border-white/10 bg-black/50 overflow-hidden flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.2)]">
                            {/* Silhouette / Blur */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/20 to-transparent animate-pulse" />
                            <div className="w-12 h-12 rounded-full border-t-2 border-r-2 border-purple-400 animate-spin" />
                        </div>

                        <div className="h-8 flex items-center justify-center">
                            <motion.p
                                key={statusIndex}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5 }}
                                className="text-sm font-mono text-purple-300 tracking-wider"
                            >
                                {STATUS_LINES[statusIndex]}
                            </motion.p>
                        </div>
                    </motion.div>
                )}

                {phase === 'tease' && (
                    <motion.div
                        key="tease"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, filter: "blur(10px)" }}
                        transition={{ duration: 0.3 }}
                        className="relative z-10 flex flex-col items-center justify-center text-center px-4"
                    >
                        <h2 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-300 tracking-tight mb-2 drop-shadow-lg">
                            {card.identity}
                        </h2>
                        <p className="text-lg md:text-xl font-medium text-white/70 tracking-widest uppercase">
                            {card.strengths}
                        </p>
                        {isMythic && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="mt-6 px-4 py-1 bg-red-500/20 border border-red-500/50 rounded-full text-red-400 text-xs font-bold tracking-[0.2em]"
                            >
                                BOSS MODE DETECTED
                            </motion.div>
                        )}
                    </motion.div>
                )}

                {phase === 'reveal' && (
                    <motion.div
                        key="reveal"
                        initial={{ opacity: 0, scale: 0.8, y: 50, rotateX: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
                        transition={{ type: "spring", damping: 15, stiffness: 100 }}
                        className="relative z-20 w-full max-w-sm px-4 md:px-0"
                    >
                        {/* Flash Effect behind card */}
                        <motion.div
                            initial={{ opacity: 1, scale: 0.8 }}
                            animate={{ opacity: 0, scale: 1.5 }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className={`absolute inset-0 bg-gradient-to-t ${isMythic ? 'from-red-500 via-purple-500' : isLegendary ? 'from-amber-500 via-yellow-200' : 'from-purple-500 via-white'} to-transparent blur-3xl rounded-full -z-10`}
                        />

                        <Card card={card} isReveal={true} motionEnabled={true} />

                    </motion.div>
                )}
            </AnimatePresence>

            {/* Skip Button */}
            {phase !== 'reveal' && (
                <button
                    onClick={handleSkip}
                    className="absolute bottom-12 text-sm font-medium text-white/40 hover:text-white transition-colors z-50 px-6 py-2 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-sm"
                >
                    Skip Reveal &raquo;
                </button>
            )}
        </div>
    );
}
