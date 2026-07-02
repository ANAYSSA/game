/**
 * ARENA CLASH — Game Server
 * 
 * Express HTTP + Socket.IO WebSocket server.
 * Handles connections, runs the authoritative game loop,
 * and broadcasts state to all connected clients.
 */

import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { SERVER_CONFIG } from './config/serverConfig.js';
import { GameLoop } from './game/GameLoop.js';
import { GameState } from './game/GameState.js';
import { SocketHandler } from './network/SocketHandler.js';

// ─── Express App ─────────────────────────────────────────────
const app = express();
const httpServer = createServer(app);

// ─── CORS Configuration ─────────────────────────────────────
const isDev = (process.env.NODE_ENV || 'development') === 'development';
const corsOrigins = isDev ? '*' : SERVER_CONFIG.CORS_ORIGINS;

// ─── Socket.IO Server ────────────────────────────────────────
const io = new SocketIOServer(httpServer, {
    cors: {
        origin: corsOrigins,
        methods: ['GET', 'POST'],
        credentials: true,
    },
    // Performance tuning
    pingInterval: 10000,
    pingTimeout: 5000,
    maxHttpBufferSize: 1e6, // 1 MB max message
    transports: ['websocket', 'polling'],
});

// ─── Health Endpoint ─────────────────────────────────────────
app.get('/', (req, res) => {
    res.json({
        name: 'ARENA CLASH Server',
        status: 'online',
        players: gameState.getPlayerCount(),
        uptime: Math.floor(process.uptime()),
        tick_rate: SERVER_CONFIG.TICK_RATE,
    });
});

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// ─── Game State & Loop ───────────────────────────────────────
const gameState = new GameState();
const gameLoop = new GameLoop(gameState, io);

// ─── Socket Handler ──────────────────────────────────────────
const socketHandler = new SocketHandler(io, gameState);

// ─── Start Server ────────────────────────────────────────────
const PORT = SERVER_CONFIG.PORT;

httpServer.listen(PORT, () => {
    console.log('═══════════════════════════════════════════');
    console.log('  ARENA CLASH — Game Server');
    console.log(`  Port: ${PORT}`);
    console.log(`  Tick Rate: ${SERVER_CONFIG.TICK_RATE} Hz`);
    console.log(`  Max Players: ${SERVER_CONFIG.MAX_PLAYERS}`);
    console.log(`  CORS Origins: ${Array.isArray(corsOrigins) ? corsOrigins.join(', ') : corsOrigins}`);
    console.log(`  Map: ${SERVER_CONFIG.MAP_WIDTH}×${SERVER_CONFIG.MAP_HEIGHT}`);
    console.log('═══════════════════════════════════════════');

    // Start the authoritative game loop
    gameLoop.start();
});

// ─── Graceful Shutdown ───────────────────────────────────────
process.on('SIGTERM', () => {
    console.log('[Server] SIGTERM received. Shutting down...');
    gameLoop.stop();
    io.close();
    httpServer.close(() => {
        console.log('[Server] Closed.');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('[Server] SIGINT received. Shutting down...');
    gameLoop.stop();
    io.close();
    httpServer.close(() => {
        console.log('[Server] Closed.');
        process.exit(0);
    });
});

export { io, gameState };
