/**
 * ARENA CLASH — Object Pool
 * 
 * Generic reusable object pool to avoid garbage collection spikes.
 * Used for projectiles, particles, and other frequently created/destroyed objects.
 */

export class ObjectPool {
    /**
     * @param {Function} createFn - Factory function to create a new object
     * @param {Function} resetFn - Function to reset an object for reuse
     * @param {number} initialSize - Number of objects to pre-allocate
     */
    constructor(createFn, resetFn, initialSize = 10) {
        this.createFn = createFn;
        this.resetFn = resetFn;
        this.pool = [];
        this.active = [];

        // Pre-allocate
        for (let i = 0; i < initialSize; i++) {
            this.pool.push(this.createFn());
        }
    }

    /**
     * Get an object from the pool (or create new if pool is empty).
     */
    acquire(...args) {
        let obj;

        if (this.pool.length > 0) {
            obj = this.pool.pop();
        } else {
            obj = this.createFn();
        }

        this.resetFn(obj, ...args);
        this.active.push(obj);
        return obj;
    }

    /**
     * Return an object to the pool.
     */
    release(obj) {
        const index = this.active.indexOf(obj);
        if (index !== -1) {
            this.active.splice(index, 1);
            this.pool.push(obj);
        }
    }

    /**
     * Get count of active objects.
     */
    get activeCount() {
        return this.active.length;
    }

    /**
     * Get count of available objects in pool.
     */
    get availableCount() {
        return this.pool.length;
    }

    /**
     * Release all active objects back to pool.
     */
    releaseAll() {
        while (this.active.length > 0) {
            this.pool.push(this.active.pop());
        }
    }
}
