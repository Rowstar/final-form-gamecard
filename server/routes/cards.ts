import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";
import db from "../db.js";
import { GoogleGenAI, Type } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-change-me";

const uploadDir = path.join(__dirname, "..", "..", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

// Middleware to check auth
const authenticate = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Unauthorized" });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
};

import crypto from "crypto";

function generateShortId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const p1 = Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  const p2 = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `SG-${p1}-${p2}`;
}

function getTierPrompt(style: string) {
  if (style === 'mythic') return "- HIGHEST COLLECTOR-GRADE REFINEMENT. Exclusive dimensional frame pressure / structural transcendence. Deepest internal energy architecture. Rare-feeling premium surface treatment. Unmistakable top-tier. NEVER stamp the word 'MYTHIC' directly on the card.";
  if (style === 'legendary') return "- More intricate, more dimensional, richer frame intelligence. More prestige.";
  return "- Already premium, polished, attractive. Strong finish. Controlled spectacle.";
}

// Phase 2: Legacy Spec Reconstruction Helper
function reconstructSpecFromLegacyCard(card: any): any {
  if (card.card_spec_json) {
    try {
      return JSON.parse(card.card_spec_json);
    } catch (e) { }
  }

  let stats: any = {};
  if (card.stats) {
    stats = typeof card.stats === 'string' ? JSON.parse(card.stats) : card.stats;
  }

  return {
    name: card.identity,
    formBase: card.animal_base,
    formTitle: card.strengths,
    energyCore: card.energy_core,
    archetype: card.archetype,
    palette: card.palette,
    poseVariant: card.pose_variant,
    composition: card.composition,
    ultimateAbility: {
      name: card.ultimate_title || "",
      description: card.signature_move || ""
    },
    stats: stats.rpgStats || {},
    passives: stats.passives || [],
    weakness: stats.weakness || "",
    resistances: stats.resistances || "",
    guidanceLine: stats.guidanceLine || "",
    illustrationStyle: card.style_fingerprint || "Premium fantasy game illustration" // Phase 4
  };
}

