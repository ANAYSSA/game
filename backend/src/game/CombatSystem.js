/**
 * ARENA CLASH — Combat System
 * 
 * Server-side combat logic: attack validation, damage calculation,
 * projectile spawning, AoE damage, hit detection.
 */

import { SERVER_CONFIG } from '../config/serverConfig.js';

export class CombatSystem {
    constructor(gameState) {
        this.gameState = gameState;
    }

    /**
     * Called each server tick to update cooldowns and projectiles.
     */
    update(dt) {
        for (const [id, player] of this.gameState.players) {
            player.updateCooldowns(dt);
        }
    }

    /**
     * Attempt an attack from the given player.
     * @param {PlayerState} player - The attacking player
     * @param {number} attackAngle - Direction of attack in radians
     */
    tryAttack(player, attackAngle) {
        if (!player.canAttack()) return;

        const charConfig = player.charConfig;
        player.startCooldown();

        // Update facing direction based on attack angle
        if (attackAngle !== undefined && attackAngle !== null) {
            player.direction = this.angleToDirection(attackAngle);
        }

        switch (charConfig.type) {
            case 'melee':
                this.performMeleeAttack(player, attackAngle);
                break;
            case 'ranged':
                this.performRangedAttack(player, attackAngle);
                break;
            case 'aoe':
                this.performAoeAttack(player, attackAngle);
                break;
        }
    }

    // ═══════════════════════════════════════════════════════════
    //  MELEE ATTACK (Gopnik — Knife)
    // ═══════════════════════════════════════════════════════════

    performMeleeAttack(attacker, angle) {
        const config = attacker.charConfig;

        for (const [id, target] of this.gameState.players) {
            if (id === attacker.id || !target.alive) continue;

            // Distance check
            const dx = target.x - attacker.x;
            const dy = target.y - attacker.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > config.attackRange + target.charConfig.radius) continue;

            // Angle check (is target within the attack arc?)
            if (angle !== undefined) {
                const targetAngle = Math.atan2(dy, dx);
                const angleDiff = this.normalizeAngle(targetAngle - angle);
                if (Math.abs(angleDiff) > config.attackArc / 2) continue;
            }

            // Hit! Apply damage
            const died = target.takeDamage(config.damage, attacker.id);

            if (died) {
                attacker.kills++;
                this.emitDeath(target, attacker);
            }

            this.emitDamage(target, config.damage, attacker.id);
        }
    }

    // ═══════════════════════════════════════════════════════════
    //  RANGED ATTACK (Armor — Cannon)
    // ═══════════════════════════════════════════════════════════

    performRangedAttack(attacker, angle) {
        const config = attacker.charConfig;

        // Use facing direction if no angle specified
        if (angle === undefined || angle === null) {
            angle = this.directionToAngle(attacker.direction);
        }

        // Spawn projectile
        const spawnDist = config.radius + 5;
        const spawnX = attacker.x + Math.cos(angle) * spawnDist;
        const spawnY = attacker.y + Math.sin(angle) * spawnDist;

        const projectile = this.gameState.addProjectile(
            attacker.id,
            spawnX, spawnY,
            angle,
            config.projectileSpeed,
            config.damage,
            config.attackRange,
            config.projectileRadius
        );

        // Notify clients about projectile spawn
        // (This is done via state broadcast — projectiles are in snapshot)
    }

    // ═══════════════════════════════════════════════════════════
    //  AOE ATTACK (Godzilla — Fire Breath)
    // ═══════════════════════════════════════════════════════════

    performAoeAttack(attacker, angle) {
        const config = attacker.charConfig;

        // Use facing direction if no angle specified
        if (angle === undefined || angle === null) {
            angle = this.directionToAngle(attacker.direction);
        }

        for (const [id, target] of this.gameState.players) {
            if (id === attacker.id || !target.alive) continue;

            // Distance check
            const dx = target.x - attacker.x;
            const dy = target.y - attacker.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > config.attackRange + target.charConfig.radius) continue;

            // Cone angle check
            const targetAngle = Math.atan2(dy, dx);
            const angleDiff = this.normalizeAngle(targetAngle - angle);
            if (Math.abs(angleDiff) > config.attackArc / 2) continue;

            // Hit! Apply AoE damage
            const died = target.takeDamage(config.damage, attacker.id);

            if (died) {
                attacker.kills++;
                this.emitDeath(target, attacker);
            }

            this.emitDamage(target, config.damage, attacker.id);
        }
    }

    // ═══════════════════════════════════════════════════════════
    //  EVENTS
    // ═══════════════════════════════════════════════════════════

    emitDamage(target, amount, attackerId) {
        // Damage events are included in the state update (HP changes)
        // Additional event for hit effects
        target._lastDamageEvent = {
            amount,
            attackerId,
            timestamp: Date.now(),
        };
    }

    emitDeath(target, attacker) {
        target._deathEvent = {
            killerId: attacker.id,
            killerName: attacker.nickname,
            timestamp: Date.now(),
        };
    }

    // ═══════════════════════════════════════════════════════════
    //  UTILITY
    // ═══════════════════════════════════════════════════════════

    normalizeAngle(angle) {
        while (angle > Math.PI) angle -= Math.PI * 2;
        while (angle < -Math.PI) angle += Math.PI * 2;
        return angle;
    }

    angleToDirection(angle) {
        const a = this.normalizeAngle(angle);
        if (a >= -Math.PI / 4 && a < Math.PI / 4) return 'right';
        if (a >= Math.PI / 4 && a < Math.PI * 3 / 4) return 'down';
        if (a >= -Math.PI * 3 / 4 && a < -Math.PI / 4) return 'up';
        return 'left';
    }

    directionToAngle(dir) {
        switch (dir) {
            case 'right': return 0;
            case 'down': return Math.PI / 2;
            case 'left': return Math.PI;
            case 'up': return -Math.PI / 2;
            default: return 0;
        }
    }
}
