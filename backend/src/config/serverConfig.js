/**
 * ARENA CLASH — Server Configuration
 * 
 * All authoritative game constants live here.
 * The client NEVER sees these values directly — only through server state updates.
 */

export const SERVER_CONFIG = {
    // Network
    PORT: parseInt(process.env.PORT, 10) || 3000,
    TICK_RATE: parseInt(process.env.TICK_RATE, 10) || 20, // Server updates per second
    TICK_INTERVAL_MS: 1000 / (parseInt(process.env.TICK_RATE, 10) || 20),

    // CORS
    CORS_ORIGINS: (process.env.CORS_ORIGIN || 'http://localhost:8080,http://localhost:5500,http://127.0.0.1:8080')
        .split(',')
        .map(s => s.trim()),

    // Map
    MAP_WIDTH: 3200,
    MAP_HEIGHT: 2400,
    TILE_SIZE: 64,

    // Players
    MAX_PLAYERS: parseInt(process.env.MAX_PLAYERS, 10) || 100,
    RESPAWN_TIME_MS: 3000,
    PLAYER_RADIUS: 20,
    PLAYER_PUSH_FORCE: 2.0,

    // Spawn points (spread across map)
    SPAWN_POINTS: [
        { x: 400, y: 400 },
        { x: 2800, y: 400 },
        { x: 400, y: 2000 },
        { x: 2800, y: 2000 },
        { x: 1600, y: 1200 },
        { x: 1000, y: 800 },
        { x: 2200, y: 800 },
        { x: 1000, y: 1600 },
        { x: 2200, y: 1600 },
        { x: 1600, y: 400 },
    ],

    // Anti-cheat
    SPEED_TOLERANCE: 1.3, // Allow 30% over max speed (lag compensation)
    MAX_INPUT_QUEUE: 60,  // Max queued inputs before dropping

    // King of the Hill Minigame
    KOTH_ZONE: { x: 1600, y: 1200, radius: 250 },
};

export default SERVER_CONFIG;