router.post("/generate", authenticate, async (req: any, res: any) => {
  try {
    const { theme, traits, intent, cardType, displayOptions, photo, artStyle, customText, gender, exaggeration, humor } = req.body || {};

    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id) as any;
    if (!user) return res.status(404).json({ error: "User not found" });

    const freeGenerationsCount = db.prepare(`
      SELECT COUNT(*) as count FROM cards 
      WHERE user_id = ? AND date(created_at) = date('now') AND is_premium = 0
    `).get(req.user.id) as any;

    const hasFreeGenerations = (freeGenerationsCount?.count || 0) < 2;

    let isPremium = false;
    let aestheticStyle = "legendary"; // Default

    if (cardType === "mythic" || cardType === "final_boss") {
      if (user.credits <= 0) {
        return res.status(400).json({ error: "Not enough credits" });
      }
      isPremium = true;
      aestheticStyle = "mythic"; // Both premium types utilize mythic rendering base
    } else {
      if (!hasFreeGenerations) {
        return res.status(400).json({ error: "No free generations left today. Please use a credit." });
      }
      isPremium = false;
      aestheticStyle = "legendary";
    }

    const isBoss = cardType === "final_boss" ? "Yes" : "No";

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.trim() === "") {
      console.error("API Key is not set or is empty");
      return res.status(500).json({ error: "API Key is not set. Please configure GEMINI_API_KEY." });
    }

    // Initialize Gemini
    const ai = new GoogleGenAI({ apiKey });

    let facialFeatures = "";
    if (photo) {
      try {
        let mimeType = "image/jpeg";
        let base64Data = photo;
        if (photo.startsWith("data:")) {
          const matches = photo.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
          if (matches && matches.length === 3) {
            mimeType = matches[1];
            base64Data = matches[2];
          }
        }
        const visionResponse = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [
            { text: "Analyze this face. Describe the facial architecture, defining features, expression, age impression, and hairstyle in 2-3 concise sentences. Focus solely on physical facial appearance, ignoring clothing and background. This description will be explicitly used to reconstruct the person as a Final Form fantasy/sci-fi character card." },
            { inlineData: { data: base64Data, mimeType } }
          ]
        });
        facialFeatures = visionResponse.text || "";
        console.log("Extracted facial features for card generation.");
      } catch (e) {
        console.error("Photo analysis failed:", e);
      }
    }

    let cardData: any = {};
    let dnaHash = "";
    let attempts = 0;
    const maxAttempts = 10;
    let success = false;
    let currentTheme = theme || "Mystical";

    while (attempts < maxAttempts && !success) {
      attempts++;

      let customOverrides = ``;
      if (theme) customOverrides += `- MUST use the EXACT Avatar Name provided: "${theme}"\n`;
      if (customText?.weapon) customOverrides += `- MUST use the EXACT Signature Weapon Name provided: "${customText.weapon}"\n`;
      if (customText?.ultimate) customOverrides += `- MUST use the EXACT Ultimate Ability Name provided: "${customText.ultimate}"\n`;
      if (customText?.quote) customOverrides += `- MUST use the EXACT Flavor Quote provided: "${customText.quote}"\n`;
      if (customText?.passives) customOverrides += `- Incorporate these concepts into the Passives: "${customText.passives}"\n`;
      if (customText?.resistances) customOverrides += `- Incorporate these concepts into the Weaknesses/Resistances: "${customText.resistances}"\n`;

      const prompt = `
        You are generating a "Final Form" / "Ultimate Boss Form" game card character based on these inputs:
        - Avatar Name: ${theme || "Unknown"}
        - Gender / Presentation: ${gender || "Not specified"}
        - Alignment / Vibe: ${(traits || []).join(", ") || "Balanced"}
        - Intent / Description: ${intent || "A powerful new form."}
        - Art Style Theme: ${artStyle || "Premium Digital Art"}
        - Exaggeration Level: ${exaggeration || 5}/10 (1=Realistic, 10=God-Tier Absurdly Overscaled Powers)
        - Humor / Satire Level: ${humor || 5}/10 (1=Grimdark/Serious, 10=Troll/Parody/Silly)
        - Aesthetic Quality Target: ${aestheticStyle}
        - Final Boss Class: ${isBoss}

        USER CUSTOM OVERRIDES:
        ${customOverrides}

        Generate the character details. The output must be strict JSON.
        
        RULES:
        - name: The dominant avatar name (max 22 chars).
        - formBase: The primary species, concept, or foundation of this form (e.g. "Cosmic Human", "Demon Lord", "Mecha Dragon", "Celestial Seraph"). Be creative but descriptive.
        - formTitle: The Archetype/Title of this form (e.g. "Infernal Tyrant", "Apex Predator", "Reality Weaver").
        - energyCore: The primary element or energy source (e.g. "Void Matter", "Holy Fire", "Quantum Lightning").
        - signatureWeapon: The name of their primary weapon or visual artifact (e.g. "Blade of the Cosmos", "Void Scepter"). MUST be present.
        - archetype: The class or combat role (e.g. "Vanguard", "Spellblade", "Assassin", "Juggernaut").
        - palette: 2-3 dominant colors that fit the vibe.
        - poseVariant: How they should be posed (e.g. "Floating ominously", "Sword drawn, battle-ready", "Sitting on a throne of debris").
        - composition: Must be one of: "Centered floating", "Dynamic action pose", "Intimidating low angle", "Heroic standing".
        - ultimateAbility.name: An epic, evocative name for their ultimate skill.
        - ultimateAbility.description: A dramatic combat/lore description of what this ability does and its devastating or empowering effect.
        - guidanceLine: A bad-ass or mysterious flavor text / quote spoken by the character.
        - stats: Generate an internal object with 6 RPG stats scaled 1-100 based on the archetype and vibe. Fields MUST BE: Power, Speed, Defense, Intelligence, Presence, Energy.
        - passives: Generate an array of 2 short strings describing passive abilities.
        - weakness: Generate a 1-3 word conceptual weakness (e.g. "Hubris", "Holy light", "Slow windup").
        - resistances: Generate a 1-3 word conceptual resistance (e.g. "Immune to mind control", "Absorbs fire").
        
        - Tone: Epic, Game-like, Trading Card, Dramatic, Badass, Powerful, Premium.
      `;

      let response;
      try {
        response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                formBase: { type: Type.STRING },
                formTitle: { type: Type.STRING },
                energyCore: { type: Type.STRING },
                archetype: { type: Type.STRING },
                signatureWeapon: { type: Type.STRING },
                palette: { type: Type.STRING },
                poseVariant: { type: Type.STRING },
                composition: { type: Type.STRING },
                illustrationStyle: { type: Type.STRING, description: "The core illustration style family, rendering language, and whimsy/realism level (e.g. 'Stylized anime illustration', 'Epic realistic splash art', 'Cozy storybook fantasy')" },
                ultimateAbility: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    description: { type: Type.STRING }
                  },
                  required: ["name", "description"]
                },
                stats: {
                  type: Type.OBJECT,
                  properties: {
                    Power: { type: Type.INTEGER },
                    Speed: { type: Type.INTEGER },
                    Defense: { type: Type.INTEGER },
                    Intelligence: { type: Type.INTEGER },
                    Presence: { type: Type.INTEGER },
                    Energy: { type: Type.INTEGER }
                  },
                  required: ["Power", "Speed", "Defense", "Intelligence", "Presence", "Energy"]
                },
                passives: { type: Type.ARRAY, items: { type: Type.STRING } },
                weakness: { type: Type.STRING },
                resistances: { type: Type.STRING },
                guidanceLine: { type: Type.STRING }
              },
              required: ["name", "formBase", "formTitle", "energyCore", "archetype", "signatureWeapon", "palette", "poseVariant", "composition", "illustrationStyle", "ultimateAbility", "stats", "passives", "weakness", "resistances", "guidanceLine"]
            }
          }
        });
      } catch (e: any) {
        console.error("Text generation failed:", e);
        if (attempts === maxAttempts) throw new Error(`Text generation failed: ${e.message}`);
        continue;
      }

      try {
        let text = response.text || "{}";
        text = text.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        cardData = JSON.parse(text);
      } catch (e) {
        console.error("Failed to parse card data JSON:", response?.text);
        if (attempts === maxAttempts) cardData = {};
        continue;
      }

      if (!cardData.name || !cardData.formBase) continue;

      // Hard Locks
      const nameExists = db.prepare("SELECT 1 FROM cards WHERE identity = ?").get(cardData.name);
      if (nameExists) continue;

      const abilityExists = db.prepare("SELECT 1 FROM cards WHERE ultimate_title = ?").get(cardData.ultimateAbility?.name);
      if (abilityExists) continue;

      dnaHash = `${aestheticStyle}-${cardData.formBase}-${cardData.energyCore}-${cardData.archetype}-${cardData.palette}-${cardData.poseVariant}`;
      const dnaExists = db.prepare("SELECT 1 FROM cards WHERE dna_hash = ?").get(dnaHash);
      if (dnaExists) continue;

      success = true;
    }

    if (!success) {
      console.warn("Failed to generate a completely unique card after 10 attempts, using last generated data.");
    }

    const cardId = uuidv4();
    const shortId = generateShortId();
    let imageUrl = "";

    const stats = {
      aestheticStyle: aestheticStyle,
      formTitle: cardData.formTitle, // we'll use this for Subtitle/Title
      ultimateAbility: cardData.ultimateAbility,
      guidanceLine: cardData.guidanceLine, // Flavor text
      rpgStats: cardData.stats,
      signatureWeapon: cardData.signatureWeapon,
      passives: cardData.passives,
      resistances: cardData.resistances,
      weakness: cardData.weakness,
      displayOptions: displayOptions,
      inputs: { theme, gender, traits, intent, cardType, artStyle, customText }
    };

    let imagePrompt = "";
    // Generate Image using Gemini
    try {
      // Rebuild conditional text block
      const options = displayOptions || { stats: false, ultimate: false, passives: false, resistances: false, quote: false, weapon: false };

      let textSystemPrompt = `TEXT SYSTEM (CRITICAL: All requested text must be generated inside the image itself, embedded natively into the card's framing layout. Treat this exactly like rendering a physical trading card with text printed into the bottom frame panels. IMPORTANT: DO NOT use placeholders like [CARD NAME]. DO NOT invent bracketed labels. DO NOT display template text or add unintended interface formatting. ONLY render the exact text values provided below, nothing else!):\n`;
      if (cardType === "final_boss") {
        textSystemPrompt += `Top Center Label (prominent, glowing, epic typography at the very top of the card): "EPIC FINAL BOSS"\n`;
      }
      textSystemPrompt += `Character Name (render in dominant epic cinematic font): "${cardData.name}"\n`;
      textSystemPrompt += `Subtitle (render below name in sleek font): "${cardData.formTitle}"\n`;

      if (options.ultimate) {
        textSystemPrompt += `Ultimate Ability Info Box (wide centered across bottom edge):\n`;
        if (customText?.ultimate?.trim()) {
          textSystemPrompt += `Ability Name: "${customText.ultimate}"\nAbility Description: "${cardData.ultimateAbility?.description || 'A devastating signature power.'}"\n`;
        } else if (cardData.ultimateAbility) {
          textSystemPrompt += `Ability Name: "${cardData.ultimateAbility.name}"\nAbility Description: "${cardData.ultimateAbility.description}"\n`;
        }
      }

      if (options.weapon) {
        if (customText?.weapon?.trim()) {
          textSystemPrompt += `Weapon Label (sleek font above stats): "Weapon: ${customText.weapon}"\n`;
        } else if (cardData.signatureWeapon) {
          textSystemPrompt += `Weapon Label (sleek font above stats): "Weapon: ${cardData.signatureWeapon}"\n`;
        }
      }

      if (options.stats) {
        if (customText?.stats?.trim()) {
          textSystemPrompt += `Combat Stats Grid: "${customText.stats}"\n`;
        } else if (cardData.stats) {
          textSystemPrompt += `Combat Stats Grid (6 small structured UI numbers): "Power ${cardData.stats.Power}, Speed ${cardData.stats.Speed}, Defense ${cardData.stats.Defense}, Intel ${cardData.stats.Intelligence}, Aura ${cardData.stats.Presence}, Energy ${cardData.stats.Energy}"\n`;
        }
      }

      if (options.passives) {
        if (customText?.passives?.trim()) {
          textSystemPrompt += `Passives (compact bullet list): "${customText.passives}"\n`;
        } else if (cardData.passives && cardData.passives.length > 0) {
          textSystemPrompt += `Passives (compact bullet list): "${cardData.passives.join(" • ")}"\n`;
        }
      }

      if (options.resistances) {
        if (customText?.resistances?.trim()) {
          textSystemPrompt += `Affinities: "${customText.resistances}"\n`;
        } else if (cardData.resistances || cardData.weakness) {
          textSystemPrompt += `Affinities: "`;
          if (cardData.resistances) textSystemPrompt += `Resists ${cardData.resistances} `;
          if (cardData.weakness) textSystemPrompt += `| Weak to ${cardData.weakness}`;
          textSystemPrompt += `"\n`;
        }
      }

      if (options.quote) {
        if (customText?.quote?.trim()) {
          textSystemPrompt += `Flavor Text Quote (italics at very bottom): "${customText.quote}"\n`;
        } else if (cardData.guidanceLine) {
          textSystemPrompt += `Flavor Text Quote (italics at very bottom): "${cardData.guidanceLine}"\n`;
        }
      }


      const bossPromptDirective = cardType === "final_boss" ? "FINAL BOSS PROTOCOL ENABLED: Maximum visual intimidation, dramatic dominance, and apex-being endgame authority. Create a spectacular, menacing, and iconic final-phase silhouette. Strip away standard borders, make the character violently break out of the frame geometry." : "";

      imagePrompt = `A premium, full-art game trading card featuring an Ultimate/Final Form Character.
Theme: ${(traits || []).join(", ") || "Epic"}. Tone: Dramatic, Game-like, Fantasy/Sci-Fi Epic.
Art Style Direction: ${artStyle || "Premium Digital Art"}.
Exaggeration Scale: ${exaggeration || 5}/10. ${exaggeration >= 8 ? "PROPORTIONS AND ENERGY SHOULD BE ABSURDLY MASSIVE AND GOD-TIER." : "Keep proportions somewhat grounded."}
Humor/Satire Scale: ${humor || 5}/10. ${humor >= 8 ? "RENDER WITH A PARODY, SILLY, OR HIGHLY MEME-LIKE AESTHETIC WHILE MAINTAINING HIGH QUALITY." : "Render with serious epic drama."}
Species/Form: ${cardData.formBase}.
Energy Core (Element): ${cardData.energyCore}.
Class/Archetype: ${cardData.archetype}.
Signature Weapon: ${cardData.signatureWeapon || "Not specified, hands free"}. MAKE SURE THEY ARE VISUALLY HOLDING OR DISPLAYING THIS WEAPON IF PROVIDED.
Palette: ${cardData.palette}.
Pose: ${cardData.poseVariant}.
Composition: ${cardData.composition}.
Illustration Style Family: ${cardData.illustrationStyle || "Premium Digital Art"}.
${facialFeatures ? `Facial Features & Character Likeness (CRITICAL MATCH): ${facialFeatures}\nThe character portrayed MUST heavily resemble this physical facial description.\n` : ""}
${bossPromptDirective}

STRICT CARD GENERATION RULES:
- Strict vertical 2:3 portrait format.
- Card fills entire frame. No outer margin. No extended cinematic background. No horizontal expansion.
- Border must be continuous and structural. No inset margins. No decorative partial frames. Edge-flush perimeter. Structural perimeter must be fully connected.

AESTHETIC STYLE LOCK (${aestheticStyle} tier):
- The card must feel incredibly premium, intricate, and luxury collector-grade.
- Higher tiers emphasize extreme detailing, dimensional frame sophistication, wow-factor density, and impressive composition drama.
- Use the palette (${cardData.palette}) and theme (${currentTheme}) to determine the border and energy colors. No fixed tier colors.
${getTierPrompt(aestheticStyle)}
- Radiant structural frame. Aura interacts with border. Emergent energy inside card. Subtle glossy sheen overlay. Dimensional pressure effects.

${textSystemPrompt}

No messy anatomy, no extra limbs, ensure a clear, powerful silhouette. Give the character incredible premium rendering quality like an ultra-premium holographic trading card. Design the text layout to be exceptionally clean, legible, and balanced inside the card's dark lower third.`;

      const imageResponse = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image-preview',
        contents: {
          parts: [{ text: imagePrompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: "3:4"
          }
        }
      });

      let generatedImageBase64 = null;
      for (const part of imageResponse.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          generatedImageBase64 = part.inlineData.data;
          break;
        }
      }

      if (generatedImageBase64) {
        const generatedFilename = `summon-${Date.now()}-${Math.round(Math.random() * 1e9)}.png`;
        const generatedFilePath = path.join(uploadDir, generatedFilename);
        fs.writeFileSync(generatedFilePath, Buffer.from(generatedImageBase64, 'base64'));
        imageUrl = `/uploads/${generatedFilename}`;
      }
    } catch (imgError) {
      console.error("Image generation failed:", imgError);
    }

    // Determine border based on theme
    let borderId = "arcane_sapphire";
    if (aestheticStyle === "mythic") borderId = "obsidian_prism";
    else if (aestheticStyle === "legendary") borderId = "gilded_relic";
    else borderId = "arcane_sapphire";

    // Create Verification Hash
    const hashContent = JSON.stringify(cardData) + shortId;
    const verificationHash = crypto.createHash('sha256').update(hashContent).digest('hex');

    // Deduct credit if premium
    if (isPremium) {
      db.prepare("UPDATE users SET credits = credits - 1 WHERE id = ?").run(req.user.id);
    }

    // Save card
    db.prepare(`
      INSERT INTO cards (id, user_id, image_url, identity, strengths, signature_move, weakness, stats, border_id, border_lock_mode, tier, short_id, verification_hash, animal_base, theme, energy_core, archetype, palette, pose_variant, composition, ultimate_title, dna_hash, is_premium, card_spec_json, root_card_id, version_number, generation_type, prompt_base, style_fingerprint)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      cardId,
      req.user.id,
      imageUrl,
      cardData.name || "Unknown Avatar",
      cardData.formTitle || "Unknown Form",
      cardData.ultimateAbility?.name || "Unknown Ability",
      cardData.weakness || "",
      JSON.stringify(stats),
      borderId,
      "ai",
      aestheticStyle,
      shortId,
      verificationHash,
      cardData.formBase || "",
      currentTheme,
      cardData.energyCore || "",
      cardData.archetype || "",
      cardData.palette || "",
      cardData.poseVariant || "",
      cardData.composition || "",
      cardData.ultimateAbility?.name || "",
      dnaHash,
      isPremium ? 1 : 0,
      JSON.stringify(cardData), // card_spec_json
      cardId, // root_card_id
      1, // version_number
      'forge', // generation_type
      imagePrompt, // prompt_base
      cardData.illustrationStyle || "" // style_fingerprint
    );

    res.json({ id: cardId, shortId: shortId });
  } catch (error: any) {
    console.error("Generate error:", error);
    console.error("Error details:", error.message, error.stack);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

router.get("/verify/:shortId", (req: any, res: any) => {
  try {
    const { shortId } = req.params;

    const card = db.prepare(`
      SELECT c.*, u.email 
      FROM cards c 
      JOIN users u ON c.user_id = u.id 
      WHERE c.short_id = ?
    `).get(shortId) as any;

    if (!card) {
      return res.status(404).json({ error: "Card not found or unverified" });
    }

    try {
      card.stats = typeof card.stats === 'string' ? JSON.parse(card.stats) : card.stats;
    } catch (e) {
      console.error("Failed to parse stats for card", card.id);
    }

    res.json({
      verified: true,
      card: {
        id: card.id,
        shortId: card.short_id,
        name: card.identity,
        formBase: card.animal_base,
        formTitle: card.strengths,
        aestheticStyle: card.tier,
        createdAt: card.created_at,
        owner: card.email.split('@')[0],
        verificationHash: card.verification_hash
      }
    });
  } catch (error) {
    console.error("Verification error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/my-cards", authenticate, (req: any, res: any) => {
  try {
    const cards = db.prepare("SELECT * FROM cards WHERE user_id = ? ORDER BY created_at DESC").all(req.user.id);
    const parsedCards = cards.map((card: any) => {
      try {
        card.stats = typeof card.stats === 'string' ? JSON.parse(card.stats) : card.stats;
      } catch (e) {
        console.error("Failed to parse stats for card", card.id);
      }
      if (card.legendary_data) {
        try {
          card.legendary_data = typeof card.legendary_data === 'string' ? JSON.parse(card.legendary_data) : card.legendary_data;
        } catch (e) { }
      }
      if (card.custom_text_overrides) {
        try {
          card.custom_text_overrides = typeof card.custom_text_overrides === 'string' ? JSON.parse(card.custom_text_overrides) : card.custom_text_overrides;
        } catch (e) { }
      }
      card.formBase = card.animal_base;
      card.formTitle = card.strengths;
      return card;
    });
    res.json({ cards: parsedCards });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/user/:userId", (req: any, res: any) => {
  try {
    const { userId } = req.params;

    const user = db.prepare("SELECT id, email FROM users WHERE id = ?").get(userId) as any;
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const cards = db.prepare("SELECT * FROM cards WHERE user_id = ? ORDER BY created_at DESC").all(userId);
    const parsedCards = cards.map((card: any) => {
      try {
        card.stats = typeof card.stats === 'string' ? JSON.parse(card.stats) : card.stats;
      } catch (e) {
        console.error("Failed to parse stats for card", card.id);
      }
      if (card.legendary_data) {
        try {
          card.legendary_data = typeof card.legendary_data === 'string' ? JSON.parse(card.legendary_data) : card.legendary_data;
        } catch (e) { }
      }
      if (card.custom_text_overrides) {
        try {
          card.custom_text_overrides = typeof card.custom_text_overrides === 'string' ? JSON.parse(card.custom_text_overrides) : card.custom_text_overrides;
        } catch (e) { }
      }
      card.formBase = card.animal_base;
      card.formTitle = card.strengths;
      return card;
    });

    res.json({ user: { id: user.id, email: user.email }, cards: parsedCards });
  } catch (error) {
    console.error("Fetch user cards error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Phase 3: Public Endpoints
router.get("/public/:id", (req: any, res: any) => {
  try {
    const cardId = req.params.id;
    const card = db.prepare("SELECT * FROM cards WHERE (short_id = ? OR id = ?) AND is_public = 1").get(cardId, cardId) as any;
    if (!card) return res.status(404).json({ error: "Card not found or is private" });

    // Parse stats
    try { card.stats = typeof card.stats === 'string' ? JSON.parse(card.stats) : card.stats; } catch (e) { }
    if (card.legendary_data) { try { card.legendary_data = typeof card.legendary_data === 'string' ? JSON.parse(card.legendary_data) : card.legendary_data; } catch (e) { } }
    if (card.custom_text_overrides) { try { card.custom_text_overrides = typeof card.custom_text_overrides === 'string' ? JSON.parse(card.custom_text_overrides) : card.custom_text_overrides; } catch (e) { } }
    card.formBase = card.animal_base;
    card.formTitle = card.strengths;

    // Fetch rival/duo details if requested
    const relationships: any = {};
    if (card.rival_id) {
      const rival = db.prepare("SELECT * FROM cards WHERE id = ?").get(card.rival_id) as any;
      if (rival && rival.is_public) {
        try { rival.stats = typeof rival.stats === 'string' ? JSON.parse(rival.stats) : rival.stats; } catch (e) { }
        relationships.rival = rival;
      }
    }
    if (card.duo_id) {
      const duo = db.prepare("SELECT * FROM cards WHERE id = ?").get(card.duo_id) as any;
      if (duo && duo.is_public) {
        try { duo.stats = typeof duo.stats === 'string' ? JSON.parse(duo.stats) : duo.stats; } catch (e) { }
        relationships.duo = duo;
      }
    }

    res.json({ card, relationships });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/public/:id/lineage", (req: any, res: any) => {
  try {
    const cardId = req.params.id;
    // Check if the requested card exists and is public
    const card = db.prepare("SELECT * FROM cards WHERE (short_id = ? OR id = ?) AND is_public = 1").get(cardId, cardId) as any;
    if (!card) return res.status(404).json({ error: "Card not found or is private" });

    const rootId = card.root_card_id || card.id;

    // We only return variants that are public
    const variants = db.prepare(`
      SELECT * FROM cards 
      WHERE (root_card_id = ? OR id = ?) AND is_public = 1
      ORDER BY version_number ASC, created_at ASC
    `).all(rootId, rootId) as any[];

    const parsedVariants = variants.map(v => {
      try { v.stats = typeof v.stats === 'string' ? JSON.parse(v.stats) : v.stats; } catch (e) { }
      v.formBase = v.animal_base;
      v.formTitle = v.strengths;
      if (v.generation_delta) {
        try { v.generation_delta = typeof v.generation_delta === 'string' ? JSON.parse(v.generation_delta) : v.generation_delta; } catch (e) { }
      }
      return v;
    });

    res.json({ variants: parsedVariants, rootId });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", (req: any, res: any) => {
  try {
    const card = db.prepare("SELECT * FROM cards WHERE id = ? OR short_id = ?").get(req.params.id, req.params.id) as any;
    if (!card) {
      return res.status(404).json({ error: "Card not found" });
    }

    // Parse stats
    try {
      card.stats = typeof card.stats === 'string' ? JSON.parse(card.stats) : card.stats;
    } catch (e) {
      console.error("Failed to parse stats for card", card.id);
    }
    if (card.legendary_data) {
      try {
        card.legendary_data = typeof card.legendary_data === 'string' ? JSON.parse(card.legendary_data) : card.legendary_data;
      } catch (e) { }
    }
    if (card.custom_text_overrides) {
      try {
        card.custom_text_overrides = typeof card.custom_text_overrides === 'string' ? JSON.parse(card.custom_text_overrides) : card.custom_text_overrides;
      } catch (e) { }
    }
    card.formBase = card.animal_base;
    card.formTitle = card.strengths;

    // Fetch rival/duo details if requested
    const relationships: any = {};
    if (card.rival_id) {
      const rival = db.prepare("SELECT * FROM cards WHERE id = ?").get(card.rival_id) as any;
      if (rival) {
        try { rival.stats = typeof rival.stats === 'string' ? JSON.parse(rival.stats) : rival.stats; } catch (e) { }
        relationships.rival = rival;
      }
    }
    if (card.duo_id) {
      const duo = db.prepare("SELECT * FROM cards WHERE id = ?").get(card.duo_id) as any;
      if (duo) {
        try { duo.stats = typeof duo.stats === 'string' ? JSON.parse(duo.stats) : duo.stats; } catch (e) { }
        relationships.duo = duo;
      }
    }

    res.json({ card, relationships });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Phase 2: Fetch Lineage
router.get("/:id/lineage", (req: any, res: any) => {
  try {
    const cardId = req.params.id;
    const card = db.prepare("SELECT * FROM cards WHERE id = ? OR short_id = ?").get(cardId, cardId) as any;
    if (!card) return res.status(404).json({ error: "Card not found" });

    const rootId = card.root_card_id || card.id;

    const variants = db.prepare(`
      SELECT * FROM cards 
      WHERE root_card_id = ? OR id = ?
      ORDER BY version_number ASC, created_at ASC
    `).all(rootId, rootId) as any[];

    const parsedVariants = variants.map(v => {
      try { v.stats = typeof v.stats === 'string' ? JSON.parse(v.stats) : v.stats; } catch (e) { }
      v.formBase = v.animal_base;
      v.formTitle = v.strengths;
      if (v.generation_delta) {
        try { v.generation_delta = typeof v.generation_delta === 'string' ? JSON.parse(v.generation_delta) : v.generation_delta; } catch (e) { }
      }
      return v;
    });

    res.json({ variants: parsedVariants, rootId });
  } catch (error) {
    console.error("Lineage fetch error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Phase 2: Set Featured Version in Lineage
router.post("/:id/feature", authenticate, (req: any, res: any) => {
  try {
    const cardId = req.params.id;
    const userId = req.user.id;

    const card = db.prepare("SELECT * FROM cards WHERE (id = ? OR short_id = ?) AND user_id = ?").get(cardId, cardId, userId) as any;
    if (!card) return res.status(404).json({ error: "Card not found or unauthorized" });

    const rootId = card.root_card_id || card.id;

    db.exec("BEGIN TRANSACTION");
    try {
      // Clear featured flag for all cards in this lineage
      db.prepare("UPDATE cards SET is_featured_version = 0 WHERE (root_card_id = ? OR id = ?) AND user_id = ?").run(rootId, rootId, userId);
      // Set featured flag exclusively for this card
      db.prepare("UPDATE cards SET is_featured_version = 1 WHERE id = ?").run(card.id);
      db.exec("COMMIT");
      res.json({ success: true, featuredCardId: card.id });
    } catch (e: any) {
      db.exec("ROLLBACK");
      throw e;
    }
  } catch (error) {
    console.error("Feature card error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Phase 3: Visibility and Relationships
router.post("/:id/visibility", authenticate, (req: any, res: any) => {
  try {
    const { is_public } = req.body;
    const cardId = req.params.id;
    const userId = req.user.id;
    const info = db.prepare("UPDATE cards SET is_public = ? WHERE (short_id = ? OR id = ?) AND user_id = ?").run(is_public ? 1 : 0, cardId, cardId, userId);
    if (info.changes === 0) return res.status(404).json({ error: "Card not found or unauthorized" });
    res.json({ success: true, is_public: !!is_public });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:id/relationships", authenticate, (req: any, res: any) => {
  try {
    const { rival_id, duo_id } = req.body;
    const cardId = req.params.id;
    const userId = req.user.id;

    // Validate that the linked cards also belong to the user (if provided)
    if (rival_id) {
      const rival = db.prepare("SELECT id FROM cards WHERE id = ? AND user_id = ?").get(rival_id, userId);
      if (!rival) return res.status(400).json({ error: "Invalid rival ID" });
    }
    if (duo_id) {
      const duo = db.prepare("SELECT id FROM cards WHERE id = ? AND user_id = ?").get(duo_id, userId);
      if (!duo) return res.status(400).json({ error: "Invalid duo ID" });
    }

    const info = db.prepare("UPDATE cards SET rival_id = ?, duo_id = ? WHERE (short_id = ? OR id = ?) AND user_id = ?").run(rival_id || null, duo_id || null, cardId, cardId, userId);
    if (info.changes === 0) return res.status(404).json({ error: "Card not found or unauthorized" });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:id/upgrade", authenticate, async (req: any, res: any) => {
  try {
    const cardId = req.params.id;
    const userId = req.user.id;

    const card = db.prepare("SELECT * FROM cards WHERE (id = ? OR short_id = ?) AND user_id = ?").get(cardId, cardId, userId) as any;
    if (!card) {
      return res.status(404).json({ error: "Card not found or unauthorized" });
    }

    if (card.is_premium) {
      return res.status(400).json({ error: "Card is already premium" });
    }

    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as any;
    if (!user || user.credits < 1) {
      return res.status(400).json({ error: "Not enough credits" });
    }

    db.prepare("BEGIN TRANSACTION").run();
    try {
      db.prepare("UPDATE users SET credits = credits - 1 WHERE id = ?").run(userId);
      db.prepare("UPDATE cards SET is_premium = 1 WHERE id = ?").run(card.id);
      db.prepare("COMMIT").run();
      res.json({ success: true });
    } catch (e) {
      db.prepare("ROLLBACK").run();
      throw e;
    }
  } catch (error) {
    console.error("Upgrade error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/forge", authenticate, async (req: any, res: any) => {
  const { cardIds, type } = req.body;
  const userId = req.user.id;

  if (!cardIds || !Array.isArray(cardIds) || cardIds.length === 0) {
    return res.status(400).json({ error: "Invalid card IDs" });
  }

  if (type === "merge" && cardIds.length !== 2) {
    return res.status(400).json({ error: "Merge requires exactly 2 cards" });
  }

  if (type === "reforge" && cardIds.length !== 1) {
    return res.status(400).json({ error: "Reforge requires exactly 1 card" });
  }

  try {
    const cards = cardIds.map(id => db.prepare("SELECT * FROM cards WHERE id = ?").get(id) as any);
    if (cards.some(c => !c || c.user_id !== userId)) {
      return res.status(403).json({ error: "Unauthorized or card not found" });
    }

    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as any;
    const cost = type === "merge" ? 3 : 2;
    if (!user || user.credits < cost) {
      return res.status(400).json({ error: `Not enough credits. ${cost} credits required.` });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const ai = new GoogleGenAI({ apiKey });

    let aiData: any = {};
    let dnaHash = "";
    let attempts = 0;
    const maxAttempts = 10;
    let success = false;

    // Aesthetic Style (Determine early for DNA hash)
    const styleRoll = Math.random() * 100;
    let aestheticStyle = "epic";
    let borderId = "arcane_sapphire";

    if (styleRoll > 85) {
      aestheticStyle = "mythic";
      borderId = "obsidian_prism";
    } else if (styleRoll > 50) {
      aestheticStyle = "legendary";
      borderId = "gilded_relic";
    } else {
      aestheticStyle = "epic";
      borderId = "arcane_sapphire";
    }

    while (attempts < maxAttempts && !success) {
      attempts++;

      // Get recent cards
      const recentCards = db.prepare("SELECT * FROM cards ORDER BY created_at DESC LIMIT 7").all() as any[];
      const recentCompositions = recentCards.slice(0, 5).map(c => c.composition).filter(Boolean);

      let prompt = "";
      if (type === "merge") {
        prompt = `
          You are forging a new Final Form character by merging two existing forms.
          Form 1: ${cards[0].identity} (Form: ${cards[0].strengths})
          Form 2: ${cards[1].identity} (Form: ${cards[1].strengths})

          Create a new, ultimate character that combines aspects of both.
          Return the response as a JSON object matching this schema:
          {
            "name": "string (The new character name, max 22 chars)",
            "formBase": "string (The base species or concept. Be creative but descriptive.)",
            "formTitle": "string (The combined archetype/title, e.g., 'Celestial Tyrant')",
            "energyCore": "string (The core energy type)",
            "archetype": "string (The archetype)",
            "palette": "string (The primary color dominance)",
            "poseVariant": "string (The pose variant)",
            "composition": "string (Must be one of: 'Centered floating', 'Dynamic action pose', 'Intimidating low angle', 'Heroic standing')",
            "illustrationStyle": "string (The core illustration style family, rendering language, and whimsy/realism level)",
            "ultimateAbility": {
              "name": "string (A breathtaking title for this ultimate power)",
              "description": "string (A dramatic combat/lore description explaining the devastating or empowering effect.)"
            },
            "guidanceLine": "string (A badass flavor text / quote spoken by the character)"
          }
        `;
      } else {
        prompt = `
          You are reforging an existing character into a new, evolved Final Form.
          Original Form: ${cards[0].identity} (Form: ${cards[0].strengths})

          Create a new, evolved version of this character. It should be related but distinctly different and far more powerful.
          Return the response as a JSON object matching this schema:
          {
            "name": "string (The new character name, max 22 chars)",
            "formBase": "string (The base species or concept. Be creative but descriptive.)",
            "formTitle": "string (The evolved archetype/title)",
            "energyCore": "string (The core energy type)",
            "archetype": "string (The archetype)",
            "palette": "string (The primary color dominance)",
            "poseVariant": "string (The pose variant)",
            "composition": "string (Must be one of: 'Centered floating', 'Dynamic action pose', 'Intimidating low angle', 'Heroic standing')",
            "illustrationStyle": "string (The core illustration style family, rendering language, and whimsy/realism level)",
            "ultimateAbility": {
              "name": "string (A breathtaking title for this ultimate power)",
              "description": "string (A dramatic combat/lore description explaining the devastating or empowering effect.)"
            },
            "guidanceLine": "string (A badass flavor text / quote spoken by the character)"
          }
        `;
      }

      let response;
      try {
        response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                formBase: { type: Type.STRING },
                formTitle: { type: Type.STRING },
                energyCore: { type: Type.STRING },
                archetype: { type: Type.STRING },
                palette: { type: Type.STRING },
                poseVariant: { type: Type.STRING },
                composition: { type: Type.STRING },
                illustrationStyle: { type: Type.STRING },
                ultimateAbility: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    description: { type: Type.STRING }
                  },
                  required: ["name", "description"]
                },
                guidanceLine: { type: Type.STRING }
              },
              required: ["name", "formBase", "formTitle", "energyCore", "archetype", "palette", "poseVariant", "composition", "illustrationStyle", "ultimateAbility", "guidanceLine"]
            }
          }
        });
      } catch (e: any) {
        console.error("Text generation failed:", e);
        if (attempts === maxAttempts) throw new Error(`Text generation failed: ${e.message}`);
        continue;
      }

      try {
        let text = response.text || "{}";
        text = text.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        aiData = JSON.parse(text);
      } catch (e) {
        console.error("Failed to parse card data JSON:", response?.text);
        if (attempts === maxAttempts) aiData = {};
        continue;
      }

      if (!aiData.name || !aiData.formBase) continue;

      // Hard Locks
      const nameExists = db.prepare("SELECT 1 FROM cards WHERE identity = ?").get(aiData.name);
      if (nameExists) continue;

      const abilityExists = db.prepare("SELECT 1 FROM cards WHERE ultimate_title = ?").get(aiData.ultimateAbility?.name);
      if (abilityExists) continue;

      dnaHash = `${aestheticStyle}-${aiData.formBase}-${aiData.energyCore}-${aiData.archetype}-${aiData.palette}-${aiData.poseVariant}`;
      const dnaExists = db.prepare("SELECT 1 FROM cards WHERE dna_hash = ?").get(dnaHash);
      if (dnaExists) continue;



      if (recentCompositions.includes(aiData.composition)) continue;

      success = true;
    }

    if (!success) {
      console.warn("Failed to generate a completely unique card after 10 attempts, using last generated data.");
    }

    const stats = {
      aestheticStyle,
      ultimateAbility: aiData.ultimateAbility,
      guidanceLine: aiData.guidanceLine
    };

    const shortId = generateShortId();

    // Generate Image
    const imagePrompt = `A premium, full-art game trading card featuring a forged Ultimate/Final Form Character.
Theme: Evolved/Merged. Tone: Dramatic, Game-like, Fantasy/Sci-Fi Epic.
Form/Species: ${aiData.formBase}.
Class/Archetype: ${aiData.archetype}.
Energy Core: ${aiData.energyCore}.
Palette: ${aiData.palette}.
Pose Variant: ${aiData.poseVariant}.
Composition: ${aiData.composition}.
Illustration Style Family: ${aiData.illustrationStyle}.

STRICT CARD GENERATION RULES:
- Strict vertical 2:3 portrait format.
- Card fills entire frame. No outer margin. No extended cinematic background. No horizontal expansion.
- Border must be continuous and structural. No inset margins. No decorative partial frames. Edge-flush perimeter. Structural perimeter must be fully connected.

AESTHETIC STYLE LOCK (${aestheticStyle} tier):
- The card must feel incredibly premium, intricate, and luxury collector-grade.
- Higher tiers emphasize extreme detailing, dimensional frame sophistication, wow-factor density, and impressive composition drama.
- Use the palette (${aiData.palette}) to determine the border and energy colors. No fixed tier colors.
${getTierPrompt(aestheticStyle)}
- Radiant structural frame. Aura interacts with border. Emergent energy inside card. Subtle glossy sheen overlay. Dimensional pressure effects.

TEXT SYSTEM (CRITICAL: All requested text must be generated inside the image itself, embedded natively into the lower third card layout panel. IMPORTANT: DO NOT use placeholders like [CARD NAME]. DO NOT invent bracketed labels. DO NOT display template text or add unintended interface formatting. ONLY render the exact text values provided below, nothing else!):
Required layout hierarchy:
Character Name (dominant epic serif font): "${aiData.name}"
Subtitle (refined technical sans serif): "${aiData.formTitle}"
Ultimate Ability Name (small caps header): "${aiData.ultimateAbility?.name || ''}"
Ability Description (clean legible text): "${aiData.ultimateAbility?.description || ''}"
Guidance Line (short italic typography at the very bottom): "${aiData.guidanceLine || ''}"

- Print the Card ID prominently: ${shortId}
- Treat it like a genuine card serial number stamped into the border.

The output must look like a premium collectible card, engineered, authoritative, immersive, dimensional, collectible, and unique. The generated text must be perfectly legible and formally structured as if designed by a UI artist.`;

    let imageUrl = "";
    try {
      const imageResponse = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image-preview',
        contents: {
          parts: [{ text: imagePrompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: "3:4"
          }
        }
      });

      for (const part of imageResponse.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          const base64Data = part.inlineData.data;
          const fileName = `forge-${Date.now()}-${Math.random().toString(36).substring(7)}.png`;
          const filePath = path.join(uploadDir, fileName);
          fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
          imageUrl = `/uploads/${fileName}`;
          break;
        }
      }
    } catch (e) {
      console.error("Image generation failed in forge:", e);
    }

    db.exec('BEGIN TRANSACTION');

    const userCheck = db.prepare("SELECT credits FROM users WHERE id = ?").get(userId) as any;
    if (!userCheck || userCheck.credits < cost) {
      db.exec('ROLLBACK');
      return res.status(400).json({ error: "Not enough credits." });
    }

    db.prepare("UPDATE users SET credits = credits - ? WHERE id = ?").run(cost, userId);

    const newCardId = uuidv4();
    const verificationHash = crypto.createHash('sha256').update(JSON.stringify(aiData) + shortId).digest('hex');

    db.prepare(`
      INSERT INTO cards (id, user_id, identity, strengths, weakness, signature_move, image_url, stats, tier, border_id, border_lock_mode, editable_unlocked, short_id, verification_hash, animal_base, theme, energy_core, archetype, palette, pose_variant, composition, ultimate_title, dna_hash, style_fingerprint)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      newCardId,
      userId,
      aiData.name,
      aiData.formTitle,
      "",
      aiData.ultimateAbility?.description || "",
      imageUrl,
      JSON.stringify(stats),
      aestheticStyle,
      borderId,
      'ai',
      0,
      shortId,
      verificationHash,
      aiData.formBase || "",
      "Evolved/Merged",
      aiData.energyCore || "",
      aiData.archetype || "",
      aiData.palette || "",
      aiData.poseVariant || "",
      aiData.composition || "",
      aiData.ultimateAbility?.name || "",
      dnaHash,
      aiData.illustrationStyle || ""
    );

    // Delete old cards
    for (const id of cardIds) {
      db.prepare("DELETE FROM cards WHERE id = ?").run(id);
    }

    const txId = uuidv4();
    db.prepare(`
      INSERT INTO transactions (id, user_id, type, delta_credits, card_id)
      VALUES (?, ?, ?, ?, ?)
    `).run(txId, userId, type, -cost, newCardId);

    db.exec('COMMIT');

    const newCard = db.prepare("SELECT * FROM cards WHERE id = ?").get(newCardId) as any;
    newCard.stats = JSON.parse(newCard.stats);
    newCard.formBase = newCard.animal_base;
    newCard.formTitle = newCard.strengths;

    res.json({ card: newCard });
  } catch (error) {
    if (db.inTransaction) db.exec('ROLLBACK');
    console.error("Forge error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:id/unlock-editing", authenticate, (req: any, res: any) => {
  try {
    const cardId = req.params.id;
    const userId = req.user.id;

    const card = db.prepare("SELECT * FROM cards WHERE id = ?").get(cardId) as any;
    if (!card) return res.status(404).json({ error: "Card not found" });
    if (card.user_id !== userId) return res.status(403).json({ error: "Forbidden" });

    if (card.editable_unlocked) {
      return res.json({ message: "Already unlocked", card });
    }

    db.exec('BEGIN TRANSACTION');

    const userCheck = db.prepare("SELECT credits FROM users WHERE id = ?").get(userId) as any;
    if (!userCheck || userCheck.credits < 1) {
      db.exec('ROLLBACK');
      return res.status(402).json({ error: "Not enough credits." });
    }

    db.prepare("UPDATE users SET credits = credits - 1 WHERE id = ?").run(userId);
    db.prepare("UPDATE cards SET editable_unlocked = 1 WHERE id = ?").run(cardId);

    const txId = uuidv4();
    db.prepare(`
      INSERT INTO transactions (id, user_id, type, delta_credits, card_id)
      VALUES (?, ?, ?, ?, ?)
    `).run(txId, userId, 'unlock_editing', -1, cardId);

    db.exec('COMMIT');

    const updatedCard = db.prepare("SELECT * FROM cards WHERE id = ?").get(cardId) as any;
    try {
      updatedCard.stats = typeof updatedCard.stats === 'string' ? JSON.parse(updatedCard.stats) : updatedCard.stats;
    } catch (e) {
      console.error("Failed to parse stats for card", cardId);
    }
    if (updatedCard.legendary_data) {
      try {
        updatedCard.legendary_data = typeof updatedCard.legendary_data === 'string' ? JSON.parse(updatedCard.legendary_data) : updatedCard.legendary_data;
      } catch (e) { }
    }
    if (updatedCard.custom_text_overrides) {
      try {
        updatedCard.custom_text_overrides = typeof updatedCard.custom_text_overrides === 'string' ? JSON.parse(updatedCard.custom_text_overrides) : updatedCard.custom_text_overrides;
      } catch (e) { }
    }

    res.json({ card: updatedCard });
  } catch (error) {
    if (db.inTransaction) db.exec('ROLLBACK');
    console.error("Unlock editing error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/:id/edit-text", authenticate, (req: any, res: any) => {
  try {
    const cardId = req.params.id;
    const userId = req.user.id;
    const { field, value } = req.body;

    if (!field || typeof value !== 'string') {
      return res.status(400).json({ error: "Invalid input" });
    }

    const card = db.prepare("SELECT * FROM cards WHERE id = ?").get(cardId) as any;
    if (!card) return res.status(404).json({ error: "Card not found" });
    if (card.user_id !== userId) return res.status(403).json({ error: "Forbidden" });

    if (!card.editable_unlocked) {
      return res.status(403).json({ error: "Editing not unlocked for this card" });
    }

    // Validation Rules
    const limits: Record<string, number> = {
      bossTitle: 60,
      primaryAttack: 90,
      phaseTwoTrigger: 90,
      exposedWeakPoint: 90,
      passiveAura: 120,
      resistance: 150,
    };

    if (!limits[field]) {
      return res.status(400).json({ error: "Invalid field" });
    }

    const sanitizedValue = value.replace(/<[^>]*>?/gm, '').trim();
    if (sanitizedValue.length === 0) {
      return res.status(400).json({ error: "Value cannot be empty" });
    }

    if (sanitizedValue.length > limits[field]) {
      return res.status(400).json({ error: `Value exceeds maximum length of ${limits[field]} characters` });
    }

    let overrides: any = {};
    if (card.custom_text_overrides) {
      try {
        overrides = typeof card.custom_text_overrides === 'string' ? JSON.parse(card.custom_text_overrides) : card.custom_text_overrides;
      } catch (e) { }
    }

    overrides[field] = sanitizedValue;

    db.prepare("UPDATE cards SET custom_text_overrides = ? WHERE id = ?").run(JSON.stringify(overrides), cardId);

    const updatedCard = db.prepare("SELECT * FROM cards WHERE id = ?").get(cardId) as any;
    try {
      updatedCard.stats = typeof updatedCard.stats === 'string' ? JSON.parse(updatedCard.stats) : updatedCard.stats;
    } catch (e) {
      console.error("Failed to parse stats for card", cardId);
    }
    if (updatedCard.legendary_data) {
      try {
        updatedCard.legendary_data = typeof updatedCard.legendary_data === 'string' ? JSON.parse(updatedCard.legendary_data) : updatedCard.legendary_data;
      } catch (e) { }
    }
    if (updatedCard.custom_text_overrides) {
      try {
        updatedCard.custom_text_overrides = typeof updatedCard.custom_text_overrides === 'string' ? JSON.parse(updatedCard.custom_text_overrides) : updatedCard.custom_text_overrides;
      } catch (e) { }
    }

    res.json({ card: updatedCard });
  } catch (error) {
    console.error("Edit text error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/:id/border", authenticate, (req: any, res: any) => {
  try {
    const cardId = req.params.id;
    const userId = req.user.id;
    const { borderId, borderLockMode } = req.body;

    const validBorders = ["gilded_relic", "obsidian_prism", "candy_pop", "crimson_infernal", "arcane_sapphire", "emerald_royal"];
    if (!validBorders.includes(borderId)) {
      return res.status(400).json({ error: "Invalid border ID" });
    }

    if (borderLockMode !== "ai" && borderLockMode !== "user") {
      return res.status(400).json({ error: "Invalid border lock mode" });
    }

    const card = db.prepare("SELECT * FROM cards WHERE id = ?").get(cardId) as any;
    if (!card) return res.status(404).json({ error: "Card not found" });
    if (card.user_id !== userId) return res.status(403).json({ error: "Forbidden" });

    // Only allow if legendary or mythic
    if (card.tier !== 'legendary' && card.tier !== 'mythic') {
      return res.status(403).json({ error: "Must be legendary to customize border" });
    }

    db.prepare("UPDATE cards SET border_id = ?, border_lock_mode = ? WHERE id = ?").run(borderId, borderLockMode, cardId);

    const updatedCard = db.prepare("SELECT * FROM cards WHERE id = ?").get(cardId) as any;
    try {
      updatedCard.stats = typeof updatedCard.stats === 'string' ? JSON.parse(updatedCard.stats) : updatedCard.stats;
    } catch (e) { }
    if (updatedCard.legendary_data) {
      try {
        updatedCard.legendary_data = typeof updatedCard.legendary_data === 'string' ? JSON.parse(updatedCard.legendary_data) : updatedCard.legendary_data;
      } catch (e) { }
    }
    if (updatedCard.custom_text_overrides) {
      try {
        updatedCard.custom_text_overrides = typeof updatedCard.custom_text_overrides === 'string' ? JSON.parse(updatedCard.custom_text_overrides) : updatedCard.custom_text_overrides;
      } catch (e) { }
    }

    res.json({ card: updatedCard });
  } catch (error) {
    console.error("Edit border error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:id/remix", authenticate, async (req: any, res: any) => {
  try {
    const cardId = req.params.id;
    const userId = req.user.id;
    const {
      instructions,
      mode = "visual",
      chips = [],
      preservationLocks = [],
      variationStrength = "Subtle"
    } = req.body;

    const card = db.prepare("SELECT * FROM cards WHERE id = ? AND user_id = ?").get(cardId, userId) as any;
    if (!card) {
      return res.status(404).json({ error: "Card not found or unauthorized" });
    }

    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as any;
    const cost = mode === "ascend" ? 3 : 2; // Ascending costs 3 credits, Remixing costs 2 credits
    if (!user || user.credits < cost) {
      return res.status(400).json({ error: `Not enough credits. ${cost} credits required.` });
    }

    // Allow Mythic cards to be remixed only through proper mythic evolution modes.
    if (card.tier === 'mythic' && !["ascend", "refine_mythic", "bossify_mythic", "corrupt_mythic", "echo_variant"].includes(mode)) {
      return res.status(400).json({ error: "Mythic cards require controlled mythic reforge modes." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "API Key is not set." });
    }
    const ai = new GoogleGenAI({ apiKey });

    // Parse existing stats to feed back to the AI
    let originalStats: any = {};
    try {
      originalStats = typeof card.stats === 'string' ? JSON.parse(card.stats) : card.stats;
    } catch (e) {
      console.warn("Failed to parse original stats for remix", e);
    }

    // Fallback or read spec
    let parentSpec: any = {};
    if (card.card_spec_json) {
      try {
        parentSpec = JSON.parse(card.card_spec_json);
      } catch (e) { }
    } else {
      parentSpec = {
        name: card.identity,
        formBase: card.animal_base,
        formTitle: card.strengths,
        energyCore: card.energy_core,
        archetype: card.archetype,
        palette: card.palette,
        poseVariant: card.pose_variant,
        composition: card.composition,
        ultimateAbility: {
          name: card.ultimate_title || "",
          description: card.signature_move || ""
        },
        stats: originalStats.rpgStats || {},
        passives: originalStats.passives || [],
        weakness: originalStats.weakness || "",
        resistances: originalStats.resistances || "",
        guidanceLine: originalStats.guidanceLine || ""
      };
    }

    let driftInstruction = "";
    if (variationStrength === "Subtle") driftInstruction = "Strictly minimal deviation. Make only requested changes.";
    if (variationStrength === "Moderate") driftInstruction = "Balanced variation. Allow slight stylistic drift but remain highly recognizable.";
    if (variationStrength === "Strong") driftInstruction = "Expressive variation. Core identity remains, but visual forms can shift significantly.";
    if (variationStrength === "Wild") driftInstruction = "Transformative variation. Completely reimagine the character while keeping only the bare essence.";

    if (mode === 'ascend') {
      driftInstruction = "Mythic Ascension. Preserve the SAME visual illustration style family. Do not generate a different person, merely ascend them to the ultimate top-tier quality.";
    } else if (['refine_mythic', 'bossify_mythic', 'corrupt_mythic', 'echo_variant'].includes(mode)) {
      if (variationStrength === "Wild") {
        return res.status(400).json({ error: "Wild variation is too unstable for Mythic artifacts. Use Subtle or Moderate." });
      }
      driftInstruction = "Mythic Reforge. Extremely strict preservation. Maintain the same identity, facial likeness, structure, and mythic rarity tier. DO NOT downgrade.";
    }

    let aiData: any = {};
    let dnaHash = "";
    let attempts = 0;
    const maxAttempts = 10;
    let success = false;

    // Preserve style or upgrade if Boss mode
    let aestheticStyle = card.tier === "rare" ? "epic" : (card.tier || "epic");
    let borderId = card.border_id === "emerald_royal" ? "arcane_sapphire" : (card.border_id || "arcane_sapphire");

    if (mode === "boss" && aestheticStyle !== "mythic") {
      aestheticStyle = "mythic";
      borderId = "obsidian_prism";
    }

    if (mode === "ascend" || ['refine_mythic', 'bossify_mythic', 'corrupt_mythic', 'echo_variant'].includes(mode)) {
      aestheticStyle = "mythic";
      if (!card.border_id || card.border_id === 'emerald_royal') {
        borderId = "obsidian_prism"; // Default to premium for mythics if unspecified
      } else {
        borderId = card.border_id; // Keep their customized mythic border
      }
    }

    let generationPrompt = "";

    while (attempts < maxAttempts && !success) {
      attempts++;

      generationPrompt = `
        This is a remix/reforge of an existing Final Form card. 
        Preserve the same core character identity, visual continuity, and premium collectible card look.
        ${driftInstruction}

        ORIGINAL CHARACTER SPEC (JSON):
        ${JSON.stringify(parentSpec, null, 2)}

        PRESERVATION LOCKS (MUST NOT CHANGE):
        ${preservationLocks.length > 0 ? preservationLocks.join(", ") : "None specified."}

        REMIX INSTRUCTIONS (DELTAS):
        - Mode: ${mode} (${mode === 'visual' ? 'Change presentation, keep lore' :
          mode === 'character' ? 'Evolve lore and styling' :
            mode === 'boss' ? 'Push everything harder, larger scale, final boss energy' :
              mode === 'ascend' ? 'Maximum mythic upgrade' :
                mode === 'refine_mythic' ? 'Subtle improvement, cleaner coherence, reading typography polish' :
                  mode === 'bossify_mythic' ? 'Increase dominance, threat, heavy mythic intimidation' :
                    mode === 'corrupt_mythic' ? 'Introduce dark mythic branch energy, fallen grandeur' :
                      mode === 'echo_variant' ? 'Alternate but highly recognizable premium branch' : ''
        })
        - Selected Quick Chips: ${chips.join(', ') || 'None'}
        - User Custom Request: "${instructions || 'Just enhance and polish the overall design.'}"

        Generate the revised character details based on the above. The output must be strict JSON matching this schema:
        {
          "name": "string (The new character name, max 22 chars)",
          "formBase": "string (The base form species or concept)",
          "formTitle": "string (The form archetype/title)",
          "energyCore": "string (The core energy type)",
          "archetype": "string (The archetype)",
          "palette": "string (The primary color dominance)",
          "poseVariant": "string (The pose variant)",
          "composition": "string (Must be one of: 'Centered floating', 'Dynamic action pose', 'Intimidating low angle', 'Heroic standing')",
          "illustrationStyle": "string (The core illustration style family. Crucial: Evolve within the same aesthetic family unless explicitly requested otherwise)",
          "ultimateAbility": {
            "name": "string (Ability name)",
            "description": "string (Ability description)"
          },
          "stats": { "Power": "integer", "Speed": "integer", "Defense": "integer", "Intelligence": "integer", "Presence": "integer", "Energy": "integer" },
          "passives": ["string"],
          "weakness": "string",
          "resistances": "string",
          "guidanceLine": "string (Flavor text)"
        }
      `;

      let response;
      try {
        response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: generationPrompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                formBase: { type: Type.STRING },
                formTitle: { type: Type.STRING },
                energyCore: { type: Type.STRING },
                archetype: { type: Type.STRING },
                palette: { type: Type.STRING },
                poseVariant: { type: Type.STRING },
                composition: { type: Type.STRING },
                illustrationStyle: { type: Type.STRING },
                ultimateAbility: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    description: { type: Type.STRING }
                  },
                  required: ["name", "description"]
                },
                guidanceLine: { type: Type.STRING }
              },
              required: ["name", "formBase", "formTitle", "energyCore", "archetype", "palette", "poseVariant", "composition", "illustrationStyle", "ultimateAbility", "guidanceLine"]
            }
          }
        });
      } catch (e: any) {
        console.error("Text generation failed during remix:", e);
        if (attempts === maxAttempts) throw new Error(`Text generation failed: ${e.message}`);
        continue;
      }

      try {
        let text = response.text || "{}";
        text = text.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        aiData = JSON.parse(text);
      } catch (e) {
        console.error("Failed to parse remixed card data JSON:", response?.text);
        if (attempts === maxAttempts) aiData = {};
        continue;
      }

      if (!aiData.name || !aiData.formBase) continue;

      dnaHash = `${aestheticStyle}-${aiData.formBase}-${aiData.energyCore}-${aiData.archetype}-${aiData.palette}-${aiData.poseVariant}`;
      success = true;
    }

    if (!success) {
      return res.status(500).json({ error: "Failed to generate remixed card data." });
    }

    const shortId = generateShortId();

    let imagePrompt;

    if (mode === "ascend") {
      imagePrompt = `A premium, full-art game trading card featuring an Ascended Mythic Character.
Theme: ${aiData.formBase}. Tone: Dramatic, Game-like, Fantasy/Sci-Fi Epic.
Energy Core (Element): ${aiData.energyCore}.
Class/Archetype: ${aiData.archetype}.
Palette: ${aiData.palette}.
Pose: ${aiData.poseVariant}.
Composition: ${aiData.composition}.
Illustration Style Family: ${aiData.illustrationStyle || parentSpec.illustrationStyle || "Premium Art"}.

ASCENSION DIRECTIVE:
This is an ascension of an existing Final Form card into a guaranteed Mythic-quality version of the same character.
Preserve the same core identity, visual continuity, and successful design elements. Do not generate a different person.
Upgrade the card into unmistakable top-tier collector-grade mythic quality through structural sophistication, dimensional frame pressure, premium finish, and extraordinary polish.
Do NOT explicitly stamp the word "Mythic" anywhere on the card.

STRICT CARD GENERATION RULES:
- Strict vertical 2:3 portrait format.
- Card fills entire frame. No outer margin. No extended cinematic background. No horizontal expansion.
- Border must be continuous and structural. No inset margins. No decorative partial frames. Edge-flush perimeter. Structural perimeter must be fully connected.

AESTHETIC STYLE LOCK (${aestheticStyle} tier):
- The card must feel incredibly premium, intricate, and luxury collector-grade.
- Higher tiers emphasize extreme detailing, dimensional frame sophistication, wow-factor density, and impressive composition drama.
- Use the palette (${aiData.palette}) to determine the border and energy colors. No fixed tier colors.
${getTierPrompt(aestheticStyle)}
- Radiant structural frame. Aura interacts with border. Emergent energy inside card. Subtle glossy sheen overlay. Dimensional pressure effects.

TEXT SYSTEM (CRITICAL: All requested text must be generated inside the image itself, embedded natively into the card's framing layout. Treat this exactly like rendering a physical trading card with text printed into the bottom frame panels. IMPORTANT: DO NOT use placeholders like [CARD NAME]. DO NOT invent bracketed labels. DO NOT display template text or add unintended interface formatting. ONLY render the exact text values provided below, nothing else!):
Character Name (dominant epic cinematic font): "${aiData.name}"
Subtitle (below name, sleek font): "${aiData.formTitle}"
Ultimate Ability Info Box (wide centered across bottom edge):
Ability Name: "${aiData.ultimateAbility?.name || ''}"
Ability Description: "${aiData.ultimateAbility?.description || ''}"
Flavor Text Quote (italics at the very bottom): "${aiData.guidanceLine || ''}"

No messy anatomy, no extra limbs, ensure a clear, powerful silhouette. Give the character incredible premium rendering quality like an ultra-premium holographic trading card. Design the text layout to be exceptionally clean, legible, and balanced inside the card's dark lower third.`;
    } else {
      let subjectLine = "a Remixed/Evolved Character";
      if (['refine_mythic', 'bossify_mythic', 'corrupt_mythic', 'echo_variant'].includes(mode)) {
        subjectLine = "a Mythic Reforged Character Branch";
      }

      imagePrompt = `A premium, full-art game trading card featuring ${subjectLine}.
Theme: ${aiData.formBase}. Tone: Dramatic, Game-like, Fantasy/Sci-Fi Epic.
Energy Core (Element): ${aiData.energyCore}.
Class/Archetype: ${aiData.archetype}.
Palette: ${aiData.palette}.
Pose: ${aiData.poseVariant}.
Composition: ${aiData.composition}.
Illustration Style Family: ${aiData.illustrationStyle || parentSpec.illustrationStyle || "Premium Art"}.

REMIX GOAL: ${instructions || 'Enhance and polish'}
CHIPS APPLIED: ${chips.join(', ')}

${mode === 'boss' ? 'ULTIMATE FINAL BOSS MODE ENABLED. Maximum visual intimidation and dramatic dominance in the composition. Strip away standard borders, make the character break out of the frame.' : ''}

STRICT CARD GENERATION RULES:
- Strict vertical 2:3 portrait format.
- Card fills entire frame. No outer margin. No extended cinematic background. No horizontal expansion.
- Border must be continuous and structural. No inset margins. No decorative partial frames. Edge-flush perimeter. Structural perimeter must be fully connected.

AESTHETIC STYLE LOCK (${aestheticStyle} tier):
- The card must feel incredibly premium, intricate, and luxury collector-grade.
- Higher tiers emphasize extreme detailing, dimensional frame sophistication, wow-factor density, and impressive composition drama.
- Use the palette (${aiData.palette}) to determine the border and energy colors. No fixed tier colors.
${getTierPrompt(aestheticStyle)}
- Radiant structural frame. Aura interacts with border. Emergent energy inside card. Subtle glossy sheen overlay. Dimensional pressure effects.

TEXT SYSTEM (CRITICAL: All requested text must be generated inside the image itself, embedded natively into the card's framing layout. Treat this exactly like rendering a physical trading card with text printed into the bottom frame panels. IMPORTANT: DO NOT use placeholders like [CARD NAME]. DO NOT invent bracketed labels. DO NOT display template text or add unintended interface formatting. ONLY render the exact text values provided below, nothing else!):
${mode === 'boss' ? 'Top Center Label (prominent, glowing, epic typography at the very top of the card): "EPIC FINAL BOSS"\\n' : ''}Character Name (dominant epic cinematic font): "${aiData.name}"
Subtitle (below name, sleek font): "${aiData.formTitle}"
Ultimate Ability Info Box (wide centered across bottom edge):
Ability Name: "${aiData.ultimateAbility?.name || ''}"
Ability Description: "${aiData.ultimateAbility?.description || ''}"
Flavor Text Quote (italics at the very bottom): "${aiData.guidanceLine || ''}"

No messy anatomy, no extra limbs, ensure a clear, powerful silhouette. Give the character incredible premium rendering quality like an ultra-premium holographic trading card. Design the text layout to be exceptionally clean, legible, and balanced inside the card's dark lower third.`;
    }

    let imageUrl = "";
    try {
      const imageResponse = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image-preview',
        contents: {
          parts: [{ text: imagePrompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: "3:4"
          }
        }
      });

      for (const part of imageResponse.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          const base64Data = part.inlineData.data;
          const fileName = `remix-${Date.now()}-${Math.random().toString(36).substring(7)}.png`;
          const filePath = path.join(uploadDir, fileName);
          fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
          imageUrl = `/uploads/${fileName}`;
          break;
        }
      }
    } catch (e) {
      console.error("Image generation failed in remix:", e);
    }

    db.exec('BEGIN TRANSACTION');

    const userCheck = db.prepare("SELECT credits FROM users WHERE id = ?").get(userId) as any;
    if (!userCheck || userCheck.credits < cost) {
      db.exec('ROLLBACK');
      return res.status(400).json({ error: "Not enough credits." });
    }

    db.prepare("UPDATE users SET credits = credits - ? WHERE id = ?").run(cost, userId);

    const newCardId = uuidv4();
    const verificationHash = crypto.createHash('sha256').update(JSON.stringify(aiData) + shortId).digest('hex');

    const statsObject = {
      aestheticStyle: aestheticStyle,
      ultimateAbility: aiData.ultimateAbility,
      guidanceLine: aiData.guidanceLine,
      rpgStats: originalStats.rpgStats || { Power: 50, Speed: 50, Defense: 50, Intelligence: 50, Presence: 50, Energy: 50 },
      signatureWeapon: originalStats.signatureWeapon || "",
      passives: originalStats.passives || [],
      resistances: originalStats.resistances || "",
      weakness: originalStats.weakness || "",
      displayOptions: originalStats.displayOptions || { stats: false, ultimate: true, passives: false, resistances: false, quote: true, weapon: false },
      inputs: originalStats.inputs || {}
    };

    const rootCardId = card.root_card_id || cardId;
    const versionNumber = (card.version_number || 1) + 1;

    const generationDelta = {
      mode,
      instructions: instructions || "",
      chips,
      preservationLocks,
      variationStrength,
      timestamp: new Date().toISOString()
    };

    db.prepare(`
      INSERT INTO cards (
        id, user_id, identity, strengths, weakness, signature_move, image_url, stats, 
        tier, border_id, border_lock_mode, editable_unlocked, short_id, verification_hash, 
        animal_base, theme, energy_core, archetype, palette, pose_variant, composition, 
        ultimate_title, dna_hash, is_premium, parent_id, is_remix, remix_mode, 
        remix_instructions, remix_chip_selections,
        card_spec_json, root_card_id, version_number, generation_type, prompt_base,
        preserved_traits_json, variation_strength, consistency_mode, generation_delta,
        style_fingerprint
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      newCardId,
      userId,
      aiData.name,
      aiData.formTitle,
      originalStats.weakness || "",
      aiData.ultimateAbility?.description || "",
      imageUrl,
      JSON.stringify(statsObject),
      aestheticStyle,
      borderId,
      'ai',
      0,
      shortId,
      verificationHash,
      aiData.formBase || "",
      card.theme || "Remixed Form",
      aiData.energyCore || "",
      aiData.archetype || "",
      aiData.palette || "",
      aiData.poseVariant || "",
      aiData.composition || "",
      aiData.ultimateAbility?.name || "",
      dnaHash,
      mode === 'boss' ? 1 : (card.is_premium || 0),
      cardId,
      1,
      mode,
      instructions || "",
      JSON.stringify(chips),
      JSON.stringify(aiData), // card_spec_json
      rootCardId,
      versionNumber,
      mode === 'ascend' ? 'evolution' : 'remix', // generation_type
      imagePrompt, // prompt_base (for image generation)
      JSON.stringify(preservationLocks),
      variationStrength,
      'strict', // consistency_mode default
      JSON.stringify(generationDelta), // generation_delta
      aiData.illustrationStyle || "" // style_fingerprint
    );

    const txId = uuidv4();
    db.prepare(`
      INSERT INTO transactions (id, user_id, type, delta_credits, card_id)
      VALUES (?, ?, ?, ?, ?)
    `).run(txId, userId, 'remix', -cost, newCardId);

    db.exec('COMMIT');

    const newCard = db.prepare("SELECT * FROM cards WHERE id = ?").get(newCardId) as any;
    newCard.stats = JSON.parse(newCard.stats);
    newCard.formBase = newCard.animal_base;
    newCard.formTitle = newCard.strengths;

    res.json({ card: newCard });
  } catch (error) {
    if (db.inTransaction) db.exec('ROLLBACK');
    console.error("Remix error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
