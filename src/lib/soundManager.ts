export class SoundManager {
    private enabled: boolean = true;
    private volume: number = 0.5;
    private loops: Map<string, HTMLAudioElement> = new Map();

    // Placeholder sound assets mapping
    private sounds: Record<string, string> = {
        sfx_generate_start: '/sounds/generate-start.mp3',
        sfx_reveal_ambient_loop: '/sounds/reveal-ambient-loop.mp3',
        sfx_reveal_tick: '/sounds/reveal-tick.mp3',
        sfx_reveal_tease: '/sounds/reveal-tease.mp3',
        sfx_card_flip: '/sounds/card-flip.mp3',
        sfx_card_impact: '/sounds/card-impact.mp3',
        sfx_foil_shimmer: '/sounds/foil-shimmer.mp3',
        sfx_save_card: '/sounds/save-card.mp3',
        sfx_reforge_start: '/sounds/reforge-start.mp3',
        sfx_ui_open: '/sounds/ui-open.mp3',
        sfx_ui_close: '/sounds/ui-close.mp3',
        sfx_chip_toggle: '/sounds/chip-toggle.mp3',
        sfx_share: '/sounds/share.mp3',
        sfx_ui_hover: '/sounds/ui-hover.mp3',
        sfx_ui_click: '/sounds/ui-click.mp3',
        sfx_error: '/sounds/error.mp3',
        sfx_success: '/sounds/success.mp3',
        sfx_forge_select: '/sounds/forge-select.mp3',
        sfx_forge_merge: '/sounds/forge-merge.mp3',
        sfx_theme_song: '/sounds/main-theme.mp3',
    };

    constructor() {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('final_form_sound_enabled');
            if (saved !== null) {
                this.enabled = saved === 'true';
            }
            const savedVol = localStorage.getItem('final_form_volume');
            if (savedVol !== null) {
                this.volume = parseFloat(savedVol);
            } else {
                this.volume = 0.5;
            }
        }
    }

    public toggleSound() {
        this.setEnabled(!this.enabled);
    }

    public setEnabled(enabled: boolean) {
        this.enabled = enabled;
        localStorage.setItem('final_form_sound_enabled', enabled.toString());
        if (!enabled) {
            for (const audio of this.loops.values()) {
                audio.pause();
            }
        } else {
            for (const audio of this.loops.values()) {
                audio.play().catch(() => { });
            }
        }
        // Dispatch event so React components can update UI
        window.dispatchEvent(new Event('soundSettingsChanged'));
    }

    public isEnabled() {
        return this.enabled;
    }

    public getVolume() {
        return this.volume;
    }

    public setVolume(volume: number) {
        this.volume = Math.min(1, Math.max(0, volume));
        localStorage.setItem('final_form_volume', this.volume.toString());

        // Update volume on currently playing loops
        for (const audio of this.loops.values()) {
            audio.volume = this.volume;
        }

        window.dispatchEvent(new CustomEvent('volumeChanged', { detail: { volume: this.volume } }));
    }

    public playSound(name: keyof typeof this.sounds, options?: { volume?: number, playbackRate?: number }) {
        // SFX disabled per user request
        return;
    }

    public playLoop(name: keyof typeof this.sounds, options?: { volume?: number }) {
        // Only allow theme song loop to play
        if (name !== 'sfx_theme_song') return;

        if (this.loops.has(name)) {
            const audio = this.loops.get(name)!;
            if (this.enabled && audio.paused) {
                audio.play().catch(() => { });
            }
            return;
        }

        try {
            const audio = new Audio(this.sounds[name]);
            audio.volume = Math.min(1, Math.max(0, (options?.volume ?? 1) * this.volume));
            audio.loop = true;

            this.loops.set(name, audio);

            if (this.enabled) {
                const playPromise = audio.play();
                if (playPromise !== undefined) {
                    playPromise.catch(_e => {
                        // Ignore error gracefully
                    });
                }
            }
        } catch (e) {
            // Ignore creation error
        }
    }

    public stopLoop(name: keyof typeof this.sounds, fadeOutMs = 300) {
        const audio = this.loops.get(name);
        if (!audio) return;

        this.loops.delete(name);

        if (fadeOutMs <= 0) {
            audio.pause();
            audio.currentTime = 0;
            return;
        }

        // Fade out
        const startVol = audio.volume;
        const steps = 10;
        const stepTime = fadeOutMs / steps;
        const volStep = startVol / steps;
        let currentStep = 0;

        const fade = setInterval(() => {
            currentStep++;
            if (currentStep >= steps) {
                audio.pause();
                audio.currentTime = 0;
                clearInterval(fade);
            } else {
                audio.volume = Math.max(0, startVol - (volStep * currentStep));
            }
        }, stepTime);
    }

    public stopAll() {
        for (const [name, audio] of this.loops.entries()) {
            try {
                audio.pause();
                audio.currentTime = 0;
            } catch (e) { }
        }
        this.loops.clear();
    }
}

export const soundManager = new SoundManager();
