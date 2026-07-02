/**
 * ARENA CLASH — Client-side Projectile
 * 
 * Visual representation of server-authoritative projectiles.
 * Includes trail particle effect.
 */

export class Projectile {
    constructor(scene, data) {
        this.scene = scene;
        this.id = data.id;
        this.x = data.x;
        this.y = data.y;
        this.targetX = data.x;
        this.targetY = data.y;

        // Sprite
        this.sprite = scene.add.sprite(data.x, data.y, 'projectile_cannon');
        this.sprite.setDepth(8);

        // Trail effect
        this.trailTimer = 0;
    }

    update(dt) {
        // Smooth interpolation to server position
        const lerpFactor = Math.min(1, dt * 15);
        this.x += (this.targetX - this.x) * lerpFactor;
        this.y += (this.targetY - this.y) * lerpFactor;

        this.sprite.setPosition(this.x, this.y);

        // Trail particles
        this.trailTimer += dt;
        if (this.trailTimer > 0.03 && this.scene.particleManager) {
            this.trailTimer = 0;
            this.scene.particleManager.spawnTrailParticle(this.x, this.y);
        }
    }

    updateFromServer(data) {
        this.targetX = data.x;
        this.targetY = data.y;
    }

    destroy() {
        // Explosion effect
        if (this.scene.particleManager) {
            this.scene.particleManager.spawnExplosion(this.x, this.y);
        }
        this.sprite?.destroy();
    }
}
