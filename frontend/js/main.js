/**
 * ARENA CLASH — Main Entry Point
 * 
 * Initializes Phaser 3 game instance and registers all scenes.
 * Handles DOM UI interactions (menus, modals) that live outside the canvas.
 */

import { GAME_CONFIG } from './config/gameConfig.js';
import { BootScene } from './scenes/BootScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { CharSelectScene } from './scenes/CharSelectScene.js';
import { GameScene } from './scenes/GameScene.js';
import { HUDScene } from './scenes/HUDScene.js';

// ─── Phaser Configuration ────────────────────────────────────────
const phaserConfig = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: GAME_CONFIG.GAME_WIDTH,
    height: GAME_CONFIG.GAME_HEIGHT,
    backgroundColor: GAME_CONFIG.BACKGROUND_COLOR,
    pixelArt: GAME_CONFIG.PIXEL_ART,
    antialias: GAME_CONFIG.ANTIALIAS,

    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },

    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false,
        },
    },

    fps: {
        target: GAME_CONFIG.MAX_FPS,
        forceSetTimeOut: false,
    },

    scene: [BootScene, MenuScene, CharSelectScene, GameScene, HUDScene],

    input: {
        activePointers: 3, // Support multi-touch for mobile
    },

    render: {
        antialias: true,
        roundPixels: false,
    },
};

// ─── Create Game Instance ────────────────────────────────────────
const game = new Phaser.Game(phaserConfig);

// ─── DOM UI Controller ───────────────────────────────────────────
// Handles overlays and modals that exist in HTML (not Phaser canvas)

class UIController {
    constructor() {
        // Cache DOM elements
        this.menuOverlay = document.getElementById('menu-overlay');
        this.charselectOverlay = document.getElementById('charselect-overlay');
        this.connectionOverlay = document.getElementById('connection-overlay');
        this.hudOverlay = document.getElementById('hud-overlay');
        this.settingsModal = document.getElementById('settings-modal');
        this.aboutModal = document.getElementById('about-modal');

        this.connectionText = document.getElementById('connection-text');
        this.connectionSubtext = document.getElementById('connection-subtext');

        // Load saved settings
        this.loadSettings();

        // Bind events
        this.bindMenuEvents();
        this.bindSettingsEvents();
        this.bindAboutEvents();
    }

    // ── Settings Persistence ──────────────────────────────────
    loadSettings() {
        const saved = localStorage.getItem('arenaclash_settings');
        if (saved) {
            try {
                const settings = JSON.parse(saved);
                if (settings.nickname) {
                    document.getElementById('setting-nick').value = settings.nickname;
                }
                if (settings.volume !== undefined) {
                    document.getElementById('setting-volume').value = settings.volume;
                    document.getElementById('volume-value').textContent = settings.volume + '%';
                }
                if (settings.sfx !== undefined) {
                    document.getElementById('setting-sfx').value = settings.sfx;
                    document.getElementById('sfx-value').textContent = settings.sfx + '%';
                }
                if (settings.quality) {
                    const radio = document.querySelector(`input[name="quality"][value="${settings.quality}"]`);
                    if (radio) radio.checked = true;
                }
            } catch (e) {
                console.warn('[UI] Failed to load settings:', e);
            }
        }

        // Generate random nickname if empty
        if (!document.getElementById('setting-nick').value) {
            document.getElementById('setting-nick').value = 'Player' + Math.floor(Math.random() * 9000 + 1000);
        }
    }

    saveSettings() {
        const settings = {
            nickname: document.getElementById('setting-nick').value || 'Player',
            volume: parseInt(document.getElementById('setting-volume').value, 10),
            sfx: parseInt(document.getElementById('setting-sfx').value, 10),
            quality: document.querySelector('input[name="quality"]:checked')?.value || 'medium',
        };
        localStorage.setItem('arenaclash_settings', JSON.stringify(settings));
        return settings;
    }

