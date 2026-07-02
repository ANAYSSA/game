/**
 * ARENA CLASH — Local Player Entity
 * 
 * The local player sprite that responds to input and prediction.
 * Renders the player character with animations and nameplate.
 */

export class Player {
    /**
     * @param {Phaser.Scene} scene
     * @param {number} x
     * @param {number} y
     * @param {string} characterId
     * @param {string} nickname
     */
    constructor(scene, x, y, characterId, nickname) {
        this.scene = scene;
        this.characterId = characterId;
        this.nickname = nickname;
        this.alive = true;
        this.hp = 100;
        this.maxHp = 100;
        this.direction = 'down';
        this.moving = false;
        this.attacking = false;

        // Create sprite
        const spriteKey = `${characterId}_down_idle`;
        this.sprite = scene.add.sprite(x, y, spriteKey);
        this.sprite.setDepth(10);

        // Nameplate
        this.nameText = scene.add.text(x, y - 40, nickname, {
            fontFamily: 'Orbitron',
            fontSize: '11px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3,
            align: 'center',
        }).setOrigin(0.5).setDepth(15);

        // HP bar
        this.hpBarBg = scene.add.rectangle(x, y - 30, 50, 6, 0x000000, 0.5)
            .setDepth(15);
        this.hpBarFill = scene.add.rectangle(x - 25, y - 30, 50, 6, 0x22c55e, 1)
            .setOrigin(0, 0.5).setDepth(15);

        // Animation state
        this.animState = 'idle';
        this.animTimer = 0;
        this.walkFrame = 0;
        this.attackFrame = 0;
    }

    /**
     * Update sprite position and animation.
     */
    update(x, y, direction, moving, alive, hp, maxHp, attacking, dt) {
        this.direction = direction || this.direction;
        this.moving = moving;
        this.alive = alive;
        this.hp = hp;
        this.maxHp = maxHp;

        // Update position
        this.sprite.setPosition(x, y);
        this.nameText.setPosition(x, y - 42);
        this.hpBarBg.setPosition(x, y - 32);
        this.hpBarFill.setPosition(x - 25, y - 32);

        // Update HP bar
        const hpPercent = Math.max(0, hp / maxHp);
        this.hpBarFill.setSize(50 * hpPercent, 6);

        if (hpPercent > 0.6) {
            this.hpBarFill.setFillStyle(0x22c55e);
        } else if (hpPercent > 0.3) {
            this.hpBarFill.setFillStyle(0xf59e0b);
        } else {
            this.hpBarFill.setFillStyle(0xef4444);
        }

        // Visibility
        this.sprite.setVisible(alive);
        this.nameText.setVisible(alive);
        this.hpBarBg.setVisible(alive);
        this.hpBarFill.setVisible(alive);

        if (!alive) return;

        // Handle attacking animation
        if (attacking && !this.attacking) {
            this.attacking = true;
            this.attackFrame = 1;
            this.animTimer = 0;
        }

        // Update animation
        this.animTimer += dt;

        if (this.attacking) {
            if (this.animTimer > 0.1) {
                this.animTimer = 0;
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
        } else if (moving) {
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

    /**
     * Play hurt effect (flash red).
     */
    playHurtEffect() {
        if (!this.sprite) return;
        this.scene.tweens.add({
            targets: this.sprite,
            alpha: 0.3,
            duration: 80,
            yoyo: true,
            repeat: 2,
        });
    }

    /**
     * Destroy all game objects.
     */
    destroy() {
        this.sprite?.destroy();
        this.nameText?.destroy();
        this.hpBarBg?.destroy();
        this.hpBarFill?.destroy();
    }
}
