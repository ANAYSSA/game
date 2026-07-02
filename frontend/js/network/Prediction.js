/**
 * ARENA CLASH — Client-Side Prediction
 * 
 * Applies player inputs locally for instant responsiveness,
 * then reconciles with server state when authoritative updates arrive.
 */

export class ClientPrediction {
    constructor() {
        /** @type {Array<{seq: number, dx: number, dy: number, dt: number}>} */
        this.pendingInputs = [];
        this.maxPendingInputs = 120;
    }

    /**
     * Record an input that was sent to the server.
     */
    addInput(input, dt) {
        this.pendingInputs.push({
            seq: input.seq,
            dx: input.dx,
            dy: input.dy,
            dt,
        });

        // Prevent memory leak
        if (this.pendingInputs.length > this.maxPendingInputs) {
            this.pendingInputs.shift();
        }
    }

    /**
     * Apply prediction: move the local player sprite immediately.
     * Returns the predicted position delta.
     */
    applyInput(input, speed, dt) {
        let dx = input.dx || 0;
        let dy = input.dy || 0;
        const magnitude = Math.sqrt(dx * dx + dy * dy);

        if (magnitude > 0) {
            dx = (dx / magnitude) * speed * dt;
            dy = (dy / magnitude) * speed * dt;
        }

        return { dx, dy };
    }

    /**
     * Reconcile with server state.
     * When we receive the server's authoritative position + lastProcessedInput,
     * we discard all inputs up to that sequence number and re-apply
     * any inputs the server hasn't processed yet.
     * 
     * @param {number} serverX - Server authoritative X
     * @param {number} serverY - Server authoritative Y
     * @param {number} lastProcessedInput - Last input seq the server processed
     * @param {number} speed - Character speed (px/s)
     * @returns {{x: number, y: number}} - Reconciled position
     */
    reconcile(serverX, serverY, lastProcessedInput, speed) {
        // Remove all inputs that the server has already processed
        this.pendingInputs = this.pendingInputs.filter(
            input => input.seq > lastProcessedInput
        );

        // Start from server position
        let x = serverX;
        let y = serverY;

        // Re-apply all unprocessed inputs
        for (const input of this.pendingInputs) {
            const delta = this.applyInput(input, speed, input.dt);
            x += delta.dx;
            y += delta.dy;
        }

        return { x, y };
    }

    /**
     * Clear all pending inputs.
     */
    clear() {
        this.pendingInputs = [];
    }
}
