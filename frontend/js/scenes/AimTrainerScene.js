export class AimTrainerScene extends Phaser.Scene {
    constructor() {
        super({ key: 'AimTrainerScene' });
    }

    create() {
        this.score = 0;
        this.timeLeft = 30;
        this.gameActive = true;
        
        const width = this.scale.width;
        const height = this.scale.height;

        // Background grid
        this.add.rectangle(0, 0, width, height, 0x11111a).setOrigin(0);
        this.grid = this.add.grid(width/2, height/2, width, height, 50, 50, 0x11111a, 1, 0x3a3a5a, 0.2);

        // UI
        this.scoreText = this.add.text(20, 20, 'Счет: 0', {
            fontFamily: 'Orbitron', fontSize: '24px', color: '#4ade80'
        });

        this.timeText = this.add.text(width - 20, 20, 'Время: 30', {
            fontFamily: 'Orbitron', fontSize: '24px', color: '#f87171'
        }).setOrigin(1, 0);

        this.highScore = localStorage.getItem('aimHighScore') || 0;
        this.highScoreText = this.add.text(width/2, 20, `Рекорд: ${this.highScore}`, {
            fontFamily: 'Orbitron', fontSize: '20px', color: '#a0a0ff'
        }).setOrigin(0.5, 0);

        // Exit button
        const exitBtn = this.add.text(width/2, height - 30, '[ВЫХОД]', {
            fontFamily: 'Orbitron', fontSize: '24px', color: '#ffffff'
        }).setOrigin(0.5).setInteractive();
        
        exitBtn.on('pointerdown', () => this.exitGame());
        exitBtn.on('pointerover', () => exitBtn.setColor('#f87171'));
        exitBtn.on('pointerout', () => exitBtn.setColor('#ffffff'));

        // Timer event
        this.time.addEvent({
            delay: 1000,
            callback: this.tickTimer,
            callbackScope: this,
            loop: true
        });

        // Target group
        this.targets = this.add.group();
        
        // Spawn first target
        this.spawnTarget();
    }

    tickTimer() {
        if (!this.gameActive) return;
        this.timeLeft--;
        this.timeText.setText(`Время: ${this.timeLeft}`);
        if (this.timeLeft <= 0) {
            this.endGame();
        }
    }

    spawnTarget() {
        if (!this.gameActive) return;

        const margin = 100;
        const x = Phaser.Math.Between(margin, this.scale.width - margin);
        const y = Phaser.Math.Between(margin, this.scale.height - margin);

        const target = this.add.circle(x, y, 30, 0xef4444);
        target.setStrokeStyle(4, 0xffffff);
        target.setInteractive();

        // Spawn animation
        target.setScale(0);
        this.tweens.add({
            targets: target,
            scale: 1,
            duration: 200,
            ease: 'Back.easeOut'
        });

        target.on('pointerdown', () => {
            if (!this.gameActive) return;
            this.score++;
            this.scoreText.setText(`Счет: ${this.score}`);
            
            // Particles
            if (this.scene.get('GameScene').particleManager) {
                // If we imported particle manager here it would be good, 
                // but let's just make a simple local particle
                this.createExplosion(target.x, target.y);
            } else {
                this.createExplosion(target.x, target.y);
            }
            
            target.destroy();
            
            // Spawn next immediately
            this.spawnTarget();
            
            // Sometimes spawn a second one to increase difficulty
            if (this.score % 10 === 0) {
                this.spawnTarget();
            }
        });

        this.targets.add(target);
    }

    createExplosion(x, y) {
        const particles = this.add.particles(x, y, 'obj_rock', { // just using some existing texture or rect
            speed: { min: 50, max: 200 },
            scale: { start: 0.2, end: 0 },
            alpha: { start: 1, end: 0 },
            lifespan: 400,
            quantity: 10,
            blendMode: 'ADD'
        });
        particles.explode();
    }

    endGame() {
        this.gameActive = false;
        this.targets.clear(true, true);
        
        if (this.score > this.highScore) {
            localStorage.setItem('aimHighScore', this.score);
            this.highScoreText.setText(`НОВЫЙ РЕКОРД: ${this.score}!`);
            this.highScoreText.setColor('#fbbf24');
        }

        const go = this.add.text(this.scale.width/2, this.scale.height/2, 'ВРЕМЯ ВЫШЛО!', {
            fontFamily: 'Orbitron', fontSize: '48px', color: '#f87171', stroke: '#000', strokeThickness: 6
        }).setOrigin(0.5);

        this.tweens.add({
            targets: go,
            scale: { from: 0.5, to: 1.2 },
            yoyo: true,
            duration: 300,
            ease: 'Sine.easeInOut'
        });
    }

    exitGame() {
        document.getElementById('menu-overlay').classList.add('active');
        this.scene.start('MenuScene');
    }
}
