/**
 * ARENA CLASH — Socket Handler
 * 
 * Manages all Socket.IO connection events:
 * player join, input, disconnect, character selection, ping.
 */

import { VALID_CHARACTER_IDS } from '../config/characters.js';
import { SERVER_CONFIG } from '../config/serverConfig.js';

export class SocketHandler {
    constructor(io, gameState) {
        this.io = io;
        this.gameState = gameState;

        this.setupConnectionHandler();
    }

    setupConnectionHandler() {
        this.io.on('connection', (socket) => {
            console.log(`[Socket] Connected: ${socket.id}`);

            // ── Join Game ─────────────────────────────────
            socket.on('player:join', (data) => {
                this.handleJoin(socket, data);
            });

            // ── Player Input ──────────────────────────────
            socket.on('player:input', (data) => {
                this.handleInput(socket, data);
            });

            // ── Ping measurement ──────────────────────────
            socket.on('ping:check', (timestamp) => {
                socket.emit('ping:response', timestamp);
            });

            // ── Teleport (Samurai only) ───────────────────
            socket.on('player:teleport', (data) => {
                this.handleTeleport(socket, data);
            });

            // ── Disconnect ────────────────────────────────
            socket.on('disconnect', (reason) => {
                this.handleDisconnect(socket, reason);
            });
        });
    }

    // ═══════════════════════════════════════════════════════════
    //  JOIN
    // ═══════════════════════════════════════════════════════════

    handleJoin(socket, data) {
        const { nickname, character } = data || {};

        // Validate character
        if (!character || !VALID_CHARACTER_IDS.includes(character)) {
            socket.emit('join:error', { message: 'Invalid character selection.' });
            return;
        }

        // Validate nickname
        const safeName = (nickname || 'Player').toString().substring(0, 16).replace(/[<>&"']/g, '');

        // Check max players
        if (this.gameState.getPlayerCount() >= SERVER_CONFIG.MAX_PLAYERS) {
            socket.emit('join:error', { message: 'Server is full.' });
            return;
        }

        // Check if already joined
        if (this.gameState.getPlayer(socket.id)) {
            socket.emit('join:error', { message: 'Already joined.' });
            return;
        }

        // Add player to game state
        const player = this.gameState.addPlayer(socket.id, safeName, character);
        if (!player) {
            socket.emit('join:error', { message: 'Failed to join. Try again.' });
            return;
        }

        // Send join confirmation to the player
        socket.emit('join:success', {
            id: socket.id,
            x: player.x,
            y: player.y,
            hp: player.hp,
            maxHp: player.charConfig.maxHp,
            character: player.charConfig.id,
            nickname: player.nickname,
            mapWidth: SERVER_CONFIG.MAP_WIDTH,
            mapHeight: SERVER_CONFIG.MAP_HEIGHT,
            tileSize: SERVER_CONFIG.TILE_SIZE,
            tickRate: SERVER_CONFIG.TICK_RATE,
            obstacles: this.gameState.obstacles,
            walls: this.gameState.walls,
            turrets: SERVER_CONFIG.TURRETS,
        });

        // Notify all other players
        socket.broadcast.emit('player:joined', {
            id: socket.id,
            x: player.x,
            y: player.y,
            hp: player.hp,
            maxHp: player.charConfig.maxHp,
            char: player.charConfig.id,
            nick: player.nickname,
        });

        console.log(`[Socket] Player joined: "${safeName}" as ${character}`);
    }

    // ═══════════════════════════════════════════════════════════
    //  INPUT
    // ═══════════════════════════════════════════════════════════

    handleInput(socket, data) {
        const player = this.gameState.getPlayer(socket.id);
        if (!player || !player.alive) return;

        // Validate input data
        const input = {
            seq: parseInt(data.seq, 10) || 0,
            dx: Math.max(-1, Math.min(1, parseFloat(data.dx) || 0)),
            dy: Math.max(-1, Math.min(1, parseFloat(data.dy) || 0)),
            attack: !!data.attack,
            attackAngle: parseFloat(data.attackAngle) || 0,
        };

        // Clamp direction magnitude to prevent speed hacking via diagonal
        const mag = Math.sqrt(input.dx * input.dx + input.dy * input.dy);
        if (mag > 1) {
            input.dx /= mag;
            input.dy /= mag;
        }

        player.queueInput(input);
    }

    // ═══════════════════════════════════════════════════════════
    //  TELEPORT (Samurai)
    // ═══════════════════════════════════════════════════════════

    handleTeleport(socket, data) {
        const player = this.gameState.getPlayer(socket.id);
        if (!player || !player.alive || player.charConfig.id !== 'samurai') return;

        const targetId = data.targetId;
        const target = this.gameState.getPlayer(targetId);
        
        const now = Date.now();
        
        if (target && target.alive && targetId !== socket.id) {
            // Teleport behind target
            const offset = 40;
            let tx = target.x;
            let ty = target.y;

            if (target.direction === 'right') tx -= offset;
            else if (target.direction === 'left') tx += offset;
            else if (target.direction === 'down') ty -= offset;
            else if (target.direction === 'up') ty += offset;

            // Clamp to map
            tx = Math.max(20, Math.min(SERVER_CONFIG.MAP_WIDTH - 20, tx));
            ty = Math.max(20, Math.min(SERVER_CONFIG.MAP_HEIGHT - 20, ty));

            player.x = tx;
            player.y = ty;
            player.lastTeleportTime = now;

            // Notify everyone to spawn teleport effect
            this.io.emit('player:teleported', {
                id: socket.id,
                x: tx,
                y: ty,
                targetId: targetId
            });
        }
    }

    // ═══════════════════════════════════════════════════════════
    //  DISCONNECT
    // ═══════════════════════════════════════════════════════════

    handleDisconnect(socket, reason) {
        const player = this.gameState.getPlayer(socket.id);

        if (player) {
            // Notify all clients
            this.io.emit('player:left', {
                id: socket.id,
                nickname: player.nickname,
            });

            // Remove from game state
            this.gameState.removePlayer(socket.id);
        }

        console.log(`[Socket] Disconnected: ${socket.id} (${reason})`);
    }
}
