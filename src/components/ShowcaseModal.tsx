import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Globe, Lock, ShieldAlert, Users, Swords, Search } from "lucide-react";
import { fetchWithAuth, API_URL } from "../lib/api";
import { soundManager } from "../lib/soundManager";

interface ShowcaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    card: any;
    onUpdate: (updatedCard: any) => void;
}

export default function ShowcaseModal({ isOpen, onClose, card, onUpdate }: ShowcaseModalProps) {
    const [isPublic, setIsPublic] = useState(card?.is_public === 1);
    const [saving, setSaving] = useState(false);

    const [collection, setCollection] = useState<any[]>([]);
    const [rivalId, setRivalId] = useState<string>(card?.rival_id || "");
    const [duoId, setDuoId] = useState<string>(card?.duo_id || "");

    useEffect(() => {
        setIsPublic(card?.is_public === 1);
        setRivalId(card?.rival_id || "");
        setDuoId(card?.duo_id || "");
    }, [card]);

    useEffect(() => {
        if (isOpen) {
            fetchWithAuth("/cards/my-cards")
                .then(data => {
                    // Filter out the current card
                    setCollection(data.cards?.filter((c: any) => c.id !== card.id) || []);
                })
                .catch(console.error);
        }
    }, [isOpen, card.id]);

    const handleToggleVisibility = async () => {
        soundManager.playSound('sfx_ui_click', { volume: 0.3 });
        const newStatus = !isPublic;
        setIsPublic(newStatus);
        try {
            await fetchWithAuth(`/cards/${card.short_id || card.id}/visibility`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ is_public: newStatus })
            });
            onUpdate({ ...card, is_public: newStatus ? 1 : 0 });
        } catch (err) {
            console.error(err);
            setIsPublic(!newStatus);
        }
    };

    const handleSaveRelationships = async () => {
        setSaving(true);
        soundManager.playSound('sfx_ui_click', { volume: 0.5 });
        try {
            await fetchWithAuth(`/cards/${card.short_id || card.id}/relationships`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ rival_id: rivalId, duo_id: duoId })
            });
            onUpdate({ ...card, rival_id: rivalId, duo_id: duoId });
            onClose();
        } catch (err) {
            console.error(err);
            alert("Failed to save relationships.");
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    onClick={onClose}
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative bg-zinc-900 border border-white/10 rounded-3xl w-full max-w-lg p-6 shadow-2xl overflow-hidden"
                >
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold flex items-center gap-2"><Globe className="text-emerald-400" /> Showcase Settings</h2>
                        <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="space-y-8">
                        {/* Privacy Toggle */}
                        <div>
                            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-3">Public Visibility</h3>
                            <div onClick={handleToggleVisibility} className={`cursor-pointer border p-4 rounded-xl flex items-center justify-between transition-all ${isPublic ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-zinc-950 border-white/5'}`}>
                                <div className="flex items-center gap-3">
                                    {isPublic ? <Globe className="text-emerald-400" size={24} /> : <Lock className="text-zinc-500" size={24} />}
                                    <div>
                                        <p className={`font-bold ${isPublic ? 'text-emerald-400' : 'text-zinc-400'}`}>{isPublic ? 'Publicly Visible' : 'Private Artifact'}</p>
                                        <p className="text-xs text-zinc-500">{isPublic ? 'Anyone with the link can view this card and its lineage.' : 'Only you can see this artifact.'}</p>
                                    </div>
                                </div>
                                <div className={`w-12 h-6 rounded-full p-1 transition-colors ${isPublic ? 'bg-emerald-500' : 'bg-zinc-700'}`}>
                                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${isPublic ? 'translate-x-6' : 'translate-x-0'}`} />
                                </div>
                            </div>
                        </div>

                        {/* Relationships */}
                        <div>
                            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-3">Mythology Links</h3>
                            <p className="text-xs text-zinc-500 mb-4">Link this character to others in your collection to build their story.</p>

                            <div className="space-y-4">
                                <div className="bg-zinc-950 border border-white/5 rounded-xl p-3">
                                    <label className="flex items-center gap-2 text-xs font-bold text-red-400 uppercase mb-2"><Swords size={14} /> Nemesis / Rival</label>
                                    <select
                                        value={rivalId}
                                        onChange={(e) => setRivalId(e.target.value)}
                                        className="w-full bg-zinc-900 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-red-500/50"
                                    >
                                        <option value="">None</option>
                                        {collection.map(c => <option key={c.id} value={c.id}>{c.identity} {c.is_featured_version ? '(Canon)' : `(v${c.version_number})`}</option>)}
                                    </select>
                                </div>

                                <div className="bg-zinc-950 border border-white/5 rounded-xl p-3">
                                    <label className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase mb-2"><Users size={14} /> Duo Partner</label>
                                    <select
                                        value={duoId}
                                        onChange={(e) => setDuoId(e.target.value)}
                                        className="w-full bg-zinc-900 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-blue-500/50"
                                    >
                                        <option value="">None</option>
                                        {collection.map(c => <option key={c.id} value={c.id}>{c.identity} {c.is_featured_version ? '(Canon)' : `(v${c.version_number})`}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 pt-4 border-t border-white/10 flex justify-end gap-3">
                        <button onClick={onClose} className="px-5 py-2 rounded-xl text-sm font-bold text-zinc-400 hover:text-white">Cancel</button>
                        <button onClick={handleSaveRelationships} disabled={saving} className="px-5 py-2 rounded-xl text-sm font-bold bg-white text-black hover:bg-zinc-200 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                            {saving ? 'Saving...' : 'Save Settings'}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
