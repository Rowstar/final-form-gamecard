import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { Sparkles, Zap, Shield } from "lucide-react";

export default function Home() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center text-center pt-12 sm:pt-24"
    >
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-sm font-medium mb-8 border border-emerald-500/20">
        <Sparkles size={16} />
        <span>Unleash the ultimate game card version of yourself.</span>
      </div>

      <h1 className="text-5xl sm:text-7xl font-bold tracking-tighter mb-6 bg-gradient-to-br from-white to-zinc-500 bg-clip-text text-transparent">
        Discover Your Final Form
      </h1>

      <p className="text-zinc-400 max-w-md mb-12 text-lg leading-relaxed">
        Forge your identity, choose your element, and generate a legendary trading card.
      </p>

      <Link
        to="/create"
        className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-zinc-950 bg-white rounded-2xl overflow-hidden transition-transform active:scale-95 hover:scale-105"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <span className="relative z-10 flex items-center gap-2">
          Create Card <Zap size={18} />
        </span>
      </Link>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-24 w-full text-left">
        <div className="p-6 rounded-3xl bg-zinc-900/50 border border-white/5">
          <Shield className="text-emerald-400 mb-4" size={24} />
          <h3 className="font-semibold mb-2">Personalized Creation</h3>
          <p className="text-sm text-zinc-500">Generate a unique trading card character tailored to your epic fantasy.</p>
        </div>
        <div className="p-6 rounded-3xl bg-zinc-900/50 border border-white/5">
          <Sparkles className="text-emerald-400 mb-4" size={24} />
          <h3 className="font-semibold mb-2">Unique Artifacts</h3>
          <p className="text-sm text-zinc-500">Each card is uniquely yours with a verifiable ID and server-signed record.</p>
        </div>
        <div className="p-6 rounded-3xl bg-zinc-900/50 border border-white/5">
          <Zap className="text-emerald-400 mb-4" size={24} />
          <h3 className="font-semibold mb-2">Forge Lab</h3>
          <p className="text-sm text-zinc-500">Merge and reforge your cards to discover new ultimate forms.</p>
        </div>
      </div>
    </motion.div>
  );
}
