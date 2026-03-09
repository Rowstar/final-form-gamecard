import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { API_URL } from "../lib/api.ts";
import Card from "../components/Card.tsx";
import { motion } from "motion/react";
import { Sparkles, ArrowRight, ShieldCheck, Crown, GitBranch } from "lucide-react";

export default function PublicCard() {
    const { id } = useParams();
    const [card, setCard] = useState<any>(null);
    const [relationships, setRelationships] = useState<any>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetch(`${API_URL}/cards/public/${id}`)
            .then(res => res.json())
            .then(data => {
                if (data.error) throw new Error(data.error);
                setCard(data.card);
                setRelationships(data.relationships || {});
                setLoading(false);
            })
            .catch(err => {
                setError(err.message || "This artifact is private or does not exist.");
                setLoading(false);
            });
    }, [id]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Sparkles className="animate-spin text-emerald-400" size={32} />
                <p className="text-zinc-400 font-medium animate-pulse">Accessing public artifact...</p>
            </div>
        );
    }

    if (error || !card) {
        return (
            <div className="text-center mt-24">
                <ShieldCheck className="mx-auto text-zinc-600 mb-4" size={48} />
                <h2 className="text-2xl font-bold text-red-400 mb-4">Access Denied</h2>
                <p className="text-zinc-400 mb-8 max-w-sm mx-auto">{error}</p>
                <Link to="/" className="text-emerald-400 hover:text-emerald-300 underline font-bold">Forge Your Own</Link>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center pt-8 pb-16 relative overflow-hidden px-4">
            {/* Premium Header */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10 text-center flex flex-col items-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold mb-4 border border-emerald-500/20 uppercase tracking-widest">
                    Verified Artifact <ShieldCheck size={14} />
                </div>
                <h1 className="text-4xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 to-zinc-500 mb-2">
                    {card.identity}
                </h1>
                <p className="text-emerald-400 font-medium mix-blend-plus-lighter">{card.strengths}</p>
                {card.version_number > 1 && (
                    <p className="text-purple-400/80 text-sm mt-2 font-bold uppercase tracking-wider flex items-center gap-1 justify-center"><GitBranch size={14} /> Evolution Variant v{card.version_number}</p>
                )}
                {card.is_featured_version === 1 && (
                    <p className="text-amber-500/90 text-sm mt-2 font-black uppercase tracking-widest flex items-center gap-1 justify-center"><Crown size={14} className="fill-amber-500/50" /> Featured Canon Form</p>
                )}
            </motion.div>

            {/* Main Card */}
            <div className="w-full max-w-sm relative">
                <Card card={card} isReveal={false} motionEnabled={true} />
            </div>

            {/* Relationships */}
            {(relationships.rival || relationships.duo) && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-12 w-full max-w-md bg-zinc-900/50 border border-white/5 p-6 rounded-3xl backdrop-blur-sm">
                    <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-4 flex justify-between">
                        <span>Known Relationships</span>
                    </h3>
                    <div className="flex flex-col gap-3">
                        {relationships.rival && (
                            <Link to={`/share/card/${relationships.rival.short_id || relationships.rival.id}`} className="group flex justify-between items-center p-3 rounded-xl bg-red-950/20 border border-red-500/10 hover:bg-red-900/30 hover:border-red-500/30 transition-all">
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider mb-0.5">Rival Artifact</span>
                                    <span className="text-zinc-200 font-bold">{relationships.rival.identity}</span>
                                </div>
                                <ArrowRight size={16} className="text-red-400 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                            </Link>
                        )}
                        {relationships.duo && (
                            <Link to={`/share/card/${relationships.duo.short_id || relationships.duo.id}`} className="group flex justify-between items-center p-3 rounded-xl bg-blue-950/20 border border-blue-500/10 hover:bg-blue-900/30 hover:border-blue-500/30 transition-all">
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider mb-0.5">Duo Partner</span>
                                    <span className="text-zinc-200 font-bold">{relationships.duo.identity}</span>
                                </div>
                                <ArrowRight size={16} className="text-blue-400 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                            </Link>
                        )}
                    </div>
                </motion.div>
            )}

            {/* CTA Loop */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-16 text-center border-t border-white/5 pt-8 w-full">
                <p className="text-zinc-500 mb-4">Want to forge your own legendary artifact?</p>
                <Link to="/" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-black font-black uppercase tracking-wider rounded-xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                    <Sparkles size={18} /> Enter the Forge
                </Link>
            </motion.div>
        </div>
    );
}
