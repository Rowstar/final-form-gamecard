import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL, getAuthToken, fetchWithAuth } from "../lib/api.ts";
import { motion } from "motion/react";
import { ArrowRight, Sparkles, Zap, X } from "lucide-react";

export default function Create() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    theme: "",
    gender: "Not specified",
    traits: [] as string[],
    intent: "",
    exaggeration: 5,
    humor: 5,
    photo: "",
    artStyle: "Dark Fantasy",
    displayOptions: {
      stats: false,
      ultimate: false,
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
  const [useCredit, setUseCredit] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (getAuthToken()) {
      fetchWithAuth("/auth/me")
        .then((data) => {
          setUser(data.user);
          if (data.user.freeGenerationsLeft <= 0 && data.user.credits > 0) {
            setUseCredit(true);
          }
        })
        .catch(() => { });
    }
  }, []);

  const traitOptions = [
    "Heroic", "Dark", "Mysterious", "Chaotic", "Divine",
    "Calm", "Cosmic", "Infernal", "Regal", "Playful"
  ];

  const artStyleOptions = [
    "Dark Fantasy", "Neo-Cyberpunk", "Ghibli / Anime",
    "Synthwave", "Mythological", "Sci-Fi Realism"
  ];

  const genderOptions = [
    "Not specified", "Masculine", "Feminine", "Androgynous", "Other"
  ];

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleTraitToggle = (trait: string) => {
    setFormData(prev => {
      if (prev.traits.includes(trait)) {
        return { ...prev, traits: prev.traits.filter(t => t !== trait) };
      }
      if (prev.traits.length >= 2) {
        return prev; // Max 2 traits
      }
      return { ...prev, traits: [...prev.traits, trait] };
    });
  };

  const handleSubmit = async () => {
    if (!getAuthToken()) {
      navigate("/auth");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_URL}/cards/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({ ...formData, useCredit }),
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

      // Pass ?new=true to trigger the Cinematic Reveal Sequence
      navigate(`/card/${result.shortId || result.id}?new=true`);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md mx-auto mt-8"
    >
      <div className="flex justify-between items-center mb-8 px-4">
        <h1 className="text-2xl font-bold tracking-tight">Create Final Form</h1>
        <div className="text-sm font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
          Step {step}/3
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl mb-6 mx-4">
          {error}
        </div>
      )}

      <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-6 sm:p-8 backdrop-blur-sm">
        {step === 1 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <label className="block text-lg font-medium text-white mb-2">
              Avatar Name
            </label>
            <p className="text-zinc-400 text-sm mb-6">What is the true name of your ultimate form?</p>

            <input
              type="text"
              value={formData.theme}
              onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
              className="w-full bg-zinc-950 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 mb-6"
              placeholder="e.g. Kaelen The Ascended"
              autoFocus
            />

            <label className="block text-lg font-medium text-white mb-2">
              Gender / Presentation
            </label>
            <div className="flex flex-wrap gap-2">
              {genderOptions.map(g => (
                <button
                  key={g}
                  onClick={() => setFormData({ ...formData, gender: g })}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${formData.gender === g ? 'bg-emerald-500 text-zinc-950' : 'bg-zinc-950 border border-white/10 text-zinc-400 hover:text-white hover:border-white/30'}`}
                >
                  {g}
                </button>
              ))}
            </div>

            <div className="pt-6 border-t border-white/5 mt-6">
              <label className="block text-lg font-medium text-white mb-2">
                Reference Photo (Optional)
              </label>
              <p className="text-zinc-400 text-sm mb-4">Upload a selfie to influence your final form's features.</p>

              <div className="flex items-center gap-4">
                <div className="flex-1">
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
                    className="w-full text-zinc-400 file:mr-4 file:py-3 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-emerald-500/10 file:text-emerald-400 hover:file:bg-emerald-500/20 cursor-pointer"
                  />
                </div>
                {formData.photo && (
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-white/10 shrink-0">
                    <img src={formData.photo} alt="Upload preview" className="w-full h-full object-cover" />
                    <button onClick={() => setFormData({ ...formData, photo: "" })} className="absolute top-1 right-1 bg-black/50 rounded-full p-1 text-white hover:text-red-400">
                      <X size={12} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <label className="block text-lg font-medium text-white mb-2">
              Alignment & Vibe
            </label>
            <p className="text-zinc-400 text-sm mb-6">Pick 1-2 words that describe your character's energy.</p>

            <div className="grid grid-cols-2 gap-3">
              {traitOptions.map(trait => (
                <button
                  key={trait}
                  onClick={() => handleTraitToggle(trait)}
                  className={`px-4 py-3 rounded-xl text-sm font-bold transition-all ${formData.traits.includes(trait) ? 'bg-emerald-500 text-zinc-950 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-zinc-950 border border-white/10 text-zinc-400 hover:border-white/30 hover:text-white'}`}
                >
                  {trait}
                </button>
              ))}
            </div>
            <p className="text-xs text-zinc-500 text-center mt-4">
              {formData.traits.length}/2 selected
            </p>

            <div className="pt-6 mt-6 border-t border-white/5">
              <label className="block text-lg font-medium text-white mb-2">
                Tone & Extravagance
              </label>
              <p className="text-zinc-400 text-sm mb-6">Dial in the vibe from realistic to utterly absurd.</p>

              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-bold text-zinc-300">Exaggeration</label>
                    <span className="text-xs font-mono text-emerald-400">{formData.exaggeration}/10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={formData.exaggeration}
                    onChange={(e) => setFormData({ ...formData, exaggeration: parseInt(e.target.value, 10) })}
                    className="w-full h-2 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <div className="flex justify-between text-xs text-zinc-500 mt-1">
                    <span>Grounded</span>
                    <span>God-Tier Absurdity</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-bold text-zinc-300">Humor / Satire</label>
                    <span className="text-xs font-mono text-amber-400">{formData.humor}/10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={formData.humor}
                    onChange={(e) => setFormData({ ...formData, humor: parseInt(e.target.value, 10) })}
                    className="w-full h-2 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                  <div className="flex justify-between text-xs text-zinc-500 mt-1">
                    <span>Epic Seriousness</span>
                    <span>Troll / Parody</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-white/5">
              <label className="block text-lg font-medium text-white mb-2">
                Art Style Theme
              </label>
              <p className="text-zinc-400 text-sm mb-6">Choose the dominant visual aesthetic for your card.</p>

              <div className="grid grid-cols-2 gap-3">
                {artStyleOptions.map(style => (
                  <button
                    key={style}
                    onClick={() => setFormData({ ...formData, artStyle: style })}
                    className={`px-4 py-3 rounded-xl text-sm font-bold transition-all ${formData.artStyle === style ? 'bg-amber-500 text-zinc-950 shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 'bg-zinc-950 border border-white/10 text-zinc-400 hover:border-white/30 hover:text-white'}`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div>
              <label className="block text-lg font-medium text-white mb-2">
                Character Fantasy
              </label>
              <p className="text-zinc-400 text-sm mb-6">Briefly describe the ultimate concept (e.g. A cosmic guardian of the stars).</p>
              <textarea
                value={formData.intent}
                onChange={(e) => setFormData({ ...formData, intent: e.target.value })}
                className="w-full bg-zinc-950 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 min-h-[120px] resize-none"
                placeholder="A legendary warrior who has unlocked their final sealed power..."
                autoFocus
              />
            </div>

            <div className="pt-4 border-t border-white/5">
              <label className="block text-lg font-medium text-white mb-2">
                Card Layout
              </label>
              <p className="text-zinc-400 text-sm mb-4">Choose which traits are visually embedded on your card.</p>
              <div className="flex flex-col gap-3 mb-2">
                {Object.entries(formData.displayOptions).map(([key, value]) => (
                  <div key={key} className="flex flex-col gap-2">
                    <button
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        displayOptions: {
                          ...prev.displayOptions,
                          [key]: !value
                        }
                      }))}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all text-sm font-medium ${value
                        ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
                        : 'bg-zinc-900/50 border-white/5 text-zinc-500 hover:border-white/20'
                        }`}
                    >
                      <span className="capitalize">{key === 'quote' ? 'Flavor Quote' : key}</span>
                      <div className={`w-4 h-4 rounded-full border flex flex-shrink-0 items-center justify-center ${value ? 'border-emerald-500 bg-emerald-500' : 'border-zinc-600 bg-zinc-800'
                        }`}>
                        {value && <div className="w-1.5 h-1.5 rounded-full bg-zinc-950" />}
                      </div>
                    </button>
                    {value && (
                      <div className="pl-4 border-l-2 border-emerald-500/30 ml-2 animate-in slide-in-from-top-2 focus-within:border-emerald-500 transition-colors">
                        <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">
                          {key === 'quote' ? 'Flavor Quote' : key} Text
                        </label>
                        <input
                          type="text"
                          value={(formData.customText as any)[key]}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            customText: { ...prev.customText, [key]: e.target.value }
                          }))}
                          className="w-full bg-zinc-950 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                          placeholder={`Optional: Auto-generated if left blank...`}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {user && (
              <div className="pt-4 border-t border-white/5">
                <label className="block text-lg font-medium text-white mb-4">
                  Boss Mode
                </label>
                <div className="space-y-3">
                  <button
                    onClick={() => setUseCredit(false)}
                    disabled={user.freeGenerationsLeft <= 0}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-left ${!useCredit && user.freeGenerationsLeft > 0
                      ? "bg-emerald-500/10 border-emerald-500/50"
                      : "bg-zinc-900/50 border-white/5 hover:border-white/20"
                      } ${user.freeGenerationsLeft <= 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <div>
                      <div className="font-bold text-white flex items-center gap-2">
                        Standard Form
                      </div>
                      <div className="text-sm text-zinc-400 mt-1">
                        {user.freeGenerationsLeft > 0
                          ? `${user.freeGenerationsLeft} free remaining today. Includes watermark.`
                          : "No free generations remaining today."}
                      </div>
                    </div>
                    {!useCredit && user.freeGenerationsLeft > 0 && (
                      <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-zinc-950" />
                      </div>
                    )}
                  </button>

                  <button
                    onClick={() => setUseCredit(true)}
                    disabled={user.credits <= 0}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-left ${useCredit
                      ? "bg-amber-500/10 border-amber-500/50"
                      : "bg-zinc-900/50 border-white/5 hover:border-white/20"
                      } ${user.credits <= 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <div>
                      <div className="font-bold text-amber-400 flex items-center gap-2">
                        Final Boss Mode <Zap size={14} className="text-amber-400" />
                      </div>
                      <div className="text-sm text-zinc-400 mt-1">
                        Maximized dramatic composition. Removes watermark. ({user.credits} credits available)
                      </div>
                    </div>
                    {useCredit && (
                      <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-zinc-950" />
                      </div>
                    )}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        <div className="mt-8 flex gap-3">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="px-6 py-4 rounded-2xl font-bold text-zinc-400 bg-zinc-950 border border-white/10 hover:text-white hover:border-white/30 transition-colors"
            >
              Back
            </button>
          )}

          <button
            onClick={() => {
              if (step < 3) {
                if (step === 1 && !formData.theme.trim()) {
                  setError("Please enter a name.");
                  return;
                }
                setError("");
                setStep(step + 1);
              } else {
                handleSubmit();
              }
            }}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 text-zinc-950 px-6 py-4 rounded-2xl font-bold hover:bg-emerald-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
            ) : step === 3 ? (
              <>
                Forge Card <Sparkles size={18} />
              </>
            ) : (
              <>
                Next <ArrowRight size={18} />
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
