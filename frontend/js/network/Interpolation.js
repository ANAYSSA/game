/**
 * ARENA CLASH — Entity Interpolation
 * 
 * Smoothly interpolates remote entity positions between server snapshots.
 * Renders entities 100ms behind server time for smooth visual movement.
 */

import { GAME_CONFIG } from '../config/gameConfig.js';

export class InterpolationBuffer {
    constructor() {
        /** @type {Array<{timestamp: number, state: Object}>} */
        this.snapshots = [];
        this.maxSnapshots = 10;
        this.delay = GAME_CONFIG.INTERPOLATION_DELAY_MS;
    }

    /**
     * Push a new server snapshot.
     */
    push(timestamp, state) {
        this.snapshots.push({ timestamp, state });

        // Keep buffer bounded
        if (this.snapshots.length > this.maxSnapshots) {
            this.snapshots.shift();
        }
    }

    /**
     * Get interpolated state for a specific entity at the current render time.
     * @param {string} entityId - Player ID
     * @param {number} currentTime - Current client time (Date.now())
     * @returns {Object|null} Interpolated state or null if not enough data
     */
    getInterpolatedState(entityId, currentTime) {
        const renderTime = currentTime - this.delay;

        // Need at least 2 snapshots for interpolation
        if (this.snapshots.length < 2) {
            // Return latest known state if available
            if (this.snapshots.length === 1) {
                const state = this.snapshots[0].state;
                const entity = this.findEntity(state, entityId);
                return entity || null;
            }
            return null;
        }

        // Find the two snapshots that bracket renderTime
        let before = null;
        let after = null;

        for (let i = 0; i < this.snapshots.length - 1; i++) {
            if (this.snapshots[i].timestamp <= renderTime &&
                this.snapshots[i + 1].timestamp >= renderTime) {
                before = this.snapshots[i];
                after = this.snapshots[i + 1];
                break;
            }
        }

        // If renderTime is beyond all snapshots, use the latest
        if (!before || !after) {
            const latest = this.snapshots[this.snapshots.length - 1];
            const entity = this.findEntity(latest.state, entityId);
            return entity || null;
        }

        // Interpolation factor (0 to 1)
        const totalDuration = after.timestamp - before.timestamp;
        const t = totalDuration > 0
            ? Math.min(1, (renderTime - before.timestamp) / totalDuration)
            : 0;

        // Find entity in both snapshots
        const entityBefore = this.findEntity(before.state, entityId);
        const entityAfter = this.findEntity(after.state, entityId);

        if (!entityBefore) return entityAfter || null;
        if (!entityAfter) return entityBefore;

        // Linearly interpolate position
        return {
            ...entityAfter,
            x: entityBefore.x + (entityAfter.x - entityBefore.x) * t,
            y: entityBefore.y + (entityAfter.y - entityBefore.y) * t,
        };
    }

    /**
     * Find an entity by ID in a snapshot's player list.
     */
    findEntity(state, entityId) {
        if (!state || !state.players) return null;
        return state.players.find(p => p.id === entityId) || null;
    }

    /**
     * Clear all snapshots.
     */
    clear() {
        this.snapshots = [];
    }
}
