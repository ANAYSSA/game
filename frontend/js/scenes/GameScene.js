/**
 * ARENA CLASH — Game Scene
 * 
 * The main gameplay scene. Handles:
 * - Map rendering
 * - Network connection
 * - Local player with prediction
 * - Remote players with interpolation
 * - Projectiles
 * - Camera following
 * - Input processing
 */

import { GAME_CONFIG } from '../config/gameConfig.js';
import { CHARACTER_DATA } from '../config/characters.js';
import { NetworkManager } from '../network/NetworkManager.js';
import { ClientPrediction } from '../network/Prediction.js';
import { InterpolationBuffer } from '../network/Interpolation.js';
import { InputManager } from '../systems/InputManager.js';
import { ParticleManager } from '../systems/ParticleManager.js';
import { Player } from '../entities/Player.js';
import { RemotePlayer } from '../entities/RemotePlayer.js';
import { Projectile } from '../entities/Projectile.js';
import { AudioManager } from '../audio/AudioManager.js';

export class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        console.log('[GameScene] Starting...');

        this.ui = this.registry.get('ui');
        this.selectedCharacter = this.registry.get('selectedCharacter');
        this.playerNickname = this.registry.get('playerNickname');

        // Systems
        this.networkManager = new NetworkManager();
        this.prediction = new ClientPrediction();
        this.interpolation = new InterpolationBuffer();
        this.particleManager = new ParticleManager(this);
        this.audioManager = new AudioManager();
        this.inputManager = null; // Created after connection

        // Entities
        this.localPlayer = null;
        this.remotePlayers = new Map();
        this.projectiles = new Map();

        // State
        this.playerId = null;
        this.playerData = null;
        this.mapData = null;
        this.connected = false;

        // Input timing
        this.inputTimer = 0;
        this.inputInterval = GAME_CONFIG.INPUT_SEND_RATE_MS / 1000;

        // FPS tracking
        this.fpsCounter = 0;
        this.fpsTimer = 0;
        this.currentFps = 60;

        // Connect to server
        this.connectToServer();
    }

    // ═══════════════════════════════════════════════════════════
    //  CONNECTION
    // ═══════════════════════════════════════════════════════════

    async connectToServer() {
        try {
            // Show connecting screen
            this.ui.showScreen('connecting');

            // Set up network event handlers before connecting
            this.setupNetworkEvents();

            // Connect and join
            this.playerData = await this.networkManager.connect(
                this.playerNickname,
                this.selectedCharacter
            );

            this.playerId = this.playerData.id;
            this.mapData = {
                width: this.playerData.mapWidth,
                height: this.playerData.mapHeight,
                tileSize: this.playerData.tileSize,
                obstacles: this.playerData.obstacles,
                walls: this.playerData.walls,
            };

            console.log('[GameScene] Connected! Player ID:', this.playerId);

            // Build the world
            this.buildMap();
            this.createLocalPlayer();
            this.setupCamera();

            // Create input manager
            this.inputManager = new InputManager(this);

            // Show game HUD
            this.ui.hideAllOverlays();
            this.ui.showScreen('game');

            // Update HUD with character info
            this.updateHUDInfo();

            this.connected = true;

            // Launch HUD scene
            if (!this.scene.isActive('HUDScene')) {
                this.scene.launch('HUDScene');
            }

        } catch (error) {
            console.error('[GameScene] Connection failed:', error);
            this.ui.updateConnectionStatus(
                'Ошибка подключения',
                error.message + '. Попробуйте позже.'
            );
        }
    }

    setupNetworkEvents() {
        // State updates from server
        this.networkManager.on('stateUpdate', (data) => {
            this.onStateUpdate(data);
        });

        // New player joined
        this.networkManager.on('playerJoined', (data) => {
            console.log(`[GameScene] Player joined: ${data.nick}`);
        });

        // Player left
        this.networkManager.on('playerLeft', (data) => {
            const remote = this.remotePlayers.get(data.id);
            if (remote) {
                remote.destroy();
                this.remotePlayers.delete(data.id);
            }
            console.log(`[GameScene] Player left: ${data.nickname}`);
        });

        // Player respawn
        this.networkManager.on('playerRespawn', (data) => {
            if (data.id === this.playerId && this.localPlayer) {
                this.localPlayer.alive = true;
                this.hideDeathScreen();
                this.particleManager.spawnRespawnEffect(data.x, data.y);
            }
        });

        // Disconnection
        this.networkManager.on('disconnected', () => {
            this.connected = false;
            this.ui.showScreen('connecting');
            this.ui.updateConnectionStatus(
                'Потеряно соединение',
                'Переподключение...'
            );
        });

        // Reconnection
        this.networkManager.on('reconnected', () => {
            this.connected = true;
            this.ui.hideAllOverlays();
            this.ui.showScreen('game');
        });

        this.networkManager.on('reconnectFailed', () => {
            this.ui.updateConnectionStatus(
                'Не удалось переподключиться',
                'Обновите страницу для повторной попытки'
            );
        });
    }

    // ═══════════════════════════════════════════════════════════
    //  MAP BUILDING
    // ═══════════════════════════════════════════════════════════

    buildMap() {
        const { width, height, tileSize, obstacles, walls } = this.mapData;
        const cols = Math.ceil(width / tileSize);
        const rows = Math.ceil(height / tileSize);

        // Build wall set for quick lookup
        const wallSet = new Set();
        for (const wall of walls) {
            wallSet.add(`${wall.x / tileSize},${wall.y / tileSize}`);
        }
        const obsSet = new Set();
        for (const obs of obstacles) {
            obsSet.add(`${obs.x / tileSize},${obs.y / tileSize}`);
        }

        // Floor tiles
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const key = `${x},${y}`;
                if (wallSet.has(key) || obsSet.has(key)) continue;

                const tileKey = ((x + y) % 3 === 0) ? 'tile_floor2' : 'tile_floor';
                this.add.image(x * tileSize + tileSize / 2, y * tileSize + tileSize / 2, tileKey)
                    .setDepth(0);
            }
        }

        // Wall tiles
        for (const wall of walls) {
            this.add.image(wall.x + tileSize / 2, wall.y + tileSize / 2, 'tile_wall')
                .setDepth(wall.y + tileSize / 2);
        }

        // Obstacles
        for (const obs of obstacles) {
            let key = 'obj_crate';
            if (obs.type === 'rock') key = 'obj_rock';
            else if (obs.type === 'pillar') key = 'obj_pillar';
            else if (obs.type === 'tree') key = 'obj_tree';

            this.add.image(obs.x + tileSize / 2, obs.y + tileSize / 2, key)
                .setDepth(obs.y + tileSize / 2);
        }

        // Decorative glow marks (random placement)
        for (let i = 0; i < 15; i++) {
            const gx = Phaser.Math.Between(2, cols - 3) * tileSize + tileSize / 2;
            const gy = Phaser.Math.Between(2, rows - 3) * tileSize + tileSize / 2;
            this.add.image(gx, gy, 'deco_glow').setDepth(0).setAlpha(0.3);
        }

        // Set world bounds
        this.physics.world.setBounds(0, 0, width, height);
    }

    // ═══════════════════════════════════════════════════════════
    //  PLAYER CREATION
    // ═══════════════════════════════════════════════════════════

    createLocalPlayer() {
        this.localPlayer = new Player(
            this,
            this.playerData.x,
            this.playerData.y,
            this.selectedCharacter,
            this.playerNickname
        );
        this.localPlayer.hp = this.playerData.hp;
        this.localPlayer.maxHp = this.playerData.maxHp;
    }

    setupCamera() {
        const camera = this.cameras.main;
        camera.setBounds(0, 0, this.mapData.width, this.mapData.height);
        camera.setZoom(GAME_CONFIG.CAMERA_ZOOM);

        // Camera will follow local player position (updated in update loop)
    }

    // ═══════════════════════════════════════════════════════════
    //  STATE UPDATE FROM SERVER
    // ═══════════════════════════════════════════════════════════

    onStateUpdate(data) {
        if (!this.localPlayer) return;

        // Push snapshot into interpolation buffer
        this.interpolation.push(data.timestamp, data);

        // Process player data
        const currentPlayerIds = new Set();

        for (const playerData of data.players) {
            currentPlayerIds.add(playerData.id);

            if (playerData.id === this.playerId) {
                // ── Local Player: Reconciliation ──────────
                const charData = CHARACTER_DATA[this.selectedCharacter];
                const speed = charData?.displayStats?.speed * 44 || 180; // Approximate

                const reconciled = this.prediction.reconcile(
                    playerData.x,
                    playerData.y,
                    data.lastInput,
                    speed
                );

                // Update local player state from server (HP, alive, etc.)
                this.localPlayer.hp = playerData.hp;
                this.localPlayer.maxHp = playerData.maxHp;
                this.localPlayer.alive = playerData.alive;

                if (playerData.alive) {
                    // Smooth correction toward reconciled position
                    const correctionX = reconciled.x - this.localPlayer.sprite.x;
                    const correctionY = reconciled.y - this.localPlayer.sprite.y;

                    // Only snap if correction is large (otherwise smooth)
                    if (Math.abs(correctionX) > 50 || Math.abs(correctionY) > 50) {
                        // Teleport (respawn or large desync)
                        this.localPlayer.sprite.setPosition(reconciled.x, reconciled.y);
                    }
                    // Small corrections are handled naturally by prediction
                }

                // Handle death
                if (!playerData.alive && this.localPlayer.alive !== false) {
                    this.onLocalPlayerDeath();
                }

            } else {
                // ── Remote Player: Interpolation ──────────
                let remote = this.remotePlayers.get(playerData.id);

                if (!remote) {
                    // New player — create entity
                    remote = new RemotePlayer(this, playerData);
                    this.remotePlayers.set(playerData.id, remote);
                }

                remote.updateFromServer(playerData);
            }
        }

        // Remove disconnected players
        for (const [id, remote] of this.remotePlayers) {
            if (!currentPlayerIds.has(id)) {
                remote.destroy();
                this.remotePlayers.delete(id);
            }
        }

        // Update projectiles
        const currentProjectileIds = new Set();
        if (data.projectiles) {
            for (const projData of data.projectiles) {
                currentProjectileIds.add(projData.id);

                let proj = this.projectiles.get(projData.id);
                if (!proj) {
                    proj = new Projectile(this, projData);
                    this.projectiles.set(projData.id, proj);
                }
                proj.updateFromServer(projData);
            }
        }

        // Remove dead projectiles
        for (const [id, proj] of this.projectiles) {
            if (!currentProjectileIds.has(id)) {
                proj.destroy();
                this.projectiles.delete(id);
            }
        }

        // Update HUD
        this.updateHUD(data);
    }

    onLocalPlayerDeath() {
        this.localPlayer.alive = false;
        this.particleManager.spawnDeathEffect(
            this.localPlayer.sprite.x,
            this.localPlayer.sprite.y,
            CHARACTER_DATA[this.selectedCharacter]?.color
        );
        this.showDeathScreen();
    }

    showDeathScreen() {
        const deathScreen = document.getElementById('death-screen');
        if (deathScreen) {
            deathScreen.style.display = 'flex';

            let countdown = 3;
            const timerEl = document.getElementById('death-timer');

            const interval = setInterval(() => {
                countdown--;
                if (timerEl) timerEl.textContent = `Возрождение через ${countdown}...`;
                if (countdown <= 0) {
                    clearInterval(interval);
                }
            }, 1000);
        }
    }

    hideDeathScreen() {
        const deathScreen = document.getElementById('death-screen');
        if (deathScreen) deathScreen.style.display = 'none';
    }

    // ═══════════════════════════════════════════════════════════
    //  GAME LOOP
    // ═══════════════════════════════════════════════════════════

    update(time, delta) {
        const dt = delta / 1000;

        if (!this.connected || !this.localPlayer || !this.inputManager) return;

        // FPS counter
        this.fpsCounter++;
        this.fpsTimer += dt;
        if (this.fpsTimer >= 1.0) {
            this.currentFps = this.fpsCounter;
            this.fpsCounter = 0;
            this.fpsTimer = 0;
        }

        // ── Process Input ─────────────────────────────────
        const playerX = this.localPlayer.sprite.x;
        const playerY = this.localPlayer.sprite.y;
        this.inputManager.update(playerX, playerY);

        const dx = this.inputManager.dx;
        const dy = this.inputManager.dy;
        const attackAngle = this.inputManager.attackAngle;
        const attack = this.inputManager.consumeAttack();

        // Trigger local visual attack immediately
        if (attack && this.localPlayer.alive) {
            this.spawnAttackEffect(playerX, playerY, attackAngle);
            
            // Force animation reset so it plays instantly
            this.localPlayer.attacking = true;
            this.localPlayer.attackFrame = 1;
            this.localPlayer.animTimer = 0;
            
            // Play sound
            if (this.audioManager) {
                this.audioManager.playAttack(this.selectedCharacter);
            }
        }
        
        // Accumulate attack state for network
        if (attack) {
            this.pendingNetworkAttack = true;
        }

        // ── Send Input to Server ──────────────────────────
        this.inputTimer += dt;
        if (this.inputTimer >= this.inputInterval) {
            this.inputTimer = 0;

            const sendAttack = this.pendingNetworkAttack || false;
            this.pendingNetworkAttack = false;

            if (dx !== 0 || dy !== 0 || sendAttack) {
                const input = this.networkManager.sendInput(dx, dy, sendAttack, attackAngle);

                if (input && this.localPlayer.alive) {
                    // Client prediction — apply locally
                    this.prediction.addInput(input, dt);

                    const charData = CHARACTER_DATA[this.selectedCharacter];
                    const speed = charData?.displayStats?.speed * 44 || 180;
                    const delta = this.prediction.applyInput(input, speed, this.inputInterval);

                    this.localPlayer.sprite.x += delta.dx;
                    this.localPlayer.sprite.y += delta.dy;

                    // Clamp to map bounds
                    this.localPlayer.sprite.x = Math.max(20, Math.min(this.mapData.width - 20, this.localPlayer.sprite.x));
                    this.localPlayer.sprite.y = Math.max(20, Math.min(this.mapData.height - 20, this.localPlayer.sprite.y));
                }
            }
        }

        // ── Update Local Player Visual ────────────────────
        const moving = dx !== 0 || dy !== 0;
        const direction = this.inputManager.getDirection() || this.localPlayer.direction;

        this.localPlayer.update(
            this.localPlayer.sprite.x,
            this.localPlayer.sprite.y,
            direction,
            moving,
            this.localPlayer.alive,
            this.localPlayer.hp,
            this.localPlayer.maxHp,
            attack,
            dt
        );

        // ── Update Remote Players ─────────────────────────
        for (const [id, remote] of this.remotePlayers) {
            remote.update(dt);
        }

        // ── Update Projectiles ────────────────────────────
        for (const [id, proj] of this.projectiles) {
            proj.update(dt);
        }

        // ── Update Particles ──────────────────────────────
        this.particleManager.update(dt);

        // ── Camera Follow ─────────────────────────────────
        if (this.localPlayer.alive) {
            const camera = this.cameras.main;
            const lerpFactor = GAME_CONFIG.CAMERA_LERP;
            camera.scrollX += (this.localPlayer.sprite.x - camera.scrollX - camera.width / 2) * lerpFactor;
            camera.scrollY += (this.localPlayer.sprite.y - camera.scrollY - camera.height / 2) * lerpFactor;
        }
    }

    spawnAttackEffect(x, y, angle) {
        const charType = CHARACTER_DATA[this.selectedCharacter]?.id;

        switch (charType) {
            case 'gopnik':
                this.particleManager.spawnSlashEffect(x, y, angle);
                break;
            case 'armor':
                this.particleManager.spawnMuzzleFlash(x, y, angle);
                break;
            case 'godzilla':
                this.particleManager.spawnFireBreath(x, y, angle, 200);
                break;
        }
    }

    // ═══════════════════════════════════════════════════════════
    //  HUD UPDATES
    // ═══════════════════════════════════════════════════════════

    updateHUDInfo() {
        const charData = CHARACTER_DATA[this.selectedCharacter];
        document.getElementById('hud-char-icon').textContent = charData?.iconEmoji || '⚔️';
        document.getElementById('hud-nickname').textContent = this.playerNickname;

        // Set attack icon for cooldown indicator
        const cooldownIcon = document.getElementById('cooldown-icon');
        if (cooldownIcon) {
            cooldownIcon.textContent = charData?.iconEmoji || '⚔️';
        }
    }

    updateHUD(data) {
        // HP
        if (this.localPlayer) {
            const hpFill = document.getElementById('hud-hp-fill');
            const hpText = document.getElementById('hud-hp-text');
            const hpPercent = Math.max(0, this.localPlayer.hp / this.localPlayer.maxHp);

            if (hpFill) {
                hpFill.style.width = (hpPercent * 100) + '%';
                hpFill.classList.remove('low', 'medium');
                if (hpPercent <= 0.3) hpFill.classList.add('low');
                else if (hpPercent <= 0.6) hpFill.classList.add('medium');
            }
            if (hpText) {
                hpText.textContent = `${Math.ceil(this.localPlayer.hp)} / ${this.localPlayer.maxHp}`;
            }
        }

        // FPS
        const fpsEl = document.getElementById('hud-fps');
        if (fpsEl) fpsEl.textContent = `${this.currentFps} FPS`;

        // Ping
        const pingEl = document.getElementById('hud-ping');
        if (pingEl) pingEl.textContent = `${this.networkManager.ping}ms`;

        // Players online
        const playersEl = document.getElementById('hud-players');
        if (playersEl) {
            const count = data.players ? data.players.length : 0;
            playersEl.textContent = `${count} онлайн`;
        }
    }

    // ═══════════════════════════════════════════════════════════
    //  CLEANUP
    // ═══════════════════════════════════════════════════════════

    shutdown() {
        this.networkManager?.disconnect();
        this.inputManager?.destroy();
        this.particleManager?.destroy();
        this.localPlayer?.destroy();

        for (const [id, remote] of this.remotePlayers) {
            remote.destroy();
        }
        this.remotePlayers.clear();

        for (const [id, proj] of this.projectiles) {
            proj.destroy();
        }
        this.projectiles.clear();
    }
}