    getSettings() {
        return {
            nickname: document.getElementById('setting-nick').value || 'Player',
            volume: parseInt(document.getElementById('setting-volume').value, 10) / 100,
            sfx: parseInt(document.getElementById('setting-sfx').value, 10) / 100,
            quality: document.querySelector('input[name="quality"]:checked')?.value || 'medium',
        };
    }

    // ── Menu Events ───────────────────────────────────────────
    bindMenuEvents() {
        document.getElementById('btn-play').addEventListener('click', () => {
            this.showScreen('charselect');
            game.scene.stop('MenuScene');
            game.scene.start('CharSelectScene');
        });

        document.getElementById('btn-settings').addEventListener('click', () => {
            this.settingsModal.classList.add('active');
        });

        document.getElementById('btn-about').addEventListener('click', () => {
            this.aboutModal.classList.add('active');
        });

        document.getElementById('btn-back-menu').addEventListener('click', () => {
            this.showScreen('menu');
            game.scene.stop('CharSelectScene');
            game.scene.start('MenuScene');
        });
    }

    // ── Settings Events ───────────────────────────────────────
    bindSettingsEvents() {
        const volumeSlider = document.getElementById('setting-volume');
        const sfxSlider = document.getElementById('setting-sfx');
        const volumeValue = document.getElementById('volume-value');
        const sfxValue = document.getElementById('sfx-value');

        volumeSlider.addEventListener('input', () => {
            volumeValue.textContent = volumeSlider.value + '%';
        });

        sfxSlider.addEventListener('input', () => {
            sfxValue.textContent = sfxSlider.value + '%';
        });

        document.getElementById('btn-settings-close').addEventListener('click', () => {
            this.saveSettings();
            this.settingsModal.classList.remove('active');

            // Notify Phaser scenes about settings change
            game.events.emit('settingsChanged', this.getSettings());
        });
    }

    // ── About Events ──────────────────────────────────────────
    bindAboutEvents() {
        document.getElementById('btn-about-close').addEventListener('click', () => {
            this.aboutModal.classList.remove('active');
        });

        // Close modals on backdrop click
        document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
            backdrop.addEventListener('click', () => {
                this.settingsModal.classList.remove('active');
                this.aboutModal.classList.remove('active');
            });
        });
    }

    // ── Screen Transitions ────────────────────────────────────
    showScreen(screen) {
        // Hide all overlays
        this.menuOverlay.classList.remove('active');
        this.charselectOverlay.classList.remove('active');
        this.connectionOverlay.classList.remove('active');

        switch (screen) {
            case 'menu':
                this.menuOverlay.classList.add('active');
                break;
            case 'charselect':
                this.charselectOverlay.classList.add('active');
                break;
            case 'connecting':
                this.connectionOverlay.classList.add('active');
                break;
            case 'game':
                this.hudOverlay.style.display = 'block';
                this.hudOverlay.classList.add('active');
                break;
        }
    }

    updateConnectionStatus(text, subtext) {
        if (this.connectionText) this.connectionText.textContent = text;
        if (this.connectionSubtext) this.connectionSubtext.textContent = subtext || '';
    }

    hideAllOverlays() {
        this.menuOverlay.classList.remove('active');
        this.charselectOverlay.classList.remove('active');
        this.connectionOverlay.classList.remove('active');
    }
}

// ─── Initialize UI Controller ────────────────────────────────────
const ui = new UIController();

// Expose to Phaser scenes via game registry
game.registry.set('ui', ui);
game.registry.set('gameConfig', GAME_CONFIG);

// ─── Global Error Handler ────────────────────────────────────────
window.addEventListener('error', (e) => {
    console.error('[ARENA CLASH] Global error:', e.message);
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('[ARENA CLASH] Unhandled promise rejection:', e.reason);
});

// Prevent context menu in game
document.addEventListener('contextmenu', (e) => {
    if (e.target.closest('#game-container')) {
        e.preventDefault();
    }
});

export { game, ui };
