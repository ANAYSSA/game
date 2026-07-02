/**
 * ARENA CLASH — Boot Scene
 * 
 * Handles asset preloading and generates procedural sprites.
 * Shows a loading bar, then transitions to MenuScene.
 */

export class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        // We generate all sprites procedurally — no external assets to load.
        // This avoids CORS issues and keeps the game lightweight.
        // Show a loading bar for the generation process.
        this.load.image('photo_gopnik', 'assets/Gopnik.jpg');
        this.load.image('photo_armor', 'assets/Armor.jpg');
        this.load.image('photo_godzilla', 'assets/Godzilla.jpg');
    }

    create() {
        console.log('[BootScene] Generating game assets...');

        // ── Generate character sprites ────────────────────────
        this.generateCharacterSprites();

        // ── Generate map tiles ────────────────────────────────
        this.generateMapTiles();

        // ── Generate particle textures ────────────────────────
        this.generateParticleTextures();

        // ── Generate projectile textures ──────────────────────
        this.generateProjectileTextures();

        // ── Generate UI textures ──────────────────────────────
        this.generateUITextures();

        console.log('[BootScene] All assets generated. Starting menu.');
        this.scene.start('MenuScene');
    }

    // ═══════════════════════════════════════════════════════════
    //  CHARACTER SPRITE GENERATION
    // ═══════════════════════════════════════════════════════════

    generateCharacterSprites() {
        const characters = {
            gopnik: {
                bodyColor: 0xe74c3c,
                outlineColor: 0xc0392b,
                accentColor: 0xbdc3c7,
                size: 36,
                weaponType: 'knife',
            },
            armor: {
                bodyColor: 0x111111, // Black cat
                outlineColor: 0x000000,
                accentColor: 0x555555,
                size: 44,
                weaponType: 'cannon',
                isCat: true, // Flag for drawing ears
            },
            godzilla: {
                bodyColor: 0x2ecc71,
                outlineColor: 0x27ae60,
                accentColor: 0xe67e22,
                size: 52,
                weaponType: 'fire',
            },
            samurai: {
                bodyColor: 0x2980b9,
                outlineColor: 0x1f618d,
                accentColor: 0xecf0f1,
                size: 38,
                weaponType: 'katana',
                isSamurai: true,
            },
        };

        const directions = ['down', 'up', 'left', 'right'];
        const states = ['idle', 'walk1', 'walk2', 'walk3', 'walk4', 'attack1', 'attack2', 'attack3', 'hurt', 'death1', 'death2', 'death3'];

        for (const [charId, config] of Object.entries(characters)) {
            for (const dir of directions) {
                for (const state of states) {
                    const key = `${charId}_${dir}_${state}`;
                    this.generateCharFrame(key, config, dir, state);
                }
            }
        }
    }

    generateCharFrame(key, config, direction, state) {
        const size = config.size + 12; // padding
        const cx = size / 2;
        const cy = size / 2;
        const r = config.size / 2;

        const graphics = this.add.graphics();

        // State-based modifications
        let alpha = 1.0;
        let scale = 1.0;
        let offsetX = 0;
        let offsetY = 0;
        let bodyColor = config.bodyColor;

        if (state === 'hurt') {
            bodyColor = 0xff0000;
            alpha = 0.8;
        } else if (state.startsWith('death')) {
            const deathFrame = parseInt(state.replace('death', ''));
            alpha = 1.0 - (deathFrame - 1) * 0.3;
            scale = 1.0 - (deathFrame - 1) * 0.1;
        } else if (state.startsWith('walk')) {
            const walkFrame = parseInt(state.replace('walk', ''));
            offsetY = Math.sin(walkFrame * Math.PI / 2) * 2;
        }

        graphics.setAlpha(alpha);

        // ── Body (main circle) ────────────────────────────────
        // Shadow
        graphics.fillStyle(0x000000, 0.3);
        graphics.fillEllipse(cx, cy + r * 0.8, r * 1.6, r * 0.5);

        // Body outline
        graphics.fillStyle(config.outlineColor, 1);
        graphics.fillCircle(cx + offsetX, cy + offsetY - 2, r + 2);

        // Body fill
        graphics.fillStyle(bodyColor, 1);
        graphics.fillCircle(cx + offsetX, cy + offsetY - 2, r);

        // Body highlight
        graphics.fillStyle(0xffffff, 0.2);
        graphics.fillCircle(cx + offsetX - r * 0.2, cy + offsetY - r * 0.4 - 2, r * 0.4);

        // Cat ears for Armor
        if (config.isCat) {
            graphics.fillStyle(config.bodyColor, 1);
            graphics.lineStyle(2, config.outlineColor, 1);
            switch(direction) {
                case 'down':
                case 'up':
                    // Left ear
                    graphics.beginPath();
                    graphics.moveTo(cx + offsetX - r * 0.8, cy + offsetY - r * 0.2);
                    graphics.lineTo(cx + offsetX - r * 0.5, cy + offsetY - r * 0.9);
                    graphics.lineTo(cx + offsetX - r * 0.1, cy + offsetY - r * 0.7);
                    graphics.fillPath();
                    graphics.strokePath();
                    // Right ear
                    graphics.beginPath();
                    graphics.moveTo(cx + offsetX + r * 0.8, cy + offsetY - r * 0.2);
                    graphics.lineTo(cx + offsetX + r * 0.5, cy + offsetY - r * 0.9);
                    graphics.lineTo(cx + offsetX + r * 0.1, cy + offsetY - r * 0.7);
                    graphics.fillPath();
                    graphics.strokePath();
                    break;
                case 'left':
                    // Right ear (back)
                    graphics.beginPath();
                    graphics.moveTo(cx + offsetX + r * 0.1, cy + offsetY - r * 0.5);
                    graphics.lineTo(cx + offsetX + r * 0.4, cy + offsetY - r * 1.0);
                    graphics.lineTo(cx + offsetX + r * 0.7, cy + offsetY - r * 0.2);
                    graphics.fillPath();
                    graphics.strokePath();
                    // Left ear (front)
                    graphics.beginPath();
                    graphics.moveTo(cx + offsetX - r * 0.3, cy + offsetY - r * 0.5);
                    graphics.lineTo(cx + offsetX - r * 0.2, cy + offsetY - r * 1.0);
                    graphics.lineTo(cx + offsetX + r * 0.2, cy + offsetY - r * 0.5);
                    graphics.fillPath();
                    graphics.strokePath();
                    break;
                case 'right':
                    // Left ear (back)
                    graphics.beginPath();
                    graphics.moveTo(cx + offsetX - r * 0.1, cy + offsetY - r * 0.5);
                    graphics.lineTo(cx + offsetX - r * 0.4, cy + offsetY - r * 1.0);
                    graphics.lineTo(cx + offsetX - r * 0.7, cy + offsetY - r * 0.2);
                    graphics.fillPath();
                    graphics.strokePath();
                    // Right ear (front)
                    graphics.beginPath();
                    graphics.moveTo(cx + offsetX + r * 0.3, cy + offsetY - r * 0.5);
                    graphics.lineTo(cx + offsetX + r * 0.2, cy + offsetY - r * 1.0);
                    graphics.lineTo(cx + offsetX - r * 0.2, cy + offsetY - r * 0.5);
                    graphics.fillPath();
                    graphics.strokePath();
                    break;
            }
        }

        // Samurai hat (kasa)
        if (config.isSamurai) {
            graphics.fillStyle(0x34495e, 1);
            graphics.lineStyle(2, 0x2c3e50, 1);
            graphics.fillEllipse(cx + offsetX, cy + offsetY - r * 0.5, r * 3.2, r * 1.6);
            graphics.strokeEllipse(cx + offsetX, cy + offsetY - r * 0.5, r * 3.2, r * 1.6);
            // Hat center
            graphics.fillStyle(0x2c3e50, 1);
            graphics.fillCircle(cx + offsetX, cy + offsetY - r * 0.7, r * 0.5);
        }

        // ── Direction indicator (eyes/facing) ──────────────────
        const eyeR = r * 0.15;
        let eyeX1, eyeY1, eyeX2, eyeY2;

        switch (direction) {
            case 'down':
                eyeX1 = cx - r * 0.25;
                eyeY1 = cy + offsetY - 4;
                eyeX2 = cx + r * 0.25;
                eyeY2 = cy + offsetY - 4;
                break;
            case 'up':
                eyeX1 = cx - r * 0.25;
                eyeY1 = cy + offsetY - 6;
                eyeX2 = cx + r * 0.25;
                eyeY2 = cy + offsetY - 6;
                break;
            case 'left':
                eyeX1 = cx - r * 0.35;
                eyeY1 = cy + offsetY - 5;
                eyeX2 = cx - r * 0.05;
                eyeY2 = cy + offsetY - 5;
                break;
            case 'right':
                eyeX1 = cx + r * 0.05;
                eyeY1 = cy + offsetY - 5;
                eyeX2 = cx + r * 0.35;
                eyeY2 = cy + offsetY - 5;
                break;
        }

        // Eyes
        let eyeColor = 0xffffff;
        if (config.isCat) eyeColor = 0xffff00; // Yellow cat eyes
        
        graphics.fillStyle(eyeColor, 0.9);
        if (config.isCat) {
            // Slit eyes
            graphics.fillEllipse(eyeX1, eyeY1, eyeR, eyeR * 1.5);
            graphics.fillEllipse(eyeX2, eyeY2, eyeR, eyeR * 1.5);
            graphics.fillStyle(0x000000, 1);
            graphics.fillEllipse(eyeX1, eyeY1, eyeR * 0.2, eyeR * 1.2);
            graphics.fillEllipse(eyeX2, eyeY2, eyeR * 0.2, eyeR * 1.2);
        } else {
            graphics.fillCircle(eyeX1, eyeY1, eyeR);
            graphics.fillCircle(eyeX2, eyeY2, eyeR);
            graphics.fillStyle(0x000000, 1);
            graphics.fillCircle(eyeX1, eyeY1, eyeR * 0.5);
            graphics.fillCircle(eyeX2, eyeY2, eyeR * 0.5);
        }

        // ── Weapon ────────────────────────────────────────────
        if (state.startsWith('attack')) {
            this.drawWeaponAttack(graphics, config, cx + offsetX, cy + offsetY - 2, r, direction, state);
        } else {
            this.drawWeaponIdle(graphics, config, cx + offsetX, cy + offsetY - 2, r, direction);
        }

        // Generate texture from graphics
        graphics.generateTexture(key, size, size);
        graphics.destroy();
    }

    drawWeaponIdle(graphics, config, cx, cy, r, direction) {
        switch (config.weaponType) {
            case 'katana': {
                // Long blade
                graphics.fillStyle(config.accentColor, 1);
                const bladeLen = r * 1.5;
                switch (direction) {
                    case 'right':
                        graphics.fillRect(cx + r * 0.6, cy - 2, bladeLen, 3);
                        break;
                    case 'left':
                        graphics.fillRect(cx - r * 0.6 - bladeLen, cy - 2, bladeLen, 3);
                        break;
                    case 'down':
                        graphics.fillRect(cx + r * 0.6, cy + 2, bladeLen * 0.6, 3);
                        break;
                    case 'up':
                        graphics.fillRect(cx - r * 0.6 - bladeLen * 0.6, cy - 4, bladeLen * 0.6, 3);
                        break;
                }
                break;
            }
            case 'knife': {
                // Small knife at the side
                graphics.fillStyle(config.accentColor, 1);
                const knifeLen = r * 0.6;
                switch (direction) {
                    case 'right':
                        graphics.fillRect(cx + r * 0.7, cy - 2, knifeLen, 3);
                        break;
                    case 'left':
                        graphics.fillRect(cx - r * 0.7 - knifeLen, cy - 2, knifeLen, 3);
                        break;
                    case 'down':
                        graphics.fillRect(cx + r * 0.6, cy + 2, knifeLen * 0.6, 3);
                        break;
                    case 'up':
                        graphics.fillRect(cx - r * 0.6 - knifeLen * 0.6, cy - 4, knifeLen * 0.6, 3);
                        break;
                }
                break;
            }
            case 'cannon': {
                // Cannon barrel
                graphics.fillStyle(config.accentColor, 1);
                const barrelLen = r * 1.0;
                switch (direction) {
                    case 'right':
                        graphics.fillRect(cx + r * 0.4, cy - 3, barrelLen, 6);
                        graphics.fillRect(cx + r * 0.4 + barrelLen - 4, cy - 5, 8, 10);
                        break;
                    case 'left':
                        graphics.fillRect(cx - r * 0.4 - barrelLen, cy - 3, barrelLen, 6);
                        graphics.fillRect(cx - r * 0.4 - barrelLen - 4, cy - 5, 8, 10);
                        break;
                    case 'down':
                        graphics.fillRect(cx - 3, cy + r * 0.4, 6, barrelLen);
                        break;
                    case 'up':
                        graphics.fillRect(cx - 3, cy - r * 0.4 - barrelLen, 6, barrelLen);
                        break;
                }
                break;
            }
            case 'fire': {
                // Small flame wisps around the character
                graphics.fillStyle(config.accentColor, 0.5);
                graphics.fillCircle(cx + r * 0.6, cy - r * 0.3, 4);
                graphics.fillCircle(cx - r * 0.5, cy - r * 0.4, 3);
                graphics.fillStyle(0xff4500, 0.3);
                graphics.fillCircle(cx + r * 0.4, cy - r * 0.6, 3);
                break;
            }
        }
    }

    drawWeaponAttack(graphics, config, cx, cy, r, direction, state) {
        const frame = parseInt(state.replace('attack', ''));

        switch (config.weaponType) {
            case 'katana': {
                // Katana slash arc (wider and further)
                graphics.fillStyle(0xffffff, 0.7);
                const ext = r * 1.2 + frame * 8;
                switch (direction) {
                    case 'right':
                        graphics.fillStyle(config.accentColor, 1);
                        graphics.fillRect(cx + r * 0.3, cy - 2 - frame * 3, ext, 4);
                        graphics.fillStyle(0x3498db, 0.5 - frame * 0.1); // Blue flash
                        graphics.fillCircle(cx + r * 0.3 + ext, cy - frame * 3, 10 + frame * 3);
                        break;
                    case 'left':
                        graphics.fillStyle(config.accentColor, 1);
                        graphics.fillRect(cx - r * 0.3 - ext, cy - 2 - frame * 3, ext, 4);
                        graphics.fillStyle(0x3498db, 0.5 - frame * 0.1);
                        graphics.fillCircle(cx - r * 0.3 - ext, cy - frame * 3, 10 + frame * 3);
                        break;
                    case 'down':
                        graphics.fillStyle(config.accentColor, 1);
                        graphics.fillRect(cx + r * 0.3 + frame * 2, cy + r * 0.3, 4, ext);
                        graphics.fillStyle(0x3498db, 0.5 - frame * 0.1);
                        graphics.fillCircle(cx + r * 0.3 + frame * 2, cy + r * 0.3 + ext, 10 + frame * 3);
                        break;
                    case 'up':
                        graphics.fillStyle(config.accentColor, 1);
                        graphics.fillRect(cx - r * 0.3 - frame * 2, cy - r * 0.3 - ext, 4, ext);
                        graphics.fillStyle(0x3498db, 0.5 - frame * 0.1);
                        graphics.fillCircle(cx - r * 0.3 - frame * 2, cy - r * 0.3 - ext, 10 + frame * 3);
                        break;
                }
                break;
            }
            case 'knife': {
                // Knife slash arc
                graphics.fillStyle(0xffffff, 0.6);
                const ext = r * 0.8 + frame * 6;
                switch (direction) {
                    case 'right':
                        graphics.fillStyle(config.accentColor, 1);
                        graphics.fillRect(cx + r * 0.3, cy - 2 - frame * 3, ext, 4);
                        // Slash effect
                        graphics.fillStyle(0xffffff, 0.4 - frame * 0.1);
                        graphics.fillCircle(cx + r * 0.3 + ext, cy - frame * 3, 6 + frame * 2);
                        break;
                    case 'left':
                        graphics.fillStyle(config.accentColor, 1);
                        graphics.fillRect(cx - r * 0.3 - ext, cy - 2 - frame * 3, ext, 4);
                        graphics.fillStyle(0xffffff, 0.4 - frame * 0.1);
                        graphics.fillCircle(cx - r * 0.3 - ext, cy - frame * 3, 6 + frame * 2);
                        break;
                    case 'down':
                        graphics.fillStyle(config.accentColor, 1);
                        graphics.fillRect(cx - 2 + frame * 3, cy + r * 0.3, 4, ext);
                        break;
                    case 'up':
                        graphics.fillStyle(config.accentColor, 1);
                        graphics.fillRect(cx - 2 - frame * 3, cy - r * 0.3 - ext, 4, ext);
                        break;
                }
                break;
            }
            case 'cannon': {
                const barrelLen = r * 1.0;
                graphics.fillStyle(config.accentColor, 1);
                // Barrel
                switch (direction) {
                    case 'right':
                        graphics.fillRect(cx + r * 0.4, cy - 3, barrelLen, 6);
                        // Muzzle flash
                        if (frame <= 2) {
                            graphics.fillStyle(0xffff00, 0.8 - frame * 0.2);
                            graphics.fillCircle(cx + r * 0.4 + barrelLen + 5, cy, 8 + frame * 4);
                            graphics.fillStyle(0xffffff, 0.6 - frame * 0.2);
                            graphics.fillCircle(cx + r * 0.4 + barrelLen + 5, cy, 4 + frame * 2);
                        }
                        break;
                    case 'left':
                        graphics.fillRect(cx - r * 0.4 - barrelLen, cy - 3, barrelLen, 6);
                        if (frame <= 2) {
                            graphics.fillStyle(0xffff00, 0.8 - frame * 0.2);
                            graphics.fillCircle(cx - r * 0.4 - barrelLen - 5, cy, 8 + frame * 4);
                        }
                        break;
                    case 'down':
                        graphics.fillRect(cx - 3, cy + r * 0.4, 6, barrelLen);
                        if (frame <= 2) {
                            graphics.fillStyle(0xffff00, 0.8 - frame * 0.2);
                            graphics.fillCircle(cx, cy + r * 0.4 + barrelLen + 5, 8 + frame * 4);
                        }
                        break;
                    case 'up':
                        graphics.fillRect(cx - 3, cy - r * 0.4 - barrelLen, 6, barrelLen);
                        if (frame <= 2) {
                            graphics.fillStyle(0xffff00, 0.8 - frame * 0.2);
                            graphics.fillCircle(cx, cy - r * 0.4 - barrelLen - 5, 8 + frame * 4);
                        }
                        break;
                }
                break;
            }
            case 'fire': {
                // Fire breath cone
                const fireLen = r * 1.2 + frame * 20;
                const fireWidth = frame * 12;
                graphics.fillStyle(0xff4500, 0.6);

                switch (direction) {
                    case 'right':
                        this.drawFireCone(graphics, cx + r * 0.5, cy, fireLen, fireWidth, 0);
                        break;
                    case 'left':
                        this.drawFireCone(graphics, cx - r * 0.5, cy, fireLen, fireWidth, Math.PI);
                        break;
                    case 'down':
                        this.drawFireCone(graphics, cx, cy + r * 0.5, fireLen, fireWidth, Math.PI / 2);
                        break;
                    case 'up':
                        this.drawFireCone(graphics, cx, cy - r * 0.5, fireLen, fireWidth, -Math.PI / 2);
                        break;
                }
                break;
            }
        }
    }

    drawFireCone(graphics, x, y, length, width, angle) {
        // Draw a series of circles forming a cone shape
        const steps = 5;
        for (let i = 0; i < steps; i++) {
            const t = (i + 1) / steps;
            const px = x + Math.cos(angle) * length * t;
            const py = y + Math.sin(angle) * length * t;
            const size = width * t * 0.5 + 3;

            graphics.fillStyle(0xff6600, 0.7 - t * 0.3);
            graphics.fillCircle(px, py, size);
            graphics.fillStyle(0xffaa00, 0.5 - t * 0.3);
            graphics.fillCircle(px + Math.random() * 4 - 2, py + Math.random() * 4 - 2, size * 0.6);
        }
        // Core
        graphics.fillStyle(0xffcc00, 0.8);
        graphics.fillCircle(x + Math.cos(angle) * 8, y + Math.sin(angle) * 8, 5);
    }

    // ═══════════════════════════════════════════════════════════
    //  MAP TILE GENERATION
    // ═══════════════════════════════════════════════════════════

    generateMapTiles() {
        const tileSize = 64;

        // Floor tile
        this.generateTile('tile_floor', tileSize, (g, s) => {
            g.fillStyle(0x2a2a3e, 1);
            g.fillRect(0, 0, s, s);
            // Subtle grid lines
            g.lineStyle(1, 0x3a3a5e, 0.3);
            g.strokeRect(0, 0, s, s);
            // Variation specks
            g.fillStyle(0x333350, 0.5);
            g.fillRect(12, 8, 3, 3);
            g.fillRect(40, 45, 2, 2);
            g.fillRect(50, 15, 4, 2);
        });

        // Floor tile variant
        this.generateTile('tile_floor2', tileSize, (g, s) => {
            g.fillStyle(0x282840, 1);
            g.fillRect(0, 0, s, s);
            g.lineStyle(1, 0x383858, 0.3);
            g.strokeRect(0, 0, s, s);
            // Crack
            g.lineStyle(1, 0x1e1e30, 0.5);
            g.lineBetween(10, 30, 35, 15);
            g.lineBetween(35, 15, 50, 40);
        });

        // Wall tile (Pseudo-3D)
        this.generateTile('tile_wall', tileSize, (g, s) => {
            const h = 24; // Wall height
            
            // Drop shadow
            g.fillStyle(0x000000, 0.4);
            g.fillRect(10, 10, s, s);
            
            // Front face
            g.fillStyle(0x3a3a5a, 1);
            g.fillRect(0, h, s, s - h);
            g.lineStyle(1, 0x2a2a4a, 1);
            g.strokeRect(0, h, s, s - h);
            
            // Brick pattern on front
            g.lineStyle(1, 0x2a2a4a, 0.5);
            g.lineBetween(0, h + (s-h)/2, s, h + (s-h)/2);
            g.lineBetween(s/2, h, s/2, h + (s-h)/2);
            g.lineBetween(s/4, h + (s-h)/2, s/4, s);
            g.lineBetween(s*3/4, h + (s-h)/2, s*3/4, s);
            
            // Top face
            g.fillStyle(0x5a5a7a, 1);
            g.fillRect(0, 0, s, h);
            g.lineStyle(1, 0x6a6a8a, 1);
            g.strokeRect(0, 0, s, h);
            
            // Highlight on top edge
            g.fillStyle(0xffffff, 0.1);
            g.fillRect(0, 0, s, 2);
        });

        // Obstacle: crate (Pseudo-3D)
        this.generateTile('obj_crate', tileSize, (g, s) => {
            const m = 8;
            const h = 16;
            
            // Shadow
            g.fillStyle(0x000000, 0.4);
            g.fillRect(m + 10, m + 10, s - m * 2, s - m * 2);
            
            // Front face
            g.fillStyle(0x6B4914, 1);
            g.fillRect(m, m + h, s - m * 2, s - m * 2 - h);
            g.lineStyle(2, 0x4B2904, 1);
            g.strokeRect(m, m + h, s - m * 2, s - m * 2 - h);
            
            // Top face
            g.fillStyle(0x8B6914, 1);
            g.fillRect(m, m, s - m * 2, h);
            g.lineStyle(2, 0x6B4914, 1);
            g.strokeRect(m, m, s - m * 2, h);
            
            // Cross bands on top
            g.lineStyle(2, 0x6B4914, 0.8);
            g.lineBetween(m, m, s - m, m + h);
            g.lineBetween(s - m, m, m, m + h);
        });

        // Obstacle: rock
        this.generateTile('obj_rock', tileSize, (g, s) => {
            g.fillStyle(0x555577, 1);
            g.fillCircle(s / 2, s / 2, s * 0.38);
            g.fillStyle(0x666688, 1);
            g.fillCircle(s / 2 - 3, s / 2 - 5, s * 0.32);
            g.fillStyle(0xffffff, 0.1);
            g.fillCircle(s / 2 - 5, s / 2 - 8, s * 0.15);
        });

        // Obstacle: pillar
        this.generateTile('obj_pillar', tileSize, (g, s) => {
            // Shadow
            g.fillStyle(0x000000, 0.3);
            g.fillEllipse(s / 2 + 2, s / 2 + 8, s * 0.5, s * 0.25);
            // Pillar body
            g.fillStyle(0x6a6a8a, 1);
            g.fillRect(s / 2 - 10, s * 0.15, 20, s * 0.7);
            // Top cap
            g.fillStyle(0x7a7a9a, 1);
            g.fillRect(s / 2 - 13, s * 0.12, 26, 8);
            // Bottom base
            g.fillStyle(0x5a5a7a, 1);
            g.fillRect(s / 2 - 14, s * 0.8, 28, 8);
            // Highlight
            g.fillStyle(0xffffff, 0.1);
            g.fillRect(s / 2 - 8, s * 0.15, 4, s * 0.7);
        });

        // Tree
        this.generateTile('obj_tree', tileSize, (g, s) => {
            // Shadow
            g.fillStyle(0x000000, 0.2);
            g.fillEllipse(s / 2 + 3, s * 0.85, s * 0.6, s * 0.2);
            // Trunk
            g.fillStyle(0x5a3a1a, 1);
            g.fillRect(s / 2 - 4, s * 0.5, 8, s * 0.35);
            // Canopy
            g.fillStyle(0x1a6a2a, 1);
            g.fillCircle(s / 2, s * 0.35, s * 0.32);
            g.fillStyle(0x2a8a3a, 0.8);
            g.fillCircle(s / 2 - 5, s * 0.3, s * 0.2);
            g.fillStyle(0x1a5a2a, 0.9);
            g.fillCircle(s / 2 + 6, s * 0.38, s * 0.18);
        });

        // Decoration: floor glow mark
        this.generateTile('deco_glow', tileSize, (g, s) => {
            g.fillStyle(0x6366f1, 0.1);
            g.fillCircle(s / 2, s / 2, s * 0.4);
            g.fillStyle(0x6366f1, 0.05);
            g.fillCircle(s / 2, s / 2, s * 0.25);
        });
    }

    generateTile(key, size, drawFn) {
        const graphics = this.add.graphics();
        drawFn(graphics, size);
        graphics.generateTexture(key, size, size);
        graphics.destroy();
    }

    // ═══════════════════════════════════════════════════════════
    //  PARTICLE TEXTURES
    // ═══════════════════════════════════════════════════════════

    generateParticleTextures() {
        // Generic white circle particle
        this.generateParticle('particle_circle', 8, (g) => {
            g.fillStyle(0xffffff, 1);
            g.fillCircle(4, 4, 4);
        });

        // Soft glow particle
        this.generateParticle('particle_glow', 16, (g) => {
            g.fillStyle(0xffffff, 0.6);
            g.fillCircle(8, 8, 8);
            g.fillStyle(0xffffff, 0.3);
            g.fillCircle(8, 8, 5);
            g.fillStyle(0xffffff, 0.8);
            g.fillCircle(8, 8, 2);
        });

        // Fire particle
        this.generateParticle('particle_fire', 12, (g) => {
            g.fillStyle(0xff6600, 0.8);
            g.fillCircle(6, 6, 6);
            g.fillStyle(0xffaa00, 0.6);
            g.fillCircle(6, 5, 4);
            g.fillStyle(0xffcc00, 0.9);
            g.fillCircle(6, 4, 2);
        });

        // Spark particle
        this.generateParticle('particle_spark', 6, (g) => {
            g.fillStyle(0xffff88, 1);
            g.fillRect(2, 0, 2, 6);
            g.fillRect(0, 2, 6, 2);
        });

        // Smoke particle
        this.generateParticle('particle_smoke', 16, (g) => {
            g.fillStyle(0x888888, 0.4);
            g.fillCircle(8, 8, 8);
            g.fillStyle(0x999999, 0.2);
            g.fillCircle(8, 8, 5);
        });

        // Damage number placeholder (small rectangle)
        this.generateParticle('particle_slash', 20, (g) => {
            g.fillStyle(0xffffff, 0.7);
            // Arc-like slash
            g.lineStyle(3, 0xffffff, 0.8);
            g.beginPath();
            g.arc(10, 15, 12, -Math.PI * 0.8, -Math.PI * 0.2, false);
            g.strokePath();
        });
    }

    generateParticle(key, size, drawFn) {
        const graphics = this.add.graphics();
        drawFn(graphics);
        graphics.generateTexture(key, size, size);
        graphics.destroy();
    }

    // ═══════════════════════════════════════════════════════════
    //  PROJECTILE TEXTURES
    // ═══════════════════════════════════════════════════════════

    generateProjectileTextures() {
        // Armor cannon projectile
        const g1 = this.add.graphics();
        g1.fillStyle(0x00ccff, 1);
        g1.fillCircle(8, 8, 8);
        g1.fillStyle(0x88eeff, 1);
        g1.fillCircle(7, 6, 4);
        g1.fillStyle(0xffffff, 0.8);
        g1.fillCircle(6, 5, 2);
        g1.generateTexture('projectile_cannon', 16, 16);
        g1.destroy();

        // Trail segment
        const g2 = this.add.graphics();
        g2.fillStyle(0x00aaff, 0.5);
        g2.fillCircle(4, 4, 4);
        g2.generateTexture('projectile_trail', 8, 8);
        g2.destroy();
    }

    // ═══════════════════════════════════════════════════════════
    //  UI TEXTURES
    // ═══════════════════════════════════════════════════════════

    generateUITextures() {
        // Spawn effect ring
        const g1 = this.add.graphics();
        g1.lineStyle(3, 0x6366f1, 0.8);
        g1.strokeCircle(32, 32, 28);
        g1.lineStyle(1, 0xa78bfa, 0.4);
        g1.strokeCircle(32, 32, 24);
        g1.generateTexture('fx_spawn_ring', 64, 64);
        g1.destroy();

        // Death X mark
        const g2 = this.add.graphics();
        g2.lineStyle(4, 0xff4444, 0.8);
        g2.lineBetween(5, 5, 27, 27);
        g2.lineBetween(27, 5, 5, 27);
        g2.generateTexture('fx_death_mark', 32, 32);
        g2.destroy();
    }
}
