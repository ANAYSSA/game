/**
 * ARENA CLASH — Audio Manager
 * 
 * Generates and plays game sounds using Web Audio API.
 * All sounds are synthesized procedurally — no external audio files.
 */

export class AudioManager {
    constructor() {
        this.context = null;
        this.masterVolume = 0.7;
        this.sfxVolume = 0.8;
        this.enabled = true;

        // Initialize on first user interaction (browser requirement)
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;

        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.context.createGain();
            this.masterGain.gain.value = this.masterVolume;
            this.masterGain.connect(this.context.destination);

            this.sfxGain = this.context.createGain();
            this.sfxGain.gain.value = this.sfxVolume;
            this.sfxGain.connect(this.masterGain);

            this.initialized = true;
            console.log('[Audio] Initialized');
        } catch (e) {
            console.warn('[Audio] Web Audio API not supported:', e);
            this.enabled = false;
        }
    }

    setVolume(volume) {
        this.masterVolume = volume;
        if (this.masterGain) this.masterGain.gain.value = volume;
    }

    setSfxVolume(volume) {
        this.sfxVolume = volume;
        if (this.sfxGain) this.sfxGain.gain.value = volume;
    }

    // ═══════════════════════════════════════════════════════════
    //  SYNTHESIZED SOUNDS
    // ═══════════════════════════════════════════════════════════

    playAttack(charId) {
        this.init(); // Ensure initialized on first interaction
        switch (charId) {
            case 'gopnik': this.playKnifeSlash(); break;
            case 'armor': this.playCannonShot(); break;
            case 'godzilla': this.playFireBreath(); break;
        }
    }

    playKnifeSlash() {
        if (!this.enabled || !this.initialized) return;
        this.playNoise(0.08, 2000, 500, 0.3);
    }

    playCannonShot() {
        if (!this.enabled || !this.initialized) return;
        this.playTone(80, 0.15, 'square', 0.4);
        this.playNoise(0.2, 3000, 100, 0.3);
    }

    playFireBreath() {
        if (!this.enabled || !this.initialized) return;
        this.playNoise(0.4, 1500, 200, 0.25);
    }

    playHit() {
        if (!this.enabled || !this.initialized) return;
        this.playTone(200, 0.08, 'square', 0.3);
    }

    playDeath() {
        if (!this.enabled || !this.initialized) return;
        this.playTone(150, 0.3, 'sawtooth', 0.3, 50);
    }

    playRespawn() {
        if (!this.enabled || !this.initialized) return;
        this.playTone(400, 0.2, 'sine', 0.2, 800);
    }

    playConnect() {
        if (!this.enabled || !this.initialized) return;
        this.playTone(523, 0.1, 'sine', 0.2);
        setTimeout(() => this.playTone(659, 0.1, 'sine', 0.2), 100);
        setTimeout(() => this.playTone(784, 0.15, 'sine', 0.2), 200);
    }

    playFootstep() {
        if (!this.enabled || !this.initialized) return;
        this.playNoise(0.03, 400, 100, 0.05);
    }

    // ═══════════════════════════════════════════════════════════
    //  SYNTHESIS HELPERS
    // ═══════════════════════════════════════════════════════════

    playTone(freq, duration, type, volume, endFreq) {
        const ctx = this.context;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = type || 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        if (endFreq) {
            osc.frequency.linearRampToValueAtTime(endFreq, ctx.currentTime + duration);
        }

        gain.gain.setValueAtTime(volume || 0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + duration);
    }

    playNoise(duration, freqHigh, freqLow, volume) {
        const ctx = this.context;
        const bufferSize = ctx.sampleRate * duration;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const source = ctx.createBufferSource();
        source.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(freqHigh, ctx.currentTime);
        if (freqLow) {
            filter.frequency.linearRampToValueAtTime(freqLow, ctx.currentTime + duration);
        }
        filter.Q.value = 1;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(volume || 0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);

        source.start(ctx.currentTime);
    }
}
