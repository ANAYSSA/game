/**
 * ARENA CLASH — Character Select Scene
 * 
 * Generates character cards in the DOM and handles selection logic.
 * After selection, connects to the game server and transitions to GameScene.
 */

import { CHARACTER_DATA, CHARACTER_ORDER } from '../config/characters.js';
import { GAME_CONFIG } from '../config/gameConfig.js';

export class CharSelectScene extends Phaser.Scene {
    constructor() {
        super({ key: 'CharSelectScene' });
        this.selectedCharacter = null;
    }

    create() {
        console.log('[CharSelectScene] Started');

        this.ui = this.registry.get('ui');
        this.selectedCharacter = null;

        // Generate character cards in the DOM
        this.generateCards();

        // Bind battle button
        this.battleBtn = document.getElementById('btn-battle');
        this.battleHandler = () => this.startBattle();
        this.battleBtn.addEventListener('click', this.battleHandler);

        // Add background particles
        this.createBackgroundParticles();

        // Register cleanup on scene shutdown
        this.events.once('shutdown', this.cleanup, this);
    }

    createBackgroundParticles() {
        const { width, height } = this.scale;
        this.bgParticles = [];
        for (let i = 0; i < 40; i++) {
            const particle = this.add.circle(
                Phaser.Math.Between(0, width), Phaser.Math.Between(0, height),
                Phaser.Math.Between(1, 3), 0x6366f1, Phaser.Math.FloatBetween(0.1, 0.4)
            );
            particle.setData('speedX', Phaser.Math.FloatBetween(-0.3, 0.3));
            particle.setData('speedY', Phaser.Math.FloatBetween(-0.5, -0.1));
            particle.setData('pulse', Phaser.Math.FloatBetween(0, Math.PI * 2));
            this.bgParticles.push(particle);
        }
    }

    update(time, delta) {
        const { width, height } = this.scale;
        if (!this.bgParticles) return;
        for (const particle of this.bgParticles) {
            particle.x += particle.getData('speedX');
            particle.y += particle.getData('speedY');
            particle.setData('pulse', particle.getData('pulse') + 0.02);
            particle.setAlpha(0.15 + Math.sin(particle.getData('pulse')) * 0.15);
            if (particle.y < -10) particle.y = height + 10;
            if (particle.y > height + 10) particle.y = -10;
            if (particle.x < -10) particle.x = width + 10;
            if (particle.x > width + 10) particle.x = -10;
        }
    }

    generateCards() {
        const container = document.getElementById('char-cards');
        container.innerHTML = '';

        CHARACTER_ORDER.forEach((charId) => {
            const char = CHARACTER_DATA[charId];
            const card = document.createElement('div');
            card.className = 'char-card';
            card.dataset.charId = charId;
            card.style.setProperty('--card-color', char.glowColor);
            card.style.setProperty('--card-glow', char.glowColor + '33');

            card.innerHTML = `
                <span class="char-card-icon">${char.iconEmoji}</span>
                <span class="char-card-name">${char.name}</span>
                <span class="char-card-type">${char.type}</span>
                <span class="char-card-weapon">${char.weapon}</span>
            `;

            card.addEventListener('click', () => this.selectCharacter(charId));
            container.appendChild(card);
        });
    }

    selectCharacter(charId) {
        const char = CHARACTER_DATA[charId];
        this.selectedCharacter = charId;

        // Update card selection visual
        document.querySelectorAll('.char-card').forEach(card => {
            card.classList.toggle('selected', card.dataset.charId === charId);
        });

        // Show detail panel
        const detailPanel = document.getElementById('char-detail');
        detailPanel.style.display = 'block';

        document.getElementById('char-detail-name').textContent = char.name;
        document.getElementById('char-detail-type').textContent = char.type;
        document.getElementById('char-detail-desc').textContent = char.description;
        document.getElementById('char-preview').textContent = char.iconEmoji;

        // Set type badge color
        const badge = document.getElementById('char-detail-type');
        badge.style.background = char.glowColor + '22';
        badge.style.color = char.glowColor;
        badge.style.borderColor = char.glowColor + '44';

        // Generate stat bars
        const statsContainer = document.getElementById('char-detail-stats');
        const statLabels = {
            hp: 'HP',
            speed: 'Скорость',
            damage: 'Урон',
            range: 'Дальность',
            cooldown: 'Скорость атаки',
        };

        statsContainer.innerHTML = '';
        for (const [stat, label] of Object.entries(statLabels)) {
            const value = char.displayStats[stat];
            const percent = (value / 5) * 100;

            const statBar = document.createElement('div');
            statBar.className = 'stat-bar';
            statBar.innerHTML = `
                <span class="stat-label">${label}</span>
                <div class="stat-track">
                    <div class="stat-fill" style="width: ${percent}%; background: linear-gradient(90deg, ${char.glowColor}, ${char.glowColor}88);"></div>
                </div>
            `;
            statsContainer.appendChild(statBar);
        }

        // Enable battle button
        this.battleBtn.disabled = false;
    }

    startBattle() {
        if (!this.selectedCharacter) return;

        console.log(`[CharSelectScene] Selected: ${this.selectedCharacter}. Connecting...`);

        // Get player settings
        const settings = this.ui.getSettings();

        // Store selection for GameScene
        this.registry.set('selectedCharacter', this.selectedCharacter);
        this.registry.set('playerNickname', settings.nickname);
        this.registry.set('playerSettings', settings);

        // Show connecting overlay
        this.ui.showScreen('connecting');
        this.ui.updateConnectionStatus(
            'Подключение к серверу...',
            'Это может занять до 60 секунд при первом подключении'
        );

        // Transition to GameScene
        this.scene.start('GameScene');
    }

    cleanup() {
        // Cleanup event listeners and DOM
        if (this.battleBtn && this.battleHandler) {
            this.battleBtn.removeEventListener('click', this.battleHandler);
        }
        const container = document.getElementById('char-cards');
        if (container) container.innerHTML = '';
        
        const detailPanel = document.getElementById('char-detail');
        if (detailPanel) detailPanel.style.display = 'none';
        
        if (this.battleBtn) this.battleBtn.disabled = true;
    }
}
