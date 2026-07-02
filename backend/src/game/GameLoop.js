/**
 * ARENA CLASH — Authoritative Game Loop
 * 
 * Fixed-timestep server loop running at TICK_RATE Hz.
 * Each tick: process inputs → update physics → resolve combat → broadcast state.
 */

import { SERVER_CONFIG } from '../config/serverConfig.js';
import { CombatSystem } from './CombatSystem.js';
import { CollisionEngine } from '../physics/CollisionEngine.js';

export class GameLoop {
    constructor(gameState, io) {
        this.gameState = gameState;
        this.io = io;
        this.combatSystem = new CombatSystem(gameState);
        this.collisionEngine = new CollisionEngine(gameState);

        this.tickRate = SERVER_CONFIG.TICK_RATE;
        this.tickIntervalMs = SERVER_CONFIG.TICK_INTERVAL_MS;
        this.intervalHandle = null;
        this.tickCount = 0;
        this.lastTickTime = 0;

        // Performance monitoring
        this.tickTimes = [];
        this.maxTickTimeSamples = 60;

        // Turret state
        this.turretAngle = 0;
        this.lastTurretFireTime = 0;
    }

    start() {
        console.log(`[GameLoop] Starting at ${this.tickRate} Hz (${this.tickIntervalMs.toFixed(1)}ms per tick)`);
        this.lastTickTime = Date.now();

        this.intervalHandle = setInterval(() => {
            this.tick();
        }, this.tickIntervalMs);
    }

    stop() {
        if (this.intervalHandle) {
            clearInterval(this.intervalHandle);
            this.intervalHandle = null;
            console.log('[GameLoop] Stopped.');
        }
    }

    tick() {
        const now = Date.now();
        const dt = (now - this.lastTickTime) / 1000; // delta in seconds
        this.lastTickTime = now;
        this.tickCount++;

        const tickStart = performance.now();

        // ─── 1. Process all queued player inputs ──────────────
        this.processInputs(dt);

        // ─── 2. Update physics (movement + collisions) ────────
        this.updatePhysics(dt);

        // ─── 3. Update combat (cooldowns, projectiles, damage)
        this.combatSystem.update(dt);

        // ─── 3.5 Update Minigames (King of the Hill) ──────────
        this.updateMinigames(dt);

        // ─── 4. Update respawn timers ─────────────────────────
        this.updateRespawns(dt);

        // ─── 5. Broadcast state to all clients ────────────────
        this.broadcastState();

        // ─── Performance monitoring ───────────────────────────
        const tickTime = performance.now() - tickStart;
        this.tickTimes.push(tickTime);
        if (this.tickTimes.length > this.maxTickTimeSamples) {
            this.tickTimes.shift();
        }

        // Log performance every 5 seconds
        if (this.tickCount % (this.tickRate * 5) === 0) {
            const avg = this.tickTimes.reduce((a, b) => a + b, 0) / this.tickTimes.length;
            const max = Math.max(...this.tickTimes);
            const playerCount = this.gameState.getPlayerCount();
            console.log(`[GameLoop] Players: ${playerCount} | Tick avg: ${avg.toFixed(2)}ms | max: ${max.toFixed(2)}ms | Budget: ${this.tickIntervalMs.toFixed(1)}ms`);
        }
    }

    // ═══════════════════════════════════════════════════════════
    //  INPUT PROCESSING
    // ═══════════════════════════════════════════════════════════

    processInputs(dt) {
        for (const [playerId, player] of this.gameState.players) {
            if (!player.alive) continue;

            // Process queued inputs
            while (player.inputQueue.length > 0) {
                const input = player.inputQueue.shift();
                this.applyInput(player, input, dt);
                player.lastProcessedInput = input.seq;
            }
        }
    }

    applyInput(player, input, dt) {
        if (!player.alive) return;

        const charConfig = player.charConfig;
        const speed = charConfig.speed;

        // Normalize direction vector
        let dx = input.dx || 0;
        let dy = input.dy || 0;
        const magnitude = Math.sqrt(dx * dx + dy * dy);

        if (magnitude > 0) {
            dx = (dx / magnitude) * speed * dt;
            dy = (dy / magnitude) * speed * dt;

            player.x += dx;
            player.y += dy;
            player.moving = true;

            // Update facing direction
            if (Math.abs(dx) > Math.abs(dy)) {
                player.direction = dx > 0 ? 'right' : 'left';
            } else {
                player.direction = dy > 0 ? 'down' : 'up';
            }
        } else {
            player.moving = false;
        }

        // Handle attack input
        if (input.attack) {
            this.combatSystem.tryAttack(player, input.attackAngle);
        }
    }

