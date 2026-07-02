/**
 * ARENA CLASH — Anti-Cheat System
 * 
 * Server-side validation of player actions.
 * Since this is an authoritative server, cheating is already limited,
 * but additional checks prevent manipulation of the input stream.
 */

import { SERVER_CONFIG } from '../config/serverConfig.js';

export class AntiCheat {
    /**
     * Validate that a player's input is reasonable.
     * @param {PlayerState} player - The player
     * @param {Object} input - The input data
     * @returns {boolean} true if input is valid
     */
    static validateInput(player, input) {
        // Check direction magnitude (should be ≤ 1)
        const mag = Math.sqrt(
            (input.dx || 0) ** 2 + (input.dy || 0) ** 2
        );
        if (mag > 1.5) {
            console.warn(`[AntiCheat] Player ${player.id}: Input magnitude ${mag.toFixed(2)} exceeds limit`);
            return false;
        }

        // Check input rate (flood protection is in PlayerState.queueInput)
        return true;
    }

    /**
     * Validate player position hasn't teleported impossibly.
     * Since the server calculates positions, this checks for server bugs.
     */
    static validatePosition(player, newX, newY, dt) {
        const maxDist = player.charConfig.speed * dt * SERVER_CONFIG.SPEED_TOLERANCE;
        const dx = newX - player.lastValidX;
        const dy = newY - player.lastValidY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > maxDist + 10) {
            // Position moved too far — could be a bug or lag spike
            // Don't reject, just log for monitoring
            console.warn(`[AntiCheat] Player ${player.id}: Moved ${dist.toFixed(1)}px in one tick (max ${maxDist.toFixed(1)})`);
        }

        // Update last valid position
        player.lastValidX = newX;
        player.lastValidY = newY;

        return true;
    }

    /**
     * Validate cooldown is respected (server already enforces this,
     * but this provides additional logging).
     */
    static validateCooldown(player) {
        if (player.cooldownTimer > 0) {
            // Attack while on cooldown — this should never happen
            // because the server checks canAttack() before processing
            return false;
        }
        return true;
    }
}
