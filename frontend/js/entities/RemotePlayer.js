/**
 * ARENA CLASH — Remote Player Entity
 * 
 * Renders other players with interpolated positions,
 * nameplates, HP bars, and animations based on server state.
 */

export class RemotePlayer {
    constructor(scene, data) {
        this.scene = scene;
        this.id = data.id;
        this.characterId = data.char;
        this.nickname = data.nick || 'Player';

        // State
        this.x = data.x;
        this.y = data.y;
        this.targetX = data.x;
        this.targetY = data.y;
        this.hp = data.hp;
        this.maxHp = data.maxHp;
        this.direction = data.dir || 'down';
        this.moving = false;
        this.alive = data.alive !== false;
        this.attacking = false;
        this.lastHp = data.hp;

        // Sprite
        const spriteKey = `${this.characterId}_down_idle`;
        this.sprite = scene.add.sprite(data.x, data.y, spriteKey);
        this.sprite.setDepth(10);

        // Nameplate
        this.nameText = scene.add.text(data.x, data.y - 42, this.nickname, {
            fontFamily: 'Orbitron',
            fontSize: '10px',
            color: '#a0a0ff',
            stroke: '#000000',
            strokeThickness: 3,
            align: 'center',
        }).setOrigin(0.5).setDepth(15);

        // HP bar
        this.hpBarBg = scene.add.rectangle(data.x, data.y - 32, 50, 5, 0x000000, 0.5)
            .setDepth(15);
        this.hpBarFill = scene.add.rectangle(data.x - 25, data.y - 32, 50, 5, 0x22c55e, 1)
            .setOrigin(0, 0.5).setDepth(15);

        // Animation
        this.animTimer = 0;
        this.walkFrame = 1;
        this.attackFrame = 0;
        this.attackTimer = 0;
    }

    /**
     * Update with interpolated server data.
     */
    updateFromServer(data) {
        this.targetX = data.x;
        this.targetY = data.y;
        this.direction = data.dir || this.direction;
        this.moving = data.moving;
        this.alive = data.alive;
        this.maxHp = data.maxHp;

        // Detect damage
        if (data.hp < this.hp && this.hp > 0) {
            this.playHurtEffect();
        }
        this.hp = data.hp;

        // Detect attack
        if (data.attackTimer && !this.attacking) {
            this.attacking = true;
            this.attackFrame = 1;
            this.attackTimer = 0;
        }
    }

    /**
     * Render update — interpolate position and animate.
     */
    update(dt) {
        // Smooth position interpolation
        const lerpFactor = Math.min(1, dt * 12);
        this.x += (this.targetX - this.x) * lerpFactor;
        this.y += (this.targetY - this.y) * lerpFactor;

        this.sprite.setPosition(this.x, this.y);
        this.sprite.setDepth(this.y);
        this.nameText.setPosition(this.x, this.y - 42);
        this.nameText.setDepth(this.y + 20);
        this.hpBarBg.setPosition(this.x, this.y - 32);
        this.hpBarBg.setDepth(this.y + 20);
        this.hpBarFill.setPosition(this.x - 25, this.y - 32);
        this.hpBarFill.setDepth(this.y + 20);

        // HP bar
        const hpPercent = Math.max(0, this.hp / this.maxHp);
        this.hpBarFill.setSize(50 * hpPercent, 5);

        if (hpPercent > 0.6) {
            this.hpBarFill.setFillStyle(0x22c55e);
        } else if (hpPercent > 0.3) {
            this.hpBarFill.setFillStyle(0xf59e0b);
        } else {
            this.hpBarFill.setFillStyle(0xef4444);
        }

        // Visibility
        const visible = this.alive;
        this.sprite.setVisible(visible);
        this.nameText.setVisible(visible);
        this.hpBarBg.setVisible(visible);
        this.hpBarFill.setVisible(visible);

        if (!this.alive) return;

        // Animation
        this.animTimer += dt;

        if (this.attacking) {
            this.attackTimer += dt;
            if (this.attackTimer > 0.1) {
                this.attackTimer = 0;
                this.attackFrame++;
                if (this.attackFrame > 3) {
                    this.attacking = false;
                    this.attackFrame = 0;
                }
            }
            const key = `${this.characterId}_${this.direction}_attack${Math.min(this.attackFrame, 3)}`;
            if (this.scene.textures.exists(key)) {
                this.sprite.setTexture(key);
            }
        } else if (this.moving) {
            if (this.animTimer > 0.12) {
                this.animTimer = 0;
                this.walkFrame = (this.walkFrame % 4) + 1;
            }
            const key = `${this.characterId}_${this.direction}_walk${this.walkFrame}`;
            if (this.scene.textures.exists(key)) {
                this.sprite.setTexture(key);
            }
        } else {
            const key = `${this.characterId}_${this.direction}_idle`;
            if (this.scene.textures.exists(key)) {
                this.sprite.setTexture(key);
            }
        }
    }

    playHurtEffect() {
        if (!this.sprite) return;
        this.scene.tweens.add({
            targets: this.sprite,
            alpha: 0.3,
            duration: 80,
            yoyo: true,
            repeat: 2,
        });

        // Spawn hit particles
        if (this.scene.particleManager) {
            this.scene.particleManager.spawnHitEffect(this.x, this.y);
        }
    }

    destroy() {
        this.sprite?.destroy();
        this.nameText?.destroy();
        this.hpBarBg?.destroy();
        this.hpBarFill?.destroy();
    }
}