    // ═══════════════════════════════════════════════════════════
    //  PHYSICS UPDATE
    // ═══════════════════════════════════════════════════════════

    updatePhysics(dt) {
        const players = Array.from(this.gameState.players.values());

        for (const player of players) {
            if (!player.alive) continue;

            // Clamp to map boundaries
            const r = player.charConfig.radius;
            player.x = Math.max(r, Math.min(SERVER_CONFIG.MAP_WIDTH - r, player.x));
            player.y = Math.max(r, Math.min(SERVER_CONFIG.MAP_HEIGHT - r, player.y));

            // Check obstacle collisions
            this.collisionEngine.resolvePlayerObstacleCollisions(player);
        }

        // Player-player push
        this.collisionEngine.resolvePlayerPlayerCollisions(players);

        // Update projectiles
        this.collisionEngine.updateProjectiles(dt, this.gameState);
    }

    // ═══════════════════════════════════════════════════════════
    //  RESPAWN
    // ═══════════════════════════════════════════════════════════

    updateMinigames(dt) {
        const zone = SERVER_CONFIG.KOTH_ZONE;
        const now = Date.now();
        
        for (const [playerId, player] of this.gameState.players) {
            if (!player.alive) continue;
            
            const dx = player.x - zone.x;
            const dy = player.y - zone.y;
            const distSq = dx * dx + dy * dy;
            
            if (distSq <= zone.radius * zone.radius) {
                player.kothScore += dt * 10; // 10 points per second
            }

            // Samurai fire trail
            if (player.charConfig.id === 'samurai' && player.moving) {
                if (!player.lastFireTrailTime || now - player.lastFireTrailTime > 150) { // spawn every 150ms
                    player.lastFireTrailTime = now;
                    this.gameState.fireTrails.push({
                        id: ++this.gameState.nextProjectileId,
                        ownerId: playerId,
                        x: player.x,
                        y: player.y,
                        radius: 20,
                        expiresAt: now + 3000, // 3 seconds
                    });
                }
            }
        }

        // Cleanup expired fire trails
        this.gameState.fireTrails = this.gameState.fireTrails.filter(f => f.expiresAt > now);

        // Update Turrets (Bullet Hell)
        this.turretAngle += dt * 1.5; // rotate
        
        if (now - this.lastTurretFireTime > 200) { // Fire every 200ms
            this.lastTurretFireTime = now;
            
            for (const turret of SERVER_CONFIG.TURRETS) {
                // Fire two projectiles in opposite directions
                for (let i = 0; i < 2; i++) {
                    const angle = this.turretAngle + (i * Math.PI);
                    this.gameState.projectiles.push({
                        id: ++this.gameState.nextProjectileId,
                        ownerId: 'turret', // special owner
                        x: turret.x,
                        y: turret.y,
                        dx: Math.cos(angle),
                        dy: Math.sin(angle),
                        speed: 300,
                        radius: 8,
                        damage: 20,
                        distance: 0,
                        maxDistance: 1000,
                        alive: true,
                    });
                }
            }
        }
    }

    updateRespawns(dt) {
        const now = Date.now();

        for (const [playerId, player] of this.gameState.players) {
            if (!player.alive && player.respawnAt && now >= player.respawnAt) {
                this.gameState.respawnPlayer(playerId);

                // Notify all clients
                this.io.emit('player:respawn', {
                    id: playerId,
                    x: player.x,
                    y: player.y,
                    hp: player.hp,
                });
            }
        }
    }

    // ═══════════════════════════════════════════════════════════
    //  STATE BROADCAST
    // ═══════════════════════════════════════════════════════════

    broadcastState() {
        const snapshot = this.gameState.createSnapshot();

        // Send each player their own snapshot with lastProcessedInput
        for (const [playerId, player] of this.gameState.players) {
            const playerSocket = this.io.sockets.sockets.get(playerId);
            if (playerSocket) {
                playerSocket.emit('state:update', {
                    tick: this.tickCount,
                    timestamp: Date.now(),
                    lastInput: player.lastProcessedInput,
                    players: snapshot.players,
                    projectiles: snapshot.projectiles,
                    fireTrails: snapshot.fireTrails,
                });
            }
        }
    }
}
