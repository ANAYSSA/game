/**
 * ARENA CLASH — Network Manager
 * 
 * Socket.IO client wrapper with auto-reconnect, ping measurement,
 * and event-based communication with the game server.
 */

import { GAME_CONFIG } from '../config/gameConfig.js';

export class NetworkManager {
    constructor() {
        this.socket = null;
        this.connected = false;
        this.playerId = null;

        // Ping tracking
        this.ping = 0;
        this.pingInterval = null;

        // Input sequencing for server reconciliation
        this.inputSequence = 0;

        // Event callbacks
        this.callbacks = new Map();

        // Reconnection state
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 20;
    }

    /**
     * Connect to the game server.
     */
    connect(nickname, character) {
        return new Promise((resolve, reject) => {
            const serverUrl = GAME_CONFIG.SERVER_URL;
            console.log(`[Network] Connecting to ${serverUrl}...`);

            // Create Socket.IO connection
            this.socket = io(serverUrl, {
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionAttempts: this.maxReconnectAttempts,
                reconnectionDelay: GAME_CONFIG.RECONNECT_DELAY_MS,
                reconnectionDelayMax: GAME_CONFIG.RECONNECT_MAX_DELAY_MS,
                timeout: 30000,
            });

            // ── Connection Events ────────────────────────
            this.socket.on('connect', () => {
                console.log(`[Network] Connected! Socket ID: ${this.socket.id}`);
                this.connected = true;
                this.reconnectAttempts = 0;

                // Send join request
                this.socket.emit('player:join', { nickname, character });
            });

            // ── Join Response ────────────────────────────
            this.socket.on('join:success', (data) => {
                console.log('[Network] Join successful:', data);
                this.playerId = data.id;
                this.startPingMeasurement();
                resolve(data);
            });

            this.socket.on('join:error', (data) => {
                console.error('[Network] Join error:', data.message);
                reject(new Error(data.message));
            });

            // ── Game Events ──────────────────────────────
            this.socket.on('state:update', (data) => {
                this.emit('stateUpdate', data);
            });

            this.socket.on('player:joined', (data) => {
                this.emit('playerJoined', data);
            });

            this.socket.on('player:left', (data) => {
                this.emit('playerLeft', data);
            });

            this.socket.on('player:respawn', (data) => {
                this.emit('playerRespawn', data);
            });

            // ── Ping Response ────────────────────────────
            this.socket.on('ping:response', (sentTimestamp) => {
                this.ping = Date.now() - sentTimestamp;
            });

            // ── Disconnection ────────────────────────────
            this.socket.on('disconnect', (reason) => {
                console.log(`[Network] Disconnected: ${reason}`);
                this.connected = false;
                this.emit('disconnected', { reason });
            });

            this.socket.on('reconnect_attempt', (attempt) => {
                this.reconnectAttempts = attempt;
                console.log(`[Network] Reconnecting... attempt ${attempt}`);
                this.emit('reconnecting', { attempt });
            });

            this.socket.on('reconnect', () => {
                console.log('[Network] Reconnected!');
                this.connected = true;
                this.reconnectAttempts = 0;

                // Re-join the game
                this.socket.emit('player:join', { nickname, character });
                this.emit('reconnected');
            });

            this.socket.on('reconnect_failed', () => {
                console.error('[Network] Reconnection failed after max attempts.');
                this.emit('reconnectFailed');
            });

            this.socket.on('connect_error', (err) => {
                console.error('[Network] Connection error:', err.message);
                if (!this.connected && this.reconnectAttempts === 0) {
                    // First connection failed
                    reject(new Error(`Cannot connect to server: ${err.message}`));
                }
            });
        });
    }

    /**
     * Send player input to the server.
     */
    sendInput(dx, dy, attack, attackAngle) {
        if (!this.connected || !this.socket) return null;

        this.inputSequence++;

        const input = {
            seq: this.inputSequence,
            dx,
            dy,
            attack,
            attackAngle,
        };

        this.socket.emit('player:input', input);
        return input;
    }

    /**
     * Start periodic ping measurement.
     */
    startPingMeasurement() {
        if (this.pingInterval) clearInterval(this.pingInterval);

        this.pingInterval = setInterval(() => {
            if (this.connected && this.socket) {
                this.socket.emit('ping:check', Date.now());
            }
        }, GAME_CONFIG.PING_INTERVAL_MS);
    }

    /**
     * Disconnect from the server.
     */
    disconnect() {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }

        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }

        this.connected = false;
        this.playerId = null;
    }

    // ═══════════════════════════════════════════════════════════
    //  EVENT SYSTEM
    // ═══════════════════════════════════════════════════════════

    on(event, callback) {
        if (!this.callbacks.has(event)) {
            this.callbacks.set(event, []);
        }
        this.callbacks.get(event).push(callback);
    }

    off(event, callback) {
        const cbs = this.callbacks.get(event);
        if (cbs) {
            const index = cbs.indexOf(callback);
            if (index !== -1) cbs.splice(index, 1);
        }
    }

    emit(event, data) {
        const cbs = this.callbacks.get(event);
        if (cbs) {
            for (const cb of cbs) {
                cb(data);
            }
        }
    }
}
