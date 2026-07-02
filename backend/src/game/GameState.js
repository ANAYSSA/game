/**
 * ARENA CLASH — Game State
 * 
 * The authoritative world state. Manages all players, projectiles,
 * and map obstacles. Creates snapshots for network broadcast.
 */

import { SERVER_CONFIG } from '../config/serverConfig.js';
import { CHARACTERS } from '../config/characters.js';
import { PlayerState } from './PlayerState.js';

export class GameState {
    constructor() {
        /** @type {Map<string, PlayerState>} */
        this.players = new Map();

        /** @type {Array<Object>} Active projectiles */
        this.projectiles = [];

        /** @type {number} Next projectile ID */
        this.nextProjectileId = 1;

        /** @type {Array<Object>} Static obstacles on the map */
        this.obstacles = this.generateObstacles();

        /** @type {Array<Object>} Wall boundaries */
        this.walls = this.generateWalls();

        console.log(`[GameState] Initialized. Obstacles: ${this.obstacles.length}, Walls: ${this.walls.length}`);
    }

    // ═══════════════════════════════════════════════════════════
    //  PLAYER MANAGEMENT
    // ═══════════════════════════════════════════════════════════

    addPlayer(socketId, nickname, characterId) {
        if (this.players.size >= SERVER_CONFIG.MAX_PLAYERS) {
            return null;
        }

        const charConfig = CHARACTERS[characterId];
        if (!charConfig) return null;

        const spawnPoint = this.getRandomSpawnPoint();
        const player = new PlayerState(socketId, nickname, charConfig, spawnPoint);

        this.players.set(socketId, player);
        console.log(`[GameState] Player joined: "${nickname}" as ${characterId} (${this.players.size} total)`);
        return player;
    }

    removePlayer(socketId) {
        const player = this.players.get(socketId);
        if (player) {
            this.players.delete(socketId);
            console.log(`[GameState] Player left: "${player.nickname}" (${this.players.size} remaining)`);
        }

        // Also remove their projectiles
        this.projectiles = this.projectiles.filter(p => p.ownerId !== socketId);
    }

    getPlayer(socketId) {
        return this.players.get(socketId);
    }

    getPlayerCount() {
        return this.players.size;
    }

    getRandomSpawnPoint() {
        const points = SERVER_CONFIG.SPAWN_POINTS;
        return { ...points[Math.floor(Math.random() * points.length)] };
    }

    respawnPlayer(playerId) {
        const player = this.players.get(playerId);
        if (!player) return;

        const spawn = this.getRandomSpawnPoint();
        player.respawn(spawn);
        console.log(`[GameState] Player respawned: "${player.nickname}" at (${spawn.x}, ${spawn.y})`);
    }

    // ═══════════════════════════════════════════════════════════
    //  PROJECTILE MANAGEMENT
    // ═══════════════════════════════════════════════════════════

    addProjectile(ownerId, x, y, angle, speed, damage, maxRange, radius) {
        const id = this.nextProjectileId++;
        const projectile = {
            id,
            ownerId,
            x, y,
            startX: x,
            startY: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            damage,
            maxRange,
            radius: radius || 8,
            alive: true,
        };

        this.projectiles.push(projectile);
        return projectile;
    }

    removeProjectile(id) {
        const index = this.projectiles.findIndex(p => p.id === id);
        if (index !== -1) {
            this.projectiles.splice(index, 1);
        }
    }

    // ═══════════════════════════════════════════════════════════
    //  MAP GENERATION
    // ═══════════════════════════════════════════════════════════

