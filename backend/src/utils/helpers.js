/**
 * ARENA CLASH — Server Helpers
 * 
 * Miscellaneous server-side utilities.
 */

/**
 * Clamp a value between min and max.
 */
export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
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
