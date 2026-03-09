import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL, getAuthToken, fetchWithAuth } from "../lib/api.ts";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, Sparkles, Zap, X, ChevronDown, ChevronUp, Crown, Wand2, Eye } from "lucide-react";
import { soundManager } from "../lib/soundManager";

export default function Create() {
  const [step, setStep] = useState(1);
  const [useCredit, setUseCredit] = useState(false);
  const [user, setUser] = useState<any>(null);

  const [layoutPreset, setLayoutPreset] = useState("cinematic");
  const [showAdvancedLayout, setShowAdvancedLayout] = useState(false);

  // New tab state for massive option arrays
  const [activeThemeTab, setActiveThemeTab] = useState("Heroic / Noble");
  const [activeStyleTab, setActiveStyleTab] = useState("Fantasy");
  const [cardType, setCardType] = useState<'legendary' | 'mythic' | 'final_boss'>('legendary');

  const [formData, setFormData] = useState({
    theme: "",
    gender: "Not specified",
    traits: [] as string[],
    archetype: "",
    energyCore: "",
    intent: "",
    exaggeration: 5,
    humor: 5,
    photo: "",
    artStyle: "Dark Fantasy",
    displayOptions: {
      stats: false,
      ultimate: true,
      passives: false,
      resistances: false,
      weapon: false,
      quote: false
    },
    customText: {
      stats: "",
      ultimate: "",
      passives: "",
      resistances: "",
      weapon: "",
      quote: ""
    }
  });

  useEffect(() => {
    if (getAuthToken()) {
      fetchWithAuth("/auth/me")
        .then((data) => {
          setUser(data.user);
        })
        .catch(() => { });
    }
  }, []);

  // --- EXPANDED DATA STRUCTURES ---

  const genderOptions = [
    "Not specified", "Masculine", "Feminine", "Androgynous", "Other"
  ];

  const archetypes = [
    "Warrior", "Mage", "Assassin", "Paladin", "Monarch",
    "Warden", "Beastlord", "Duelist", "Summoner", "Tactician",
    "Berserker", "Trickster", "Oracle", "Titan", "Revenant"
  ];

  const energyCores = [
    "Solar", "Lunar", "Void", "Flame", "Storm",
    "Frost", "Arcane", "Blood", "Nature", "Crystal",
    "Shadow", "Light", "Time", "Gravity", "Aether"
  ];

  const themeCategories = [
    {
      name: "Heroic / Noble",
      options: [
        { name: "Heroic", desc: "noble, radiant, resolute" },
        { name: "Regal", desc: "majestic, ancient, wealthy" },
        { name: "Guardian", desc: "protective, shield, wall" },
        { name: "Divine", desc: "holy, transcendent, pure" },
        { name: "Honorable", desc: "sworn, loyal, steadfast" },
        { name: "Radiant", desc: "glowing, warm, blinding" },
        { name: "Resolute", desc: "unwavering, focused" },
        { name: "Ascendant", desc: "rising, evolving, peak" }
      ]
    },
    {
      name: "Dark / Dangerous",
      options: [
        { name: "Dark", desc: "brooding, abyssal, grim" },
        { name: "Infernal", desc: "demonic, ash, hellfire" },
        { name: "Cursed", desc: "withered, plagued, bound" },
        { name: "Ruthless", desc: "merciless, cruel, cold" },
        { name: "Corrupted", desc: "twisted, fallen, infected" },
        { name: "Ominous", desc: "dread, looming, heavy" },
        { name: "Tyrannical", desc: "dominating, oppressive" },
        { name: "Vengeful", desc: "wrathful, spiteful, hunting" }
      ]
    },
    {
      name: "Cosmic / Mystical",
      options: [
        { name: "Cosmic", desc: "celestial, reality-bending" },
        { name: "Celestial", desc: "stars, planets, orbit" },
        { name: "Arcane", desc: "magic, runes, esoteric" },
        { name: "Astral", desc: "spirit, projection, silver" },
        { name: "Void-Touched", desc: "empty, sucking, black" },
        { name: "Mythic", desc: "legendary, tall tale, old" },
        { name: "Dreamlike", desc: "hazy, surreal, floating" },
        { name: "Transcendent", desc: "beyond, higher plane" }
      ]
    },
    {
      name: "Wild / Chaotic",
      options: [
        { name: "Chaotic", desc: "unpredictable, wild, shifting" },
        { name: "Savage", desc: "untamed, raw, brutal" },
        { name: "Unpredictable", desc: "erratic, volatile" },
        { name: "Ferocious", desc: "fierce, biting, aggressive" },
        { name: "Primal", desc: "first, ancient, bone" },
        { name: "Berserk", desc: "frenzied, seeing red" },
        { name: "Trickster", desc: "clever, illusions, bait" },
        { name: "Stormborn", desc: "thunder, wind, rain" }
      ]
    },
    {
      name: "Calm / Elegant",
      options: [
        { name: "Calm", desc: "stoic, zen, calculated" },
        { name: "Mysterious", desc: "enigmatic, veiled, cryptic" },
        { name: "Stoic", desc: "unbothered, stone, still" },
        { name: "Elegant", desc: "graceful, fluid, precise" },
        { name: "Strategic", desc: "calculating, steps ahead" },
        { name: "Wise", desc: "aged, knowing, ancient" },
        { name: "Precise", desc: "exact, sharp, flawless" },
        { name: "Monastic", desc: "disciplined, temple, focused" }
      ]
    },
    {
      name: "Stylish / Extra",
      options: [
        { name: "Playful", desc: "stylish, mischievous, charm" },
        { name: "Flamboyant", desc: "loud, colorful, attention" },
        { name: "Glamorous", desc: "sparkling, beautiful, rich" },
        { name: "Theatrical", desc: "dramatic, stage, masks" },
        { name: "Mischievous", desc: "grinning, trouble" },
        { name: "Neon", desc: "bright, glowing colors" },
        { name: "Dripped Out", desc: "designer, jewelry, modern" },
        { name: "Unhinged", desc: "crazy, broken, smiling" }
      ]
    }
  ];

  const artStyleCategories = [
    {
      name: "Fantasy",
      options: [
        "Dark Fantasy", "High Fantasy", "Mythological",
        "Gothic Fantasy", "Celestial Fantasy", "Sword & Sorcery", "Eldritch Fantasy"
      ]
    },
    {
      name: "Sci-Fi / Tech",
      options: [
        "Neo-Cyberpunk", "Sci-Fi Realism", "Mecha",
        "Biotech Futurism", "Space Opera", "Post-Apocalyptic Tech", "Synthwave Futurism"
      ]
    },
    {
      name: "Anime / Stylized",
      options: [
        "Anime Heroic", "Ghibli-Inspired", "Shonen Power Fantasy",
        "Seinen Dark Fantasy", "Stylized JRPG", "Manga Inked", "Cinematic Anime"
      ]
    },
    {
      name: "Prestige / Painterly",
      options: [
        "Digital Oil Painting", "Hyper-Illustrated", "Collector Card Art",
        "Matte Painting", "Cinematic Concept Art", "Premium Splash Art", "Epic Fantasy Illustration"
      ]
    },
    {
      name: "Experimental",
      options: [
        "Glitch Arcane", "Dream Surreal", "Sacred Geometry",
        "Divine Iconography", "Comic Book Mythic", "Baroque Sci-Fi", "Holographic Relic"
      ]
    }
  ];

  const layoutPresetsList = [
    { id: 'cinematic', label: 'Cinematic', desc: 'Focus on art, title, and ultimate skill.', display: { stats: false, ultimate: true, passives: false, resistances: false, weapon: false, quote: false } },
    { id: 'battle', label: 'Battle Card', desc: 'Strong combat stats and tactical information.', display: { stats: true, ultimate: true, passives: true, resistances: true, weapon: true, quote: false } },
    { id: 'lore', label: 'Lore Card', desc: 'Thematic text and deep character identity.', display: { stats: false, ultimate: true, passives: true, resistances: false, weapon: false, quote: true } },
    { id: 'minimal', label: 'Minimal Mythic', desc: 'Cleaner composition maximizing visual frame impact.', display: { stats: false, ultimate: false, passives: false, resistances: false, weapon: false, quote: false } }
  ];

  const intentIdeas = [
    "A cosmic warrior who has awakened their sealed power",
    "A divine tactician who commands solar relics",
    "A void wanderer forged by collapse and starlight",
    "A cybernetic guardian built for impossible wars",
    "A cursed king consumed by ancient flame"
  ];

  // --- LOGIC ---

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleTraitToggle = (trait: string) => {
    soundManager.playSound('sfx_chip_toggle', { volume: 0.3 });
    setFormData(prev => {
      if (prev.traits.includes(trait)) {
        return { ...prev, traits: prev.traits.filter(t => t !== trait) };
      }
      if (prev.traits.length >= 2) {
        soundManager.playSound('sfx_error', { volume: 0.3 });
        return prev;
      }
      return { ...prev, traits: [...prev.traits, trait] };
    });
  };

  const applyLayoutPreset = (presetId: string) => {
    soundManager.playSound('sfx_chip_toggle', { volume: 0.3 });
    setLayoutPreset(presetId);
    if (presetId === 'custom') return;
    const preset = layoutPresetsList.find(p => p.id === presetId);
    if (preset) {
      setFormData(prev => ({
        ...prev,
        displayOptions: { ...preset.display }
      }));
    }
  };

  const handleCustomDisplayToggle = (key: string, value: boolean) => {
    soundManager.playSound('sfx_ui_click', { volume: 0.3 });
    setLayoutPreset('custom');
    setFormData(prev => ({
      ...prev,
      displayOptions: {
        ...prev.displayOptions,
        [key]: !value
      }
    }));
  };

  const handleSubmit = async () => {
    if (!getAuthToken()) {
      navigate("/auth");
      return;
    }

    setLoading(true);
    setError("");
    soundManager.playSound('sfx_generate_start');

    try {
      const res = await fetch(`${API_URL}/cards/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({ ...formData, cardType }),
        credentials: "include",
      });

      let result;
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        result = await res.json();
      } else {
        const text = await res.text();
        console.error("Non-JSON response:", text);
        throw new Error(`Server error: ${res.status} ${res.statusText}`);
      }

      if (!res.ok) throw new Error(result.error || "Failed to generate card");

      navigate(`/card/${result.shortId || result.id}?new=true`);
    } catch (err: any) {
      soundManager.playSound('sfx_error', { volume: 0.5 });
      setError(err.message);
      setLoading(false);
    }
  };


  // --- CURRENT TAB HELPERS ---
  const currentThemeList = themeCategories.find(c => c.name === activeThemeTab)?.options || [];
  const currentStyleList = artStyleCategories.find(c => c.name === activeStyleTab)?.options || [];

  return (
    <div className="max-w-[85rem] mx-auto px-4 py-8 lg:py-12">
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-12 items-start">

        {/* Mobile: Sticky Top Preview (Collapsible) */}
        <div className="lg:hidden w-full sticky top-4 z-40 bg-zinc-900/95 backdrop-blur-xl border border-white/5 rounded-2xl p-4 shadow-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
              <Eye size={18} className="text-emerald-400" />
            </div>
            <div className="overflow-hidden">
              <p className="text-[10px] text-emerald-400/80 font-bold uppercase tracking-wider mb-0.5 flex items-center gap-1"><Sparkles size={10} /> Live Preview</p>
              <p className="font-bold text-white text-sm truncate w-48">{formData.theme || "Unnamed Artifact"}</p>
            </div>
          </div>
          <div className="text-right flex flex-col items-end">
            <span className="text-[10px] font-bold text-zinc-500 uppercase">Updating</span>
            <span className="text-xs font-bold bg-white/5 text-zinc-400 px-2 py-1 rounded-md border border-white/10 uppercase mt-0.5">
              Step {step}/4
            </span>
          </div>
        </div>

        {/* Left Side: Form Steps */}
        <div className="flex-1 w-full order-2 lg:order-1 min-w-0 max-w-4xl mx-auto">

          <div className="hidden lg:flex justify-between items-center mb-8">
            <h1 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-500">
              {step === 1 && "Artifact Class"}
              {step === 2 && "Identity Core"}
              {step === 3 && "Power & Style"}
              {step === 4 && "Card Expression"}
            </h1>
            <div className="text-sm font-bold text-emerald-400 bg-emerald-500/10 px-4 py-1.5 rounded-full border border-emerald-500/20">
              Step {step} of 4
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl mb-6 shadow-lg shadow-red-500/5">
              {error}
            </div>
          )}

          <div className="lg:bg-zinc-900/40 lg:border lg:border-white/5 lg:rounded-3xl lg:p-8 relative">

            {step === 1 && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>

                {/* 1. Artifact Class Selection */}
                <div className="mb-6">
                  <div className="mb-5">
                    <label className="block text-2xl font-black text-white mb-2 tracking-tight">Step 1: Choose Artifact Class</label>
                    <p className="text-zinc-400 text-sm font-medium leading-relaxed">
                      Select the foundational quality and intensity of the card you are forging. This defines the overall premium polish, structural framing, and aura dominance.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                    {/* Legendary Toggle */}
                    <button
                      onClick={() => { soundManager.playSound('sfx_ui_click'); setCardType('legendary') }}
                      className={`p-4 rounded-2xl border transition-all flex flex-col items-center justify-center text-center gap-2 relative overflow-hidden group ${cardType === 'legendary'
                        ? "bg-zinc-800 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/50"
                        : "bg-zinc-950/80 border-white/5 hover:border-white/20 hover:bg-zinc-900"
                        }`}
                    >
                      <div className={`font-black tracking-tight text-lg ${cardType === 'legendary' ? "text-emerald-400" : "text-zinc-300 group-hover:text-white"}`}>
                        Legendary
                      </div>
                      <div className={`text-[10px] font-black uppercase tracking-widest ${cardType === 'legendary' ? 'text-emerald-500' : 'text-zinc-600 group-hover:text-zinc-500'}`}>
                        Standard / Free
                      </div>
                    </button>

                    {/* Mythic Toggle */}
                    <button
                      onClick={() => { soundManager.playSound('sfx_ui_click'); setCardType('mythic') }}
                      disabled={!user || user.credits < 1}
                      className={`p-4 rounded-2xl border transition-all flex flex-col items-center justify-center text-center gap-2 relative overflow-hidden group ${cardType === 'mythic'
                        ? "bg-amber-500/10 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)] ring-1 ring-amber-500/50"
                        : "bg-zinc-950/80 border-white/5 hover:border-white/20 hover:bg-zinc-900"
                        } ${(!user || user.credits < 1) ? "opacity-50 cursor-not-allowed grayscale" : ""}`}
                    >
                      {cardType === 'mythic' && <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/20 blur-[30px] rounded-full" />}
                      <div className={`relative z-10 font-black tracking-tight text-lg flex items-center gap-1.5 ${cardType === 'mythic' ? "text-amber-400 drop-shadow-md" : "text-amber-400/70 group-hover:text-amber-400"}`}>
                        Mythic <Crown size={14} className={cardType === 'mythic' ? 'text-amber-400' : 'text-amber-400/50'} />
                      </div>
                      <div className={`relative z-10 text-[10px] font-black uppercase tracking-widest flex items-center gap-1 ${cardType === 'mythic' ? 'text-amber-500' : 'text-amber-500/50 group-hover:text-amber-500/70'}`}>
                        1 Credit
                      </div>
                    </button>

                    {/* Final Boss Toggle */}
                    <button
                      onClick={() => { soundManager.playSound('sfx_ui_click'); setCardType('final_boss') }}
                      disabled={!user || user.credits < 1}
                      className={`p-4 rounded-2xl border transition-all flex flex-col items-center justify-center text-center gap-2 relative overflow-hidden group ${cardType === 'final_boss'
                        ? "bg-red-500/10 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.25)] ring-1 ring-red-500/50"
                        : "bg-zinc-950/80 border-white/5 hover:border-white/20 hover:bg-zinc-900"
                        } ${(!user || user.credits < 1) ? "opacity-50 cursor-not-allowed grayscale" : ""}`}
                    >
                      {cardType === 'final_boss' && <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/20 blur-[30px] rounded-full" />}
                      <div className={`relative z-10 font-black tracking-tight text-lg flex items-center gap-1.5 ${cardType === 'final_boss' ? "text-red-400 drop-shadow-md" : "text-red-400/70 group-hover:text-red-400"}`}>
                        Final Boss <Zap size={14} className={cardType === 'final_boss' ? 'text-red-400' : 'text-red-400/50'} />
                      </div>
                      <div className={`relative z-10 text-[10px] font-black uppercase tracking-widest flex items-center gap-1 ${cardType === 'final_boss' ? 'text-red-400' : 'text-red-400/50 group-hover:text-red-400/70'}`}>
                        1 Credit
                      </div>
                    </button>
                  </div>

                  {/* Extended Info Panel */}
                  <div className="bg-zinc-950/40 border border-white/5 rounded-2xl p-6 min-h-[120px] shadow-inner">
                    {cardType === 'legendary' && (
                      <motion.div key="leg" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                        <h4 className="text-emerald-400 font-bold text-lg mb-2 flex items-center gap-2">
                          <Wand2 size={18} /> Legendary Artifact
                        </h4>
                        <p className="text-zinc-400 text-sm leading-relaxed font-medium">
                          Standard Forge. Premium legendary-quality portrait. Beautiful, polished, and share-worthy result. Best for most creations.
                        </p>
                      </motion.div>
                    )}
                    {cardType === 'mythic' && (
                      <motion.div key="myth" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                        <h4 className="text-amber-400 font-bold text-lg mb-2 flex items-center gap-2">
                          <Crown size={18} /> Guaranteed Mythic
                        </h4>
                        <p className="text-zinc-400 text-sm leading-relaxed font-medium">
                          Ultimate refinement. Highest polish, luxury frame integration, and deepest detailing. Guaranteed mythic-quality collector output.
                        </p>
                      </motion.div>
                    )}
                    {cardType === 'final_boss' && (
                      <motion.div key="boss" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                        <h4 className="text-red-400 font-bold text-lg mb-2 flex items-center gap-2">
                          <Zap size={18} /> Final Boss Protocol
                        </h4>
                        <p className="text-zinc-400 text-sm leading-relaxed font-medium">
                          Mythic quality plus boss styling. Maximum spectacle, menace, dominance, and final-phase endgame authority.
                        </p>
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                {/* Avatar Core Identity */}
                <div className="mb-6 space-y-8">
                  <label className="block text-2xl font-black text-white mb-2 tracking-tight">Step 2: Avatar Identity</label>

                  {/* Avatar Name */}
                  <div>
                    <label className="block text-xl font-black text-white mb-1 tracking-tight">Avatar Name</label>
                    <p className="text-zinc-400 text-sm mb-4 font-medium">What is the true name of your ultimate form?</p>
                    <input
                      type="text"
                      value={formData.theme}
                      onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                      className="w-full bg-zinc-950/80 border border-white/10 hover:border-white/20 rounded-2xl p-5 text-white font-bold text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all placeholder:text-zinc-600 shadow-inner"
                      placeholder="e.g. Kaelen The Ascended"
                      autoFocus
                    />
                  </div>

                  {/* Gender */}
                  <div className="pt-2">
                    <label className="block text-xl font-black text-white mb-1 tracking-tight">Presentation Identity</label>
                    <p className="text-zinc-400 text-sm mb-4 font-medium">How should the artifact represent you visually?</p>
                    <div className="flex flex-wrap gap-2">
                      {genderOptions.map(g => (
                        <button
                          key={g}
                          onClick={() => { soundManager.playSound('sfx_chip_toggle', { volume: 0.3 }); setFormData({ ...formData, gender: g }); }}
                          onMouseEnter={() => soundManager.playSound('sfx_ui_hover', { volume: 0.1 })}
                          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all border ${formData.gender === g ? 'bg-emerald-500 border-emerald-400 text-zinc-950 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'bg-zinc-950/50 border-white/10 text-zinc-400 hover:text-white hover:border-white/30 hover:bg-zinc-900/80'}`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Photo Upload */}
                  <div className="pt-6 border-t border-white/5">
                    <label className="block text-xl font-black text-white mb-1 tracking-tight">Reference Data (Optional)</label>
                    <p className="text-zinc-400 text-sm mb-4 font-medium">Upload a selfie to directly influence your final form's features.</p>
                    <div className="flex items-center gap-4 bg-zinc-950/50 p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                      <div className="flex-1 overflow-hidden">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setFormData({ ...formData, photo: reader.result as string });
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="w-full text-zinc-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-emerald-500/10 file:text-emerald-400 hover:file:bg-emerald-500/20 cursor-pointer transition-colors"
                        />
                      </div>
                      {formData.photo && (
                        <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-white/10 shrink-0 shadow-lg">
                          <img src={formData.photo} alt="Upload preview" className="w-full h-full object-cover" />
                          <button onClick={() => setFormData({ ...formData, photo: "" })} className="absolute top-1 right-1 bg-black/60 backdrop-blur-sm rounded-full p-1 text-white hover:bg-red-500/80 transition-colors">
                            <X size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-10">
                <div className="mb-2">
                  <label className="block text-2xl font-black text-white mb-2 tracking-tight">Step 3: Power & Aesthetics</label>
                  <p className="text-zinc-400 text-sm font-medium leading-relaxed">
                    Shape the forces that define your form and the visual universe it inhabits.
                  </p>
                </div>

                {/* Archetype & Energy Core */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Archetype */}
                  <div>
                    <label className="block text-lg font-black text-white mb-1 tracking-tight">Archetype (Optional)</label>
                    <p className="text-zinc-400 text-[13px] mb-3 font-medium">Anchor your character's combat class.</p>
                    <div className="bg-zinc-950/80 border border-white/5 rounded-2xl p-2 h-44 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                      <div className="flex flex-wrap gap-1.5 p-1">
                        {archetypes.map(arc => (
                          <button
                            key={arc}
                            onClick={() => {
                              soundManager.playSound('sfx_chip_toggle', { volume: 0.2 });
                              setFormData(prev => ({ ...prev, archetype: prev.archetype === arc ? "" : arc }));
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${formData.archetype === arc ? 'bg-zinc-200 border-white text-zinc-900 shadow-sm' : 'bg-zinc-900/50 border-white/5 text-zinc-400 hover:text-white hover:border-white/20'}`}
                          >
                            {arc}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Energy Core */}
                  <div>
                    <label className="block text-lg font-black text-white mb-1 tracking-tight">Energy Core (Optional)</label>
                    <p className="text-zinc-400 text-[13px] mb-3 font-medium">Anchor your character's elemental affinity.</p>
                    <div className="bg-zinc-950/80 border border-white/5 rounded-2xl p-2 h-44 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                      <div className="flex flex-wrap gap-1.5 p-1">
                        {energyCores.map(core => (
                          <button
                            key={core}
                            onClick={() => {
                              soundManager.playSound('sfx_chip_toggle', { volume: 0.2 });
                              setFormData(prev => ({ ...prev, energyCore: prev.energyCore === core ? "" : core }));
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${formData.energyCore === core ? 'bg-zinc-200 border-white text-zinc-900 shadow-sm' : 'bg-zinc-900/50 border-white/5 text-zinc-400 hover:text-white hover:border-white/20'}`}
                          >
                            {core}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Vibe Selection (Categorized) */}
                <div className="pt-6 border-t border-white/5">
                  <div className="flex justify-between items-end mb-4">
                    <div>
                      <label className="block text-xl font-black text-white mb-1 tracking-tight">Energy Signatures</label>
                      <p className="text-zinc-400 text-sm font-medium">Select up to 2 defining forces that radiate from your character.</p>
                    </div>
                    {formData.traits.length > 0 && (
                      <span className="hidden sm:inline-block text-xs font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-1 rounded-md">
                        {formData.traits.length}/2 Selected
                      </span>
                    )}
                  </div>

                  {/* Vibe Category Tabs */}
                  <div className="flex overflow-x-auto gap-2 pb-3 mb-2 scrollbar-hide">
                    {themeCategories.map(cat => (
                      <button
                        key={cat.name}
                        onClick={() => { soundManager.playSound('sfx_ui_click', { volume: 0.1 }); setActiveThemeTab(cat.name); }}
                        className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors border ${activeThemeTab === cat.name ? 'bg-zinc-800 border-zinc-500 text-white' : 'bg-zinc-950 border-white/5 text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300'}`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>

                  {/* Vibe Chips Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 min-h-[160px] bg-zinc-950/40 p-4 rounded-2xl border border-white/5">
                    {currentThemeList.map(trait => (
                      <button
                        key={trait.name}
                        onClick={() => handleTraitToggle(trait.name)}
                        onMouseEnter={() => soundManager.playSound('sfx_ui_hover', { volume: 0.1 })}
                        className={`p-3 rounded-xl text-left border transition-all relative overflow-hidden group ${formData.traits.includes(trait.name) ? 'bg-emerald-500 border-emerald-400 text-zinc-950 shadow-[0_0_20px_rgba(16,185,129,0.25)]' : 'bg-zinc-900/50 border-white/5 hover:border-white/20 hover:bg-zinc-800 text-zinc-400'}`}
                      >
                        <div className={`font-black text-sm mb-0.5 ${formData.traits.includes(trait.name) ? 'text-zinc-950' : 'text-zinc-200 group-hover:text-white'}`}>{trait.name}</div>
                        <div className={`text-[10px] leading-tight ${formData.traits.includes(trait.name) ? 'text-zinc-800' : 'text-zinc-500 group-hover:text-zinc-400'}`}>{trait.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tone Sliders */}
                <div className="bg-zinc-950/50 p-6 md:p-8 rounded-3xl border border-white/5">
                  <label className="block text-xl font-black text-white mb-1 tracking-tight">Scale of Reality</label>
                  <p className="text-zinc-400 text-sm mb-6 font-medium">Dial in the tone, from grounded grit to god-tier absurdity.</p>

                  <div className="space-y-8">
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <label className="text-sm font-bold text-zinc-300">Exaggeration Level</label>
                        <span className="text-xs font-mono font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-md">{formData.exaggeration}/10</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={formData.exaggeration}
                        onChange={(e) => setFormData({ ...formData, exaggeration: parseInt(e.target.value, 10) })}
                        className="w-full h-2.5 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-emerald-500 border border-white/5"
                      />
                      <div className="flex justify-between text-xs font-bold text-zinc-500 mt-2">
                        <span>Grounded Realism</span>
                        <span>God-Tier Scale</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <label className="text-sm font-bold text-zinc-300">Tone & Seriousness</label>
                        <span className="text-xs font-mono font-bold bg-amber-500/10 border border-amber-500/20 text-amber-500 px-2 py-0.5 rounded-md">{formData.humor}/10</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={formData.humor}
                        onChange={(e) => setFormData({ ...formData, humor: parseInt(e.target.value, 10) })}
                        className="w-full h-2.5 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-amber-500 border border-white/5"
                      />
                      <div className="flex justify-between text-xs font-bold text-zinc-500 mt-2">
                        <span>Epic Drama</span>
                        <span>Satire / Troll</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Art Style (Categorized) */}
                <div className="pt-2 border-t border-white/5">
                  <label className="block text-xl font-black text-white mb-1 tracking-tight">Visual Universe</label>
                  <p className="text-zinc-400 text-sm mb-5 font-medium">Choose the dominant aesthetic universe for your artifact.</p>

                  {/* Style Category Tabs */}
                  <div className="flex overflow-x-auto gap-2 pb-3 mb-2 scrollbar-hide">
                    {artStyleCategories.map(cat => (
                      <button
                        key={cat.name}
                        onClick={() => { soundManager.playSound('sfx_ui_click', { volume: 0.1 }); setActiveStyleTab(cat.name); }}
                        className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors border ${activeStyleTab === cat.name ? 'bg-zinc-800 border-zinc-500 text-white' : 'bg-zinc-950 border-white/5 text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300'}`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 min-h-[180px] bg-zinc-950/40 p-4 rounded-2xl border border-white/5">
                    {currentStyleList.map(style => (
                      <button
                        key={style}
                        onClick={() => { soundManager.playSound('sfx_chip_toggle', { volume: 0.3 }); setFormData({ ...formData, artStyle: style }); }}
                        onMouseEnter={() => soundManager.playSound('sfx_ui_hover', { volume: 0.1 })}
                        className={`py-6 px-4 rounded-xl text-center text-sm font-bold transition-all border shadow-sm ${formData.artStyle === style ? 'bg-emerald-500 border-emerald-400 text-zinc-950 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : 'bg-zinc-900/50 border-white/5 text-zinc-400 hover:border-white/30 hover:bg-zinc-800 hover:text-white'}`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>

              </motion.div>
            )}

            {step === 4 && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                <div className="mb-2">
                  <label className="block text-2xl font-black text-white mb-2 tracking-tight">Step 4: Card Expression</label>
                  <p className="text-zinc-400 text-sm font-medium leading-relaxed">
                    Finalize the narrative framing and physical artifact layout.
                  </p>
                </div>

                {/* Character Fantasy */}
                <div>
                  <label className="block text-xl font-black text-white mb-1 tracking-tight">Character Fantasy & Lore</label>
                  <p className="text-zinc-400 text-sm mb-3 font-medium">Describe their ultimate sealed power, their weapons, or their lore.</p>

                  {/* Idea Chips */}
                  <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider shrink-0 my-auto mr-1">Inspo:</span>
                    {intentIdeas.map((idea, idx) => (
                      <button
                        key={idx}
                        onClick={() => { soundManager.playSound('sfx_chip_toggle', { volume: 0.2 }); setFormData(prev => ({ ...prev, intent: idea })); }}
                        className="shrink-0 px-3 py-1.5 bg-zinc-900/80 border border-white/5 rounded-lg text-xs font-medium text-zinc-300 hover:text-emerald-400 hover:border-emerald-500/30 transition-colors"
                      >
                        {idea}
                      </button>
                    ))}
                  </div>

                  <textarea
                    value={formData.intent}
                    onChange={(e) => setFormData({ ...formData, intent: e.target.value })}
                    className="w-full bg-zinc-950/80 border border-white/10 hover:border-white/20 rounded-2xl p-5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 min-h-[140px] resize-none shadow-inner text-lg placeholder:text-zinc-700"
                    placeholder="Provide additional details or custom overrides for the AI generation..."
                    autoFocus
                  />
                </div>

                {/* Layout Presets */}
                <div className="pt-6 border-t border-white/5">
                  <div className="flex justify-between items-end mb-4">
                    <div>
                      <label className="block text-xl font-black text-white mb-1 tracking-tight">Artifact Layout</label>
                      <p className="text-zinc-400 text-sm font-medium">Choose how data is etched into the final composition.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    {layoutPresetsList.map(preset => (
                      <button
                        key={preset.id}
                        onClick={() => applyLayoutPreset(preset.id)}
                        onMouseEnter={() => soundManager.playSound('sfx_ui_hover', { volume: 0.1 })}
                        className={`p-4 rounded-2xl border text-left transition-all ${layoutPreset === preset.id ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-sm' : 'bg-zinc-950/80 border-white/5 hover:border-white/20 text-zinc-400 hover:bg-zinc-900/50'}`}
                      >
                        <div className={`font-bold mb-1 ${layoutPreset === preset.id ? 'text-emerald-400' : 'text-zinc-300'}`}>{preset.label}</div>
                        <div className="text-xs font-medium opacity-80 leading-snug">{preset.desc}</div>
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setShowAdvancedLayout(!showAdvancedLayout)}
                    className="flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-white transition-colors py-2"
                  >
                    {showAdvancedLayout ? <ChevronUp size={16} /> : <ChevronDown size={16} />} Advanced Layout Control
                  </button>

                  <AnimatePresence>
                    {showAdvancedLayout && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden mt-2"
                      >
                        <div className="p-4 rounded-2xl bg-zinc-950/80 border border-white/5 flex flex-col gap-3">
                          {Object.entries(formData.displayOptions).map(([key, value]) => (
                            <div key={key} className="flex flex-col gap-2">
                              <button
                                onClick={() => handleCustomDisplayToggle(key, value as boolean)}
                                className={`flex items-center justify-between p-3 rounded-xl border transition-all text-sm font-bold ${value
                                  ? 'bg-zinc-800 border-zinc-500 text-white'
                                  : 'bg-zinc-900 border-transparent text-zinc-500 hover:bg-zinc-800'
                                  }`}
                              >
                                <span className="capitalize">{key === 'quote' ? 'Flavor Quote' : key}</span>
                                <div className={`w-4 h-4 rounded-full border flex flex-shrink-0 items-center justify-center ${value ? 'border-emerald-500 bg-emerald-500' : 'border-zinc-700 bg-zinc-800'}`}>
                                  {value && <div className="w-1.5 h-1.5 rounded-full bg-zinc-950" />}
                                </div>
                              </button>
                              {value && (
                                <div className="pl-4 border-l-2 border-zinc-700 ml-2 animate-in slide-in-from-top-2 focus-within:border-emerald-500 transition-colors">
                                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">
                                    Override Text (Optional)
                                  </label>
                                  <input
                                    type="text"
                                    value={(formData.customText as any)[key]}
                                    onChange={(e) => setFormData(prev => ({
                                      ...prev,
                                      customText: { ...prev.customText, [key]: e.target.value }
                                    }))}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-emerald-500/50 placeholder:text-zinc-600 shadow-inner"
                                    placeholder="Leave empty for AI generation..."
                                  />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                </div>

              </motion.div>
            )}

            {/* Step Navigation CTAs */}
            <div className={`mt-8 flex gap-3 ${step === 4 ? 'pt-8 border-t border-white/5' : ''}`}>
              {step > 1 && (
                <button
                  onClick={() => { soundManager.playSound('sfx_ui_click', { volume: 0.3 }); setStep(step - 1); }}
                  onMouseEnter={() => soundManager.playSound('sfx_ui_hover', { volume: 0.1 })}
                  className="px-6 py-4 rounded-2xl font-bold text-zinc-400 bg-zinc-950/80 border border-white/10 hover:text-white hover:border-white/30 transition-colors shadow-inner shrink-0"
                >
                  Back
                </button>
              )}

              <button
                onClick={() => {
                  if (step < 4) {
                    if (step === 2 && !formData.theme.trim()) {
                      soundManager.playSound('sfx_error', { volume: 0.5 });
                      setError("Please provide an Avatar Name.");
                      return;
                    }
                    soundManager.playSound('sfx_ui_click', { volume: 0.4 });
                    setError("");
                    setStep(step + 1);
                    // Reset scroll position gracefully if possible here
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  } else {
                    handleSubmit();
                  }
                }}
                onMouseEnter={() => soundManager.playSound('sfx_ui_hover', { volume: 0.1 })}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 text-zinc-950 px-6 py-4 rounded-2xl font-black text-lg hover:bg-emerald-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)]"
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                ) : step === 4 ? (
                  <>
                    Forge Final Form <Wand2 size={20} className="ml-1" />
                  </>
                ) : (
                  <>
                    Proceed <ArrowRight size={20} />
                  </>
                )}
              </button>
            </div>


          </div>
        </div>

        {/* Right Side: Persistent Live Summary (Desktop) */}
        <div className="hidden lg:block w-[26rem] sticky top-8 shrink-0 relative mt-[40px]">
          <div className="bg-zinc-900/80 border border-white/5 rounded-[2rem] p-8 backdrop-blur-2xl shadow-2xl relative overflow-hidden">

            {/* Subdued ambient glow behind summary text */}
            <div className="absolute -top-10 -right-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-[60px] pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-zinc-500/10 rounded-full blur-[60px] pointer-events-none" />
            {cardType === 'mythic' && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px] pointer-events-none" />}
            {cardType === 'final_boss' && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-red-500/10 rounded-full blur-[80px] pointer-events-none" />}

            <div className="flex justify-between items-start mb-6 border-b border-white/5 pb-4">
              <div>
                <h2 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2"><Eye size={16} className="text-emerald-400" /> Live Artifact Preview</h2>
                <div className="text-[10px] text-zinc-500 font-bold mt-1">Updates automatically. No input required here.</div>
              </div>
              <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md border border-emerald-500/20">Preview Only</span>
            </div>

            <div className="flex flex-col gap-7 relative z-10">

              <div className="group">
                <h3 className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1.5 flex items-center gap-1.5"><Sparkles size={10} /> Avatar Identity</h3>
                <div className={`text-2xl font-black tracking-tight ${formData.theme ? 'text-white' : 'text-zinc-600 italic font-medium'}`}>
                  {formData.theme || "Awaiting Name..."}
                </div>
              </div>

              <div>
                <h3 className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-2">Core Composition</h3>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1.5 rounded-lg bg-zinc-950/80 border border-white/5 text-zinc-300 text-xs font-bold shadow-inner">
                    {formData.gender}
                  </span>
                  {formData.archetype && (
                    <span className="px-3 py-1.5 rounded-lg bg-zinc-200 text-zinc-900 text-xs font-black shadow-sm">
                      {formData.archetype}
                    </span>
                  )}
                  {formData.energyCore && (
                    <span className="px-3 py-1.5 rounded-lg border border-purple-500/30 text-purple-400 bg-purple-500/10 text-xs font-bold shadow-inner">
                      {formData.energyCore}
                    </span>
                  )}
                  {formData.traits.map(t => (
                    <span key={t} className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-2.5">Aesthetic Directives</h3>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between bg-zinc-950/80 border border-white/5 rounded-xl px-4 py-3 shadow-inner">
                    <span className="text-sm font-bold text-zinc-300">{formData.artStyle}</span>
                    <div className="flex gap-1.5">
                      <span className="bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded text-[10px] font-bold" title="Exaggeration">E:{formData.exaggeration}</span>
                      <span className="bg-amber-500/10 text-amber-500 px-2 py-1 rounded text-[10px] font-bold" title="Humor/Satire">H:{formData.humor}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-white/5">
                <h3 className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-3">Manifestation Framework</h3>

                <div className="flex flex-wrap items-center gap-2 mb-4">
                  {cardType === 'final_boss' ? (
                    <span className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs font-black border border-red-500/20 flex items-center gap-1.5 shadow-[0_0_15px_rgba(239,68,68,0.15)]">
                      <Crown size={12} /> Final Boss Protocol
                    </span>
                  ) : cardType === 'mythic' ? (
                    <span className="px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-500 text-xs font-black border border-amber-500/20 flex items-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
                      <Crown size={12} /> Guaranteed Mythic
                    </span>
                  ) : (
                    <span className="px-3 py-1.5 rounded-lg bg-zinc-950/80 text-zinc-400 text-xs font-bold border border-white/5 shadow-inner">
                      Legendary Artifact
                    </span>
                  )}
                  <span className="px-3 py-1.5 rounded-lg bg-zinc-950/80 text-emerald-400/80 text-xs font-bold border border-white/5 shadow-inner">
                    {layoutPresetsList.find(p => p.id === layoutPreset)?.label || 'Custom'} Layout
                  </span>
                </div>

                {formData.intent ? (
                  <div className="bg-zinc-950/80 p-4 rounded-xl border border-white/5 border-l-2 border-l-emerald-500/50 shadow-inner">
                    <p className="text-xs text-zinc-300 line-clamp-4 italic font-medium leading-relaxed">
                      "{formData.intent}"
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-zinc-600 italic bg-zinc-950/50 p-4 rounded-xl border border-transparent">
                    Lore unwritten...
                  </p>
                )}
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
