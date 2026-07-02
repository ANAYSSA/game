/**
 * ARENA CLASH — Server Spatial Grid
 * 
 * Server-side spatial partitioning for O(n) broad-phase collision detection
 * instead of O(n²) brute-force checks.
 */

export class SpatialGrid {
    constructor(cellSize = 200) {
        this.cellSize = cellSize;
        this.grid = new Map();
    }

    clear() {
        this.grid.clear();
    }

    getKey(x, y) {
        const cx = Math.floor(x / this.cellSize);
        const cy = Math.floor(y / this.cellSize);
        return `${cx},${cy}`;
    }

    insert(entity) {
        const key = this.getKey(entity.x, entity.y);
        if (!this.grid.has(key)) {
            this.grid.set(key, []);
        }
        this.grid.get(key).push(entity);
    }

    /**
     * Get all entities near a given position (same cell + 8 neighbors).
     */
    getNearby(x, y) {
        const cx = Math.floor(x / this.cellSize);
        const cy = Math.floor(y / this.cellSize);
        const results = [];

        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                const key = `${cx + dx},${cy + dy}`;
                const cell = this.grid.get(key);
                if (cell) {
                    results.push(...cell);
                }
            }
        }

        return results;
    }
}
