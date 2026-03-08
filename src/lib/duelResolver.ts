export interface DuelResult {
    winner: 'A' | 'B';
    winnerCard: any;
    confidence: 'Low' | 'Medium' | 'High';
    summary: string;
    veoPrompt: string;
}

export function resolveDuel(cardA: any, cardB: any): DuelResult {
    // 1. Unpack stats payloads safely
    const parsedA = parseStats(cardA);
    const parsedB = parseStats(cardB);

    // 2. Compute Matchup Score
    const scoreA = computeTotalScore(cardA, parsedA, parsedB);
    const scoreB = computeTotalScore(cardB, parsedB, parsedA);

    const diff = Math.abs(scoreA - scoreB);
    const winner = scoreA >= scoreB ? 'A' : 'B';
    const winnerCard = scoreA >= scoreB ? cardA : cardB;
    const loserCard = scoreA >= scoreB ? cardB : cardA;
    const winnerParsed = scoreA >= scoreB ? parsedA : parsedB;
    const loserParsed = scoreA >= scoreB ? parsedB : parsedA;

    let confidence: 'Low' | 'Medium' | 'High' = 'Medium';
    if (diff < 20) confidence = 'Low';
    if (diff > 100) confidence = 'High';

    // 3. Generate Battle Summary
    const summary = generateSummary(winnerCard, loserCard, winnerParsed, loserParsed, confidence);

    // 4. Generate Veo Prompt
    const veoPrompt = generateVeoPrompt(winnerCard, loserCard, winnerParsed, loserParsed);

    return {
        winner,
        winnerCard,
        confidence,
        summary,
        veoPrompt
    };
}

function parseStats(card: any) {
    try {
        return typeof card.stats === 'string' ? JSON.parse(card.stats) : (card.stats || {});
    } catch (e) {
        return {};
    }
}

function computeTotalScore(card: any, parsed: any, opponentParsed: any): number {
    let score = 0;

    // Base RPG Stats
    const rpg = parsed.rpgStats || {};
    score += (rpg.Power || 50) + (rpg.Speed || 50) + (rpg.Defense || 50);
    score += (rpg.Intelligence || 50) + (rpg.Presence || 50) + (rpg.Energy || 50);

    // Mythic / Final Boss Bonus
    if (card.tier === 'mythic') score += 50;
    if (card.tier === 'final_boss') score += 80;

    // Basic elemental/interaction pseudo-RNG advantage to add minor flavor variation based on ID
    const hashVal = (card.id || "").charCodeAt(0) || 0;
    score += (hashVal % 20);

    // Note: True parsing of weakness/resistance strings is too complex for MVP,
    // so we approximate a stable deterministic score. 
    return score;
}

function getCardBaseInfo(card: any, parsed: any) {
    const name = card.identity || 'Unknown Entity';
    const formTitle = card.strengths || parsed.formTitle || 'Apex Form';
    const archetype = card.archetype || parsed.inputs?.archetype || 'Warrior';
    const energyCore = card.energy_core || parsed.inputs?.energyCore || 'Cosmic Energy';
    const signatureWeapon = parsed.signatureWeapon || 'their bare hands';
    const ultimateAbility = parsed.ultimateAbility?.name || card.signature_move || 'a devastating blast';
    const passives = Array.isArray(parsed.passives) ? parsed.passives.join(' and ') : (parsed.passives || 'an imposing aura');
    const presence = parsed.rpgStats?.Presence > 80 ? 'dominating' : 'commanding';

    return { name, formTitle, archetype, energyCore, signatureWeapon, ultimateAbility, passives, presence };
}

function generateSummary(winnerCard: any, loserCard: any, winnerParsed: any, loserParsed: any, confidence: string): string {
    const w = getCardBaseInfo(winnerCard, winnerParsed);
    const l = getCardBaseInfo(loserCard, loserParsed);

    const confidenceText = confidence === 'High' ? 'effortlessly overpowers' : confidence === 'Medium' ? 'systematically dismantles' : 'narrowly defeats';

    return `In a shattering clash of ${w.energyCore} and ${l.energyCore}, ${w.name} ${confidenceText} ${l.name}. ` +
        `Despite ${l.name}'s desperate assault with ${l.signatureWeapon}, they are ultimately outmatched by ${w.name}'s flawless combat tempo. ` +
        `The battle concludes definitively when ${w.name} unleashes ${w.ultimateAbility}, sealing their victory in a brilliant display of absolute power.`;
}

function generateVeoPrompt(winnerCard: any, loserCard: any, winnerParsed: any, loserParsed: any): string {
    const w = getCardBaseInfo(winnerCard, winnerParsed);
    const l = getCardBaseInfo(loserCard, loserParsed);

    return `Create an 8-second cinematic fantasy/sci-fi duel between two collectible card characters.

Fighter 1:
${w.name}, ${w.formTitle}, a ${w.archetype} empowered by ${w.energyCore}, wielding ${w.signatureWeapon}. Their combat style is defined by ${w.ultimateAbility}, ${w.passives}, and a ${w.presence} presence.

Fighter 2:
${l.name}, ${l.formTitle}, a ${l.archetype} empowered by ${l.energyCore}, wielding ${l.signatureWeapon}. Their combat style is defined by ${l.ultimateAbility}, ${l.passives}, and a ${l.presence} presence.

Environment:
A dramatic premium battle arena that fits both fighters' energy themes, with cinematic lighting, strong atmosphere, and AAA fantasy/sci-fi trailer quality.

Choreography:
Start with a tense face-off and energy build-up. Show a fast, readable clash of signature weapons and powers. Emphasize both fighters' unique silhouettes, energy effects, and combat identity. Keep the action visually coherent and intense.

Outcome:
${w.name} gains the upper hand and lands the decisive final blow using ${w.ultimateAbility}, overpowering the opponent in a dramatic final impact.

Visual direction:
Ultra-premium cinematic game trailer style, dynamic camera movement, strong motion clarity, dramatic lighting, high visual coherence, clean silhouettes, readable action, not messy.`;
}
