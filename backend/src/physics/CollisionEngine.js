/**
 * ARENA CLASH — Collision Engine
 * 
 * Server-side physics: AABB and circle collision detection/resolution
 * for players vs obstacles, players vs walls, players vs players,
 * and projectiles vs everything.
 */

import { SERVER_CONFIG } from '../config/serverConfig.js';

export class CollisionEngine {
    constructor(gameState) {
        this.gameState = gameState;
    }

    /**
     * Resolve collisions between a player and all obstacles + walls.
     */
    resolvePlayerObstacleCollisions(player) {
        const r = player.charConfig.radius;

        // Check walls
        for (const wall of this.gameState.walls) {
            this.resolveCircleRect(player, r, wall);
        }

        // Check obstacles
        for (const obs of this.gameState.obstacles) {
            this.resolveCircleRect(player, r, obs);
        }
    }

    /**
     * Resolve collisions between all player pairs (push apart).
     */
    resolvePlayerPlayerCollisions(players) {
        for (let i = 0; i < players.length; i++) {
            for (let j = i + 1; j < players.length; j++) {
                const a = players[i];
                const b = players[j];

                if (!a.alive || !b.alive) continue;

                const dx = b.x - a.x;
                const dy = b.y - a.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const minDist = a.charConfig.radius + b.charConfig.radius;

                if (dist < minDist && dist > 0) {
                    const overlap = (minDist - dist) / 2;
                    const nx = dx / dist;
                    const ny = dy / dist;

                    a.x -= nx * overlap * SERVER_CONFIG.PLAYER_PUSH_FORCE;
                    a.y -= ny * overlap * SERVER_CONFIG.PLAYER_PUSH_FORCE;
                    b.x += nx * overlap * SERVER_CONFIG.PLAYER_PUSH_FORCE;
                    b.y += ny * overlap * SERVER_CONFIG.PLAYER_PUSH_FORCE;
                }
            }
        }
    }

    /**
     * Update all projectiles: move, check collisions, destroy if needed.
     */
    updateProjectiles(dt, gameState) {
        const toRemove = [];

        for (const proj of gameState.projectiles) {
            if (!proj.alive) continue;

            // Move projectile
            proj.x += proj.vx * dt;
            proj.y += proj.vy * dt;

            // Check max range
            const dx = proj.x - proj.startX;
            const dy = proj.y - proj.startY;
            const distTraveled = Math.sqrt(dx * dx + dy * dy);
            if (distTraveled > proj.maxRange) {
                proj.alive = false;
                toRemove.push(proj.id);
                continue;
            }

            // Check map boundaries
            if (proj.x < 0 || proj.x > SERVER_CONFIG.MAP_WIDTH ||
                proj.y < 0 || proj.y > SERVER_CONFIG.MAP_HEIGHT) {
                proj.alive = false;
                toRemove.push(proj.id);
                continue;
            }

            // Check wall collisions
            let hitWall = false;
            for (const wall of gameState.walls) {
                if (this.circleRectOverlap(proj.x, proj.y, proj.radius, wall)) {
                    hitWall = true;
                    break;
                }
            }
            if (hitWall) {
                proj.alive = false;
                toRemove.push(proj.id);
                continue;
            }

            // Check obstacle collisions
            let hitObs = false;
            for (const obs of gameState.obstacles) {
                if (this.circleRectOverlap(proj.x, proj.y, proj.radius, obs)) {
                    hitObs = true;
                    break;
                }
            }
            if (hitObs) {
                proj.alive = false;
                toRemove.push(proj.id);
                continue;
            }

            // Check player collisions
            for (const [playerId, player] of gameState.players) {
                if (playerId === proj.ownerId || !player.alive) continue;

                const pdx = player.x - proj.x;
                const pdy = player.y - proj.y;
                const pdist = Math.sqrt(pdx * pdx + pdy * pdy);

                if (pdist < proj.radius + player.charConfig.radius) {
                    // Hit player!
                    const died = player.takeDamage(proj.damage, proj.ownerId);

                    if (died) {
                        const attacker = gameState.getPlayer(proj.ownerId);
                        if (attacker) {
                            attacker.kills++;
                        }
                    }

                    proj.alive = false;
                    toRemove.push(proj.id);
                    break;
                }
            }
        }

        // Clean up dead projectiles
        for (const id of toRemove) {
            gameState.removeProjectile(id);
        }
    }

    // ═══════════════════════════════════════════════════════════
    //  COLLISION PRIMITIVES
    // ═══════════════════════════════════════════════════════════

    /**
     * Resolve circle-vs-rectangle collision by pushing the circle out.
     */
    resolveCircleRect(player, radius, rect) {
        // Find closest point on rectangle to circle center
        const closestX = Math.max(rect.x, Math.min(player.x, rect.x + rect.width));
        const closestY = Math.max(rect.y, Math.min(player.y, rect.y + rect.height));

        const dx = player.x - closestX;
        const dy = player.y - closestY;
        const distSq = dx * dx + dy * dy;

        if (distSq < radius * radius) {
            const dist = Math.sqrt(distSq);
            if (dist === 0) {
                // Player center is inside rect — push out along shortest axis
                const overlapLeft = player.x - rect.x;
                const overlapRight = (rect.x + rect.width) - player.x;
                const overlapTop = player.y - rect.y;
                const overlapBottom = (rect.y + rect.height) - player.y;
                const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

                if (minOverlap === overlapLeft) player.x = rect.x - radius;
                else if (minOverlap === overlapRight) player.x = rect.x + rect.width + radius;
                else if (minOverlap === overlapTop) player.y = rect.y - radius;
                else player.y = rect.y + rect.height + radius;
            } else {
                const overlap = radius - dist;
                player.x += (dx / dist) * overlap;
                player.y += (dy / dist) * overlap;
            }
        }
    }

    /**
     * Check if a circle overlaps a rectangle (no resolution, just detection).
     */
    circleRectOverlap(cx, cy, radius, rect) {
        const closestX = Math.max(rect.x, Math.min(cx, rect.x + rect.width));
        const closestY = Math.max(rect.y, Math.min(cy, rect.y + rect.height));

        const dx = cx - closestX;
        const dy = cy - closestY;

        return (dx * dx + dy * dy) < (radius * radius);
    }
}
