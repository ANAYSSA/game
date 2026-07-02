/**
 * ARENA CLASH — Particle Manager
 * 
 * Manages all visual effects: fire, sparks, trails, explosions,
 * death effects, spawn effects, hit effects.
 * Uses Phaser's particle emitter for performance.
 */

export class ParticleManager {
    constructor(scene) {
        this.scene = scene;

        // Simple particle pool using Phaser graphics
        this.particles = [];
        this.maxParticles = 200;
    }

    /**
     * Spawn hit sparks at the given position.
     */
    spawnHitEffect(x, y) {
        for (let i = 0; i < 6; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 60 + Math.random() * 80;
            this.addParticle(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 0.3,
                color: 0xffff88,
                size: 3 + Math.random() * 3,
                shrink: true,
            });
        }
    }

    /**
     * Spawn projectile trail particle.
     */
    spawnTrailParticle(x, y) {
        this.addParticle(x, y, {
            vx: (Math.random() - 0.5) * 20,
            vy: (Math.random() - 0.5) * 20,
            life: 0.2,
            color: 0x00aaff,
            size: 4,
            shrink: true,
            alpha: 0.6,
        });
    }

    /**
     * Spawn explosion effect (when projectile hits).
     */
    spawnExplosion(x, y) {
        for (let i = 0; i < 10; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 40 + Math.random() * 100;
            this.addParticle(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 0.4,
                color: Phaser.Math.Between(0, 1) ? 0x00ccff : 0xffff00,
                size: 4 + Math.random() * 4,
                shrink: true,
            });
        }
    }

    /**
     * Spawn fire breath effect (cone of fire particles).
     */
    spawnFireBreath(x, y, angle, range) {
        for (let i = 0; i < 12; i++) {
            const spreadAngle = angle + (Math.random() - 0.5) * (Math.PI / 3);
            const speed = 100 + Math.random() * 200;
            const dist = Math.random() * range;

            this.addParticle(
                x + Math.cos(angle) * 20,
                y + Math.sin(angle) * 20,
                {
                    vx: Math.cos(spreadAngle) * speed,
                    vy: Math.sin(spreadAngle) * speed,
                    life: 0.3 + Math.random() * 0.3,
                    color: [0xff4500, 0xff6600, 0xffaa00, 0xffcc00][Math.floor(Math.random() * 4)],
                    size: 5 + Math.random() * 8,
                    shrink: true,
                    alpha: 0.8,
                }
            );
        }
    }

    /**
     * Spawn knife slash effect.
     */
    spawnSlashEffect(x, y, angle) {
        for (let i = 0; i < 5; i++) {
            const spreadAngle = angle + (Math.random() - 0.5) * (Math.PI / 2);
            const speed = 80 + Math.random() * 60;

            this.addParticle(
                x + Math.cos(angle) * 15,
                y + Math.sin(angle) * 15,
                {
                    vx: Math.cos(spreadAngle) * speed,
                    vy: Math.sin(spreadAngle) * speed,
                    life: 0.15,
                    color: 0xffffff,
                    size: 3 + Math.random() * 4,
                    shrink: true,
                    alpha: 0.7,
                }
            );
        }
    }

    /**
     * Spawn death effect (dissolve into particles).
     */
    spawnDeathEffect(x, y, color) {
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 30 + Math.random() * 80;

            this.addParticle(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 30,
                life: 0.6 + Math.random() * 0.4,
                color: color || 0xff4444,
                size: 3 + Math.random() * 5,
                shrink: true,
                gravity: 80,
            });
        }
    }

    /**
     * Spawn respawn effect (particles converging).
     */
    spawnRespawnEffect(x, y) {
        for (let i = 0; i < 15; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 40 + Math.random() * 60;
            const startX = x + Math.cos(angle) * dist;
            const startY = y + Math.sin(angle) * dist;

            this.addParticle(startX, startY, {
                vx: (x - startX) * 2,
                vy: (y - startY) * 2,
                life: 0.5,
                color: 0x6366f1,
                size: 4 + Math.random() * 4,
                shrink: false,
                alpha: 0.8,
            });
        }
    }

    /**
     * Spawn cannon muzzle flash.
     */
    spawnMuzzleFlash(x, y, angle) {
        for (let i = 0; i < 8; i++) {
            const spreadAngle = angle + (Math.random() - 0.5) * 0.8;
            const speed = 100 + Math.random() * 150;

            this.addParticle(x, y, {
                vx: Math.cos(spreadAngle) * speed,
                vy: Math.sin(spreadAngle) * speed,
                life: 0.1 + Math.random() * 0.1,
                color: [0xffff00, 0xffffff, 0xffcc00][Math.floor(Math.random() * 3)],
                size: 3 + Math.random() * 5,
                shrink: true,
                alpha: 0.9,
            });
        }
    }

    // ═══════════════════════════════════════════════════════════
    //  PARTICLE SYSTEM
    // ═══════════════════════════════════════════════════════════

    addParticle(x, y, config) {
        // Reuse dead particles if at max
        let particle;
        if (this.particles.length >= this.maxParticles) {
            // Find a dead particle to reuse
            particle = this.particles.find(p => p.life <= 0);
            if (!particle) {
                // Remove oldest
                const oldest = this.particles.shift();
                oldest.graphic.destroy();
                particle = null;
            }
        }

        if (!particle) {
            const graphic = this.scene.add.circle(x, y, config.size, config.color, config.alpha || 1);
            graphic.setDepth(20);

            particle = {
                graphic,
                vx: config.vx || 0,
                vy: config.vy || 0,
                life: config.life || 0.5,
                maxLife: config.life || 0.5,
                shrink: config.shrink || false,
                gravity: config.gravity || 0,
                startSize: config.size,
            };

            this.particles.push(particle);
        } else {
            particle.graphic.setPosition(x, y);
            particle.graphic.setRadius(config.size);
            particle.graphic.setFillStyle(config.color, config.alpha || 1);
            particle.graphic.setVisible(true);
            particle.vx = config.vx || 0;
            particle.vy = config.vy || 0;
            particle.life = config.life || 0.5;
            particle.maxLife = config.life || 0.5;
            particle.shrink = config.shrink || false;
            particle.gravity = config.gravity || 0;
            particle.startSize = config.size;
        }
    }

    /**
     * Update all particles. Call every frame.
     */
    update(dt) {
        for (const particle of this.particles) {
            if (particle.life <= 0) {
                particle.graphic.setVisible(false);
                continue;
            }

            particle.life -= dt;
            particle.vy += particle.gravity * dt;
            particle.graphic.x += particle.vx * dt;
            particle.graphic.y += particle.vy * dt;

            // Fade out
            const lifeRatio = Math.max(0, particle.life / particle.maxLife);
            particle.graphic.setAlpha(lifeRatio);

            // Shrink
            if (particle.shrink) {
                particle.graphic.setRadius(particle.startSize * lifeRatio);
            }
        }
    }

    destroy() {
        for (const particle of this.particles) {
            particle.graphic.destroy();
        }
        this.particles = [];
    }
}