    generateObstacles() {
        const obstacles = [];
        const ts = SERVER_CONFIG.TILE_SIZE;

        // Define obstacle positions (grid coordinates)
        const obstacleDefinitions = [
            // Crates cluster - top left
            { gx: 4, gy: 3, type: 'crate' },
            { gx: 5, gy: 3, type: 'crate' },
            { gx: 4, gy: 4, type: 'crate' },

            // Rocks - center area
            { gx: 20, gy: 15, type: 'rock' },
            { gx: 22, gy: 17, type: 'rock' },
            { gx: 25, gy: 14, type: 'rock' },

            // Pillars - symmetrical
            { gx: 15, gy: 10, type: 'pillar' },
            { gx: 35, gy: 10, type: 'pillar' },
            { gx: 15, gy: 27, type: 'pillar' },
            { gx: 35, gy: 27, type: 'pillar' },
            { gx: 25, gy: 18, type: 'pillar' },

            // Trees - scattered
            { gx: 8, gy: 7, type: 'tree' },
            { gx: 42, gy: 7, type: 'tree' },
            { gx: 8, gy: 30, type: 'tree' },
            { gx: 42, gy: 30, type: 'tree' },
            { gx: 10, gy: 20, type: 'tree' },
            { gx: 40, gy: 20, type: 'tree' },

            // More crates
            { gx: 30, gy: 5, type: 'crate' },
            { gx: 31, gy: 5, type: 'crate' },
            { gx: 18, gy: 30, type: 'crate' },
            { gx: 19, gy: 30, type: 'crate' },
            { gx: 18, gy: 31, type: 'crate' },

            // Rocks around edges
            { gx: 3, gy: 15, type: 'rock' },
            { gx: 46, gy: 15, type: 'rock' },
            { gx: 3, gy: 25, type: 'rock' },
            { gx: 46, gy: 25, type: 'rock' },

            // Center arena rocks
            { gx: 23, gy: 18, type: 'rock' },
            { gx: 27, gy: 18, type: 'rock' },
            { gx: 25, gy: 16, type: 'rock' },
            { gx: 25, gy: 21, type: 'rock' },
        ];

        obstacleDefinitions.forEach(def => {
            obstacles.push({
                x: def.gx * ts,
                y: def.gy * ts,
                width: ts,
                height: ts,
                type: def.type,
            });
        });

        return obstacles;
    }

    generateWalls() {
        const walls = [];
        const ts = SERVER_CONFIG.TILE_SIZE;
        const mapW = SERVER_CONFIG.MAP_WIDTH;
        const mapH = SERVER_CONFIG.MAP_HEIGHT;
        const cols = Math.ceil(mapW / ts);
        const rows = Math.ceil(mapH / ts);

        // Perimeter walls
        for (let x = 0; x < cols; x++) {
            // Top wall
            walls.push({ x: x * ts, y: 0, width: ts, height: ts });
            // Bottom wall
            walls.push({ x: x * ts, y: (rows - 1) * ts, width: ts, height: ts });
        }
        for (let y = 1; y < rows - 1; y++) {
            // Left wall
            walls.push({ x: 0, y: y * ts, width: ts, height: ts });
            // Right wall
            walls.push({ x: (cols - 1) * ts, y: y * ts, width: ts, height: ts });
        }

        // Inner wall structures for arena complexity
        // Horizontal wall segment - center top
        for (let x = 18; x <= 22; x++) {
            walls.push({ x: x * ts, y: 8 * ts, width: ts, height: ts });
        }
        // Horizontal wall segment - center bottom
        for (let x = 28; x <= 32; x++) {
            walls.push({ x: x * ts, y: 28 * ts, width: ts, height: ts });
        }
        // Vertical wall segment - left
        for (let y = 12; y <= 15; y++) {
            walls.push({ x: 12 * ts, y: y * ts, width: ts, height: ts });
        }
        // Vertical wall segment - right
        for (let y = 22; y <= 25; y++) {
            walls.push({ x: 38 * ts, y: y * ts, width: ts, height: ts });
        }

        return walls;
    }

    // ═══════════════════════════════════════════════════════════
    //  SNAPSHOT FOR NETWORK
    // ═══════════════════════════════════════════════════════════

    createSnapshot() {
        const players = [];

        for (const [id, player] of this.players) {
            players.push({
                id,
                x: Math.round(player.x),
                y: Math.round(player.y),
                hp: player.hp,
                maxHp: player.charConfig.maxHp,
                char: player.charConfig.id,
                dir: player.direction,
                moving: player.moving,
                alive: player.alive,
                nick: player.nickname,
                attacking: player.attacking,
                attackTimer: player.attackAnimTimer > 0 ? 1 : 0,
                kothScore: player.kothScore,
            });
        }

        const projectiles = this.projectiles
            .filter(p => p.alive)
            .map(p => ({
                id: p.id,
                x: Math.round(p.x),
                y: Math.round(p.y),
                ownerId: p.ownerId,
            }));

        return { players, projectiles };
    }
}
