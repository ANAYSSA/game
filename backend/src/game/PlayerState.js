/**
 * ARENA CLASH — Player State
 * 
 * Per-player authoritative state object.
 * Tracks position, HP, cooldowns, inputs, and status.
 */

import { SERVER_CONFIG } from '../config/serverConfig.js';

export class PlayerState {
    /**
     * @param {string} id - Socket ID
     * @param {string} nickname - Display name
     * @param {Object} charConfig - Character config from characters.js
     * @param {{x: number, y: number}} spawnPoint - Initial position
     */
    constructor(id, nickname, charConfig, spawnPoint) {
        // Identity
        this.id = id;
        this.nickname = nickname.substring(0, 16); // Max 16 chars
        this.charConfig = charConfig;

        // Position & movement
        this.x = spawnPoint.x;
        this.y = spawnPoint.y;
        this.direction = 'down';
        this.moving = false;

        // Combat
        this.hp = charConfig.maxHp;
        this.alive = true;
        this.cooldownTimer = 0;     // Seconds until next attack allowed
        this.attacking = false;
        this.attackAnimTimer = 0;   // Animation timer (client visual reference)

        // Death & respawn
        this.respawnAt = null;      // Timestamp when player should respawn
        this.deaths = 0;
        this.kills = 0;

        // Network
        this.inputQueue = [];
        this.lastProcessedInput = 0;

        // Anti-cheat
        this.lastValidX = spawnPoint.x;
        this.lastValidY = spawnPoint.y;
        this.lastInputTime = Date.now();
    }

    /**
     * Queue an input from the client for processing on next tick.
     */
    queueInput(input) {
        if (this.inputQueue.length < SERVER_CONFIG.MAX_INPUT_QUEUE) {
            this.inputQueue.push(input);
        }
        // If queue is full, silently drop (anti-flood protection)
    }

    /**
     * Apply damage to this player. Returns true if player died.
     */
    takeDamage(amount, attackerId) {
        if (!this.alive) return false;

        this.hp = Math.max(0, this.hp - amount);

        if (this.hp <= 0) {
            this.die();
            return true;
        }

        return false;
    }

    /**
     * Kill this player and schedule respawn.
     */
    die() {
        this.alive = false;
        this.hp = 0;
        this.moving = false;
        this.attacking = false;
        this.deaths++;
        this.respawnAt = Date.now() + SERVER_CONFIG.RESPAWN_TIME_MS;
        this.inputQueue = []; // Clear pending inputs
    }

    /**
     * Respawn at the given point with full HP.
     */
    respawn(spawnPoint) {
        this.x = spawnPoint.x;
        this.y = spawnPoint.y;
        this.hp = this.charConfig.maxHp;
        this.alive = true;
        this.respawnAt = null;
        this.cooldownTimer = 0;
        this.attacking = false;
        this.attackAnimTimer = 0;
        this.moving = false;
        this.direction = 'down';
        this.lastValidX = spawnPoint.x;
        this.lastValidY = spawnPoint.y;
    }

    /**
     * Update cooldown timers. Called each server tick.
     */
    updateCooldowns(dt) {
        if (this.cooldownTimer > 0) {
            this.cooldownTimer = Math.max(0, this.cooldownTimer - dt);
        }

        if (this.attackAnimTimer > 0) {
            this.attackAnimTimer = Math.max(0, this.attackAnimTimer - dt);
            if (this.attackAnimTimer <= 0) {
                this.attacking = false;
            }
        }
    }

    /**
     * Check if attack is off cooldown.
     */
    canAttack() {
        return this.alive && this.cooldownTimer <= 0;
    }

    /**
     * Start attack cooldown.
     */
    startCooldown() {
        this.cooldownTimer = this.charConfig.cooldownMs / 1000;
        this.attacking = true;
        this.attackAnimTimer = 0.3; // 300ms attack animation
    }
}
