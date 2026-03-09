import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { API_URL } from "../lib/api.ts";
import Card from "../components/Card.tsx";
import { motion } from "motion/react";
import { Sparkles, ShieldCheck, Crown, GitBranch } from "lucide-react";

export default function PublicLineage() {
    const { id } = useParams();
    const [variants, setVariants] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetch(`${API_URL}/cards/public/${id}/lineage`)
            .then(res => res.json())
            .then(data => {
                if (data.error) throw new Error(data.error);
                setVariants(data.variants || []);
                setLoading(false);
            })
            .catch(err => {
                setError(err.message || "This lineage is private or does not exist.");
                setLoading(false);
            });
    }, [id]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Sparkles className="animate-spin text-emerald-400" size={32} />
                <p className="text-zinc-400 font-medium animate-pulse">Accessing public lineage...</p>
            </div>
        );
    }

    if (error || variants.length === 0) {
        return (
            <div className="text-center mt-24">
                <ShieldCheck className="mx-auto text-zinc-600 mb-4" size={48} />
                <h2 className="text-2xl font-bold text-red-400 mb-4">Access Denied</h2>
                <p className="text-zinc-400 mb-8 max-w-sm mx-auto">{error}</p>
                <Link to="/" className="text-emerald-400 hover:text-emerald-300 underline font-bold">Forge Your Own</Link>
            </div>
        );
    }

    const rootCard = variants.find(v => v.version_number === 1) || variants[0];
    const featuredCard = variants.find(v => v.is_featured_version === 1);

    return (
        <div className="flex flex-col items-center pt-8 pb-16 relative overflow-hidden px-4 md:px-8 w-full max-w-7xl mx-auto">
            {/* Premium Header */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-12 text-center flex flex-col items-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-xs font-bold mb-4 border border-purple-500/20 uppercase tracking-widest">
                    Evolution Gallery <GitBranch size={14} />
                </div>
                <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 to-zinc-500 mb-2">
                    Lineage of {rootCard?.identity}
                </h1>
                <p className="text-zinc-400 font-medium max-w-xl mx-auto">Explore all publicly available evolutions and reforged variants of this character identity.</p>
            </motion.div>

            {/* Lineage Timeline Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 lg:gap-12 w-full mt-8">
                {variants.map((v, i) => (
                    <motion.div key={v.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="flex flex-col items-center gap-4 relative">

                        <div className="w-full flex justify-between items-center px-2">
                            <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest bg-zinc-900 border border-white/5 px-2 py-1 rounded">
                                Version {v.version_number}
                            </span>
                            {v.generation_type === 'evolution' && <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider">Ascended</span>}
                            {v.generation_type === 'forge' && <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">Origin Forge</span>}
                            {v.generation_type === 'remix' && <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider">Reforged</span>}
                        </div>

                        <div className="w-full relative">
                            {v.is_featured_version === 1 && (
                                <div className="absolute -top-3 -right-3 bg-amber-500 text-black px-3 py-1 rounded-full z-10 flex items-center gap-1 shadow-lg font-black text-[10px] uppercase tracking-wider">
                                    <Crown size={12} className="fill-black" /> Canon
                                </div>
                            )}
                            <Link to={`/share/card/${v.short_id || v.id}`} className="block transition-transform hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] rounded-2xl">
                                <Card card={v} isReveal={false} motionEnabled={false} />
                            </Link>
                        </div>

                        {v.generation_delta && (
                            <div className="text-[10px] text-zinc-500 italic max-w-xs text-center mt-2 h-8 overflow-hidden line-clamp-2 px-4 shadow-[inset_0_10px_20px_rgba(0,0,0,0.5)]">
                                {(() => {
                                    try {
                                        const d = typeof v.generation_delta === 'string' ? JSON.parse(v.generation_delta) : v.generation_delta;
                                        return `Delta: ${d.instructions || 'Standard'}`;
                                    } catch (e) { return null; }
                                })()}
                            </div>
                        )}

                    </motion.div>
                ))}
            </div>

            {/* CTA Loop */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-24 text-center border-t border-white/5 pt-12 w-full">
                <p className="text-zinc-500 mb-4">Start your own evolution tree today.</p>
                <Link to="/" className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-500 text-black font-black uppercase tracking-wider rounded-xl hover:bg-emerald-400 transition-colors shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                    <Sparkles size={18} /> Forge Your First Card
                </Link>
            </motion.div>
        </div>
    );
}
