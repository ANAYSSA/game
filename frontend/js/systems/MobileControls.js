/**
 * ARENA CLASH — Mobile Controls
 * 
 * Custom virtual joystick (left side) and attack button (right side).
 * No external dependencies — pure DOM touch event handling.
 */

export class MobileControls {
    constructor(inputManager) {
        this.inputManager = inputManager;

        // Joystick state
        this.joystickActive = false;
        this.joystickStartX = 0;
        this.joystickStartY = 0;
        this.joystickDx = 0;
        this.joystickDy = 0;
        this.joystickTouchId = null;

        // Attack state
        this.attackQueued = false;
        this.attackPressed = false;
        this.attackTouchId = null;

        // DOM elements
        this.joystickZone = document.getElementById('joystick-zone');
        this.joystickBase = document.getElementById('joystick-base');
        this.joystickThumb = document.getElementById('joystick-thumb');
        this.attackButton = document.getElementById('attack-button');

        // Config
        this.maxRadius = 55; // max thumb offset from center

        this.bindEvents();
    }

    bindEvents() {
        // ── Joystick ──────────────────────────────────────
        this.joystickZone.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.changedTouches[0];
            this.joystickTouchId = touch.identifier;
            this.joystickActive = true;

            // Position base at touch point
            const rect = this.joystickZone.getBoundingClientRect();
            this.joystickStartX = touch.clientX - rect.left;
            this.joystickStartY = touch.clientY - rect.top;

            this.joystickBase.style.left = this.joystickStartX + 'px';
            this.joystickBase.style.top = this.joystickStartY + 'px';
            this.joystickBase.style.transform = 'translate(-50%, -50%)';
            this.joystickBase.style.opacity = '1';
        }, { passive: false });

        this.joystickZone.addEventListener('touchmove', (e) => {
            e.preventDefault();
            for (const touch of e.changedTouches) {
                if (touch.identifier === this.joystickTouchId) {
                    const rect = this.joystickZone.getBoundingClientRect();
                    const currentX = touch.clientX - rect.left;
                    const currentY = touch.clientY - rect.top;

                    let dx = currentX - this.joystickStartX;
                    let dy = currentY - this.joystickStartY;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    // Clamp to max radius
                    if (dist > this.maxRadius) {
                        dx = (dx / dist) * this.maxRadius;
                        dy = (dy / dist) * this.maxRadius;
                    }

                    // Update thumb position
                    this.joystickThumb.style.transform = `translate(${dx}px, ${dy}px)`;

                    // Normalize to -1 to 1
                    this.joystickDx = dx / this.maxRadius;
                    this.joystickDy = dy / this.maxRadius;

                    // Apply dead zone
                    const magnitude = Math.sqrt(this.joystickDx ** 2 + this.joystickDy ** 2);
                    if (magnitude < 0.15) {
                        this.joystickDx = 0;
                        this.joystickDy = 0;
                    }
                }
            }
        }, { passive: false });

        const resetJoystick = (e) => {
            for (const touch of e.changedTouches) {
                if (touch.identifier === this.joystickTouchId) {
                    this.joystickActive = false;
                    this.joystickTouchId = null;
                    this.joystickDx = 0;
                    this.joystickDy = 0;
                    this.joystickThumb.style.transform = 'translate(0, 0)';
                    this.joystickBase.style.opacity = '0.7';
                }
            }
        };

        this.joystickZone.addEventListener('touchend', resetJoystick, { passive: false });
        this.joystickZone.addEventListener('touchcancel', resetJoystick, { passive: false });

        // ── Attack Button ─────────────────────────────────
        this.attackButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.attackQueued = true;
            this.attackPressed = true;
            this.attackButton.style.background = 'rgba(239, 68, 68, 0.7)';
        }, { passive: false });

        this.attackButton.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.attackPressed = false;
            this.attackButton.style.background = 'rgba(239, 68, 68, 0.3)';
        }, { passive: false });
        
        this.attackButton.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            this.attackPressed = false;
            this.attackButton.style.background = 'rgba(239, 68, 68, 0.3)';
        }, { passive: false });
    }

    getJoystickData() {
        return {
            dx: this.joystickDx,
            dy: this.joystickDy,
            active: this.joystickActive,
        };
    }

    consumeAttack() {
        if (this.attackQueued) {
            this.attackQueued = false;
            return true;
        }
        return this.attackPressed;
    }

    setCooldownState(onCooldown) {
        if (this.attackButton) {
            this.attackButton.classList.toggle('on-cooldown', onCooldown);
        }
    }

    destroy() {
        // Events are GC'd with elements since we don't remove them separately
        const mobileUI = document.getElementById('mobile-controls');
        if (mobileUI) mobileUI.style.display = 'none';
    }
}
