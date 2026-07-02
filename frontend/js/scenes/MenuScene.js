/**
 * ARENA CLASH — Menu Scene
 * 
 * Phaser scene that runs behind the HTML menu overlay.
 * Provides animated canvas background particles for visual flair.
 */

export class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        console.log('[MenuScene] Started');

        // Create animated background particles in the canvas
        this.createBackgroundParticles();

        // The actual menu UI is handled by DOM (index.html + main.js UIController)
        // We just provide a pretty animated background.
    }

    createBackgroundParticles() {
        const { width, height } = this.scale;

        // Floating particles
        this.bgParticles = [];
        for (let i = 0; i < 40; i++) {
            const particle = this.add.circle(
                Phaser.Math.Between(0, width),
                Phaser.Math.Between(0, height),
                Phaser.Math.Between(1, 3),
                0x6366f1,
                Phaser.Math.FloatBetween(0.1, 0.4)
            );

            particle.setData('speedX', Phaser.Math.FloatBetween(-0.3, 0.3));
            particle.setData('speedY', Phaser.Math.FloatBetween(-0.5, -0.1));
            particle.setData('pulse', Phaser.Math.FloatBetween(0, Math.PI * 2));
            this.bgParticles.push(particle);
        }

        // Handle resize
        this.scale.on('resize', (gameSize) => {
            // Particles will naturally loop back on screen via update wrapping
        });
    }

    update(time, delta) {
        const { width, height } = this.scale;

        // Animate floating particles
        for (const particle of this.bgParticles) {
            particle.x += particle.getData('speedX');
            particle.y += particle.getData('speedY');
            particle.setData('pulse', particle.getData('pulse') + 0.02);
            particle.setAlpha(0.15 + Math.sin(particle.getData('pulse')) * 0.15);

            // Wrap around screen
            if (particle.y < -10) particle.y = height + 10;
            if (particle.y > height + 10) particle.y = -10;
            if (particle.x < -10) particle.x = width + 10;
            if (particle.x > width + 10) particle.x = -10;
        }
    }
}
