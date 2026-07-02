/**
 * ARENA CLASH — HUD Scene
 * 
 * Runs as a parallel Phaser scene on top of GameScene.
 * Currently delegates to DOM-based HUD (in index.html).
 * This scene can be extended for in-canvas HUD elements.
 */

export class HUDScene extends Phaser.Scene {
    constructor() {
        super({ key: 'HUDScene' });
    }

    create() {
        console.log('[HUDScene] Started');

        // The HUD is primarily DOM-based (see index.html #hud-overlay)
        // This scene is reserved for any future in-canvas HUD elements
        // like floating damage numbers, minimap, etc.
    }

    update(time, delta) {
        // Reserved for future in-canvas HUD rendering
    }
}
