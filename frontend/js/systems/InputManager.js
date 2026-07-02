/**
 * ARENA CLASH — Input Manager
 * 
 * Unified input abstraction for PC (WASD + mouse) and mobile (joystick + button).
 * Provides normalized direction vector and attack state.
 */

import { GAME_CONFIG } from '../config/gameConfig.js';
import { MobileControls } from './MobileControls.js';

export class InputManager {
    constructor(scene) {
        this.scene = scene;
        this.isMobile = GAME_CONFIG.IS_MOBILE;

        // Normalized movement direction (-1 to 1)
        this.dx = 0;
        this.dy = 0;

        // Attack state
        this.attackPressed = false;
        this.attackAngle = 0;

        // PC keys
        this.keys = null;
        this.pointer = null;

        // Mobile controls
        this.mobileControls = null;

        if (this.isMobile) {
            this.initMobile();
        } else {
            this.initPC();
        }
    }

    initPC() {
        // WASD keys
        this.keys = {
            W: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            A: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            S: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            D: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
            ESC: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC),
        };

        this.pointer = this.scene.input.activePointer;

        // Track mouse click for attack
        this.scene.input.on('pointerdown', (pointer) => {
            if (pointer.leftButtonDown()) {
                this.attackPressed = true;
            }
        });
    }

    initMobile() {
        this.mobileControls = new MobileControls(this);

        // Show mobile controls
        const mobileUI = document.getElementById('mobile-controls');
        if (mobileUI) mobileUI.style.display = 'block';
    }

    /**
     * Poll input state. Call every frame.
     * @param {number} playerX - Local player world X (for attack angle)
     * @param {number} playerY - Local player world Y (for attack angle)
     */
    update(playerX, playerY) {
        if (this.isMobile) {
            this.updateMobile(playerX, playerY);
        } else {
            this.updatePC(playerX, playerY);
        }
    }

    updatePC(playerX, playerY) {
        this.dx = 0;
        this.dy = 0;

        if (this.keys.A.isDown) this.dx -= 1;
        if (this.keys.D.isDown) this.dx += 1;
        if (this.keys.W.isDown) this.dy -= 1;
        if (this.keys.S.isDown) this.dy += 1;

        // Calculate attack angle (mouse direction from player)
        if (this.pointer) {
            const worldX = this.pointer.worldX;
            const worldY = this.pointer.worldY;
            this.attackAngle = Math.atan2(worldY - playerY, worldX - playerX);
            
            // Continuous attack if mouse is held down
            if (this.pointer.leftButtonDown()) {
                this.attackPressed = true;
            }
        }
    }

    updateMobile(playerX, playerY) {
        if (this.mobileControls) {
            const joyData = this.mobileControls.getJoystickData();
            this.dx = joyData.dx;
            this.dy = joyData.dy;

            // Attack angle is facing direction on mobile
            if (this.dx !== 0 || this.dy !== 0) {
                this.attackAngle = Math.atan2(this.dy, this.dx);
            }
        }
    }

    /**
     * Consume attack input (returns true once per press).
     */
    consumeAttack() {
        if (this.isMobile && this.mobileControls) {
            return this.mobileControls.consumeAttack();
        }

        if (this.attackPressed) {
            this.attackPressed = false;
            return true;
        }
        return false;
    }

    /**
     * Get the current facing direction string.
     */
    getDirection() {
        if (this.dx === 0 && this.dy === 0) return null;

        if (Math.abs(this.dx) > Math.abs(this.dy)) {
            return this.dx > 0 ? 'right' : 'left';
        }
        return this.dy > 0 ? 'down' : 'up';
    }

    destroy() {
        if (this.mobileControls) {
            this.mobileControls.destroy();
        }
        const mobileUI = document.getElementById('mobile-controls');
        if (mobileUI) mobileUI.style.display = 'none';
    }
}
