/**
 * ARENA CLASH — Frontend Game Configuration
 * 
 * Client-side constants for Phaser, rendering, and network connection.
 * NO gameplay-affecting values here — those live on the server.
 */

export const GAME_CONFIG = {
    // Game identity
    TITLE: 'ARENA CLASH',
    VERSION: '1.0.0',

    // Server connection
    // Change this to your Render.com URL in production
    SERVER_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3000'
        : 'https://arena-clash-server.onrender.com', // ← Replace with your Render URL

    // Phaser renderer settings
    GAME_WIDTH: 1280,
    GAME_HEIGHT: 720,
    PIXEL_ART: false,
    ANTIALIAS: true,
    BACKGROUND_COLOR: '#1a1a2e',

    // Map (client-side rendering info, matches server)
    MAP_WIDTH: 3200,
    MAP_HEIGHT: 2400,
    TILE_SIZE: 64,

    // Camera
    CAMERA_ZOOM: 1.0,
    CAMERA_LERP: 0.1, // Smooth camera follow

    // Rendering
    MAX_FPS: 60,

    // Network tuning
    INTERPOLATION_DELAY_MS: 100,  // Render 100ms behind server (smoothness)
    INPUT_SEND_RATE_MS: 50,        // Send input every 50ms (20 Hz, matches server)
    RECONNECT_DELAY_MS: 1000,      // Initial reconnect delay
    RECONNECT_MAX_DELAY_MS: 30000, // Max reconnect delay
    PING_INTERVAL_MS: 2000,        // Measure ping every 2 seconds

    // UI
    NAMEPLATE_OFFSET_Y: -40,
    HP_BAR_WIDTH: 50,
    HP_BAR_HEIGHT: 6,
    HP_BAR_OFFSET_Y: -30,

    // Mobile detection
    IS_MOBILE: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        || ('ontouchstart' in window),
};

export default GAME_CONFIG;
