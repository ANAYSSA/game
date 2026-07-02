/**
 * ARENA CLASH — Helpers
 * 
 * Miscellaneous utility functions used across the frontend.
 */

/**
 * Clamp a value between min and max.
 */
export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

/**
 * Linear interpolation between a and b by factor t (0-1).
 */
export function lerp(a, b, t) {
    return a + (b - a) * t;
}

/**
 * Calculate distance between two points.
 */
export function distance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Normalize an angle to [-PI, PI].
 */
export function normalizeAngle(angle) {
    while (angle > Math.PI) angle -= Math.PI * 2;
    while (angle < -Math.PI) angle += Math.PI * 2;
    return angle;
}

/**
 * Generate a random integer between min and max (inclusive).
 */
export function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate a random float between min and max.
 */
export function randomFloat(min, max) {
    return Math.random() * (max - min) + min;
}

/**
 * Format a number as a short string (e.g. 1000 → 1k).
 */
export function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
}

/**
 * Debounce a function call.
 */
export function debounce(fn, delay) {
    let timer = null;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

/**
 * Check if the device is likely a mobile device.
 */
export function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        || ('ontouchstart' in window);
}
