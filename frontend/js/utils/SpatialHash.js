/**
 * ARENA CLASH — Spatial Hash (Client)
 * 
 * Spatial partitioning for efficient entity culling.
 * Only entities within/near the camera viewport are rendered.
 */

export class SpatialHash {
    /**
     * @param {number} cellSize - Size of each grid cell in pixels
     */
    constructor(cellSize = 200) {
        this.cellSize = cellSize;
        this.grid = new Map();
    }

    /**
     * Clear all cells.
     */
    clear() {
        this.grid.clear();
    }

    /**
     * Get the cell key for a position.
     */
    getKey(x, y) {
        const cx = Math.floor(x / this.cellSize);
        const cy = Math.floor(y / this.cellSize);
        return `${cx},${cy}`;
    }

    /**
     * Insert an entity into the grid.
     */
    insert(entity) {
        const key = this.getKey(entity.x, entity.y);
        if (!this.grid.has(key)) {
            this.grid.set(key, []);
        }
        this.grid.get(key).push(entity);
    }

    /**
     * Query all entities within a rectangle (camera viewport + margin).
     */
    queryRect(x, y, width, height) {
        const results = [];
        const margin = this.cellSize;

        const minCX = Math.floor((x - margin) / this.cellSize);
        const minCY = Math.floor((y - margin) / this.cellSize);
        const maxCX = Math.floor((x + width + margin) / this.cellSize);
        const maxCY = Math.floor((y + height + margin) / this.cellSize);

        for (let cx = minCX; cx <= maxCX; cx++) {
            for (let cy = minCY; cy <= maxCY; cy++) {
                const key = `${cx},${cy}`;
                const cell = this.grid.get(key);
                if (cell) {
                    results.push(...cell);
                }
            }
        }

        return results;
    }

    /**
     * Query all entities within a radius of a point.
     */
    queryRadius(x, y, radius) {
        const results = [];
        const minCX = Math.floor((x - radius) / this.cellSize);
        const minCY = Math.floor((y - radius) / this.cellSize);
        const maxCX = Math.floor((x + radius) / this.cellSize);
        const maxCY = Math.floor((y + radius) / this.cellSize);

        const radiusSq = radius * radius;

        for (let cx = minCX; cx <= maxCX; cx++) {
            for (let cy = minCY; cy <= maxCY; cy++) {
                const key = `${cx},${cy}`;
                const cell = this.grid.get(key);
                if (cell) {
                    for (const entity of cell) {
                        const dx = entity.x - x;
                        const dy = entity.y - y;
                        if (dx * dx + dy * dy <= radiusSq) {
                            results.push(entity);
                        }
                    }
                }
            }
        }

        return results;
    }
}
