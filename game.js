// Space Warriors - JavaScript Port
// Constants
const WIDTH = 1600;
const HEIGHT = 900;
const FPS = 60;

// Colors
const BLACK = '#000000';
const WHITE = '#ffffff';
const BLUE = '#0000ff';
const YELLOW = '#ffff00';
const RED = '#ff0000';
const GREEN = '#00ff00';
const CYAN = '#00ffff';

const PLAYER_COLOR = BLUE;
const PROJECTILE_COLOR = WHITE;
const ENEMY_COLOR = RED;
const PROJ_SPEED = 25;

// Vector2 class to replace pygame.Vector2
class Vector2 {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    copy() {
        return new Vector2(this.x, this.y);
    }

    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    normalize() {
        const len = this.length();
        if (len === 0) return new Vector2(0, 0);
        return new Vector2(this.x / len, this.y / len);
    }

    rotate(angle) {
        const rad = angle * Math.PI / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        return new Vector2(
            this.x * cos - this.y * sin,
            this.x * sin + this.y * cos
        );
    }

    add(other) {
        return new Vector2(this.x + other.x, this.y + other.y);
    }

    subtract(other) {
        return new Vector2(this.x - other.x, this.y - other.y);
    }

    multiply(scalar) {
        return new Vector2(this.x * scalar, this.y * scalar);
    }

    static add(a, b) {
        return new Vector2(a.x + b.x, a.y + b.y);
    }

    static subtract(a, b) {
        return new Vector2(a.x - b.x, a.y - b.y);
    }
}

// Star class for background
class Star {
    constructor(worldPos) {
        this.worldPos = new Vector2(worldPos.x, worldPos.y);
        this.radius = Math.floor(Math.random() * 3) + 1;
    }

    draw(ctx, cameraOffset) {
        const screenPos = Vector2.subtract(this.worldPos, cameraOffset);
        if (screenPos.x > -50 && screenPos.x < WIDTH + 50 &&
            screenPos.y > -50 && screenPos.y < HEIGHT + 50) {
            ctx.fillStyle = YELLOW;
            ctx.beginPath();
            ctx.arc(screenPos.x, screenPos.y, this.radius, 0, 2 * Math.PI);
            ctx.fill();
        }
    }
}

// Char class - Player
class Char {
    static playerImage = null;

    constructor(color, size, pos, vel, angle = 0) {
        this.color = color;
        this.originalSize = new Vector2(size[0], size[1]);
        this.pos = new Vector2(pos[0], pos[1]);
        this.vel = new Vector2(vel[0], vel[1]);
        this.angle = angle;
        this.maxSpeed = 8.0;
        this.deceleration = 0.98;
        this.shootingVelocity = 5;
        this.health = 100;
        this.maxHealth = 100;

        // Rotational physics
        this.angularVelocity = 0.0;
        this.maxAngularVelocity = 4.0;
        this.angularDeceleration = 0.92;
        this.angularAcceleration = 0.3;

        // Set up sprite properties
        this.spriteSize = [16, 15];
        this.scaledSize = [64, 60];
        this.size = new Vector2(this.scaledSize[0], this.scaledSize[1]);

        // Power-up state
        this.tripleShotActive = false;
        this.tripleShotTimer = 0;

        // Load player image
        if (!Char.playerImage) {
            Char.playerImage = new Image();
            Char.playerImage.src = 'player.png';
        }
    }

    update() {
        // Apply deceleration
        this.vel.x *= this.deceleration;
        this.vel.y *= this.deceleration;

        // Stop very small velocities
        if (this.vel.length() < 0.01) {
            this.vel = new Vector2(0, 0);
        }

        // Apply angular deceleration
        this.angularVelocity *= this.angularDeceleration;

        // Stop very small angular velocities
        if (Math.abs(this.angularVelocity) < 0.01) {
            this.angularVelocity = 0.0;
        }

        // Apply angular velocity to angle
        this.angle += this.angularVelocity;

        // Move in current velocity direction
        this.pos.x += this.vel.x;
        this.pos.y += this.vel.y;

        // Update power-up states
        if (this.tripleShotActive) {
            this.tripleShotTimer -= 1;
            if (this.tripleShotTimer <= 0) {
                this.deactivateTripleShot();
            }
        }
    }

    rotate(deltaAngle) {
        this.angularVelocity += deltaAngle * this.angularAcceleration;

        if (this.angularVelocity > this.maxAngularVelocity) {
            this.angularVelocity = this.maxAngularVelocity;
        } else if (this.angularVelocity < -this.maxAngularVelocity) {
            this.angularVelocity = -this.maxAngularVelocity;
        }
    }

    accelerate(speed) {
        const rad = this.angle * Math.PI / 180;
        this.vel.x += Math.cos(rad) * speed;
        this.vel.y += Math.sin(rad) * speed;

        if (this.vel.length() > this.maxSpeed) {
            const normalized = this.vel.normalize();
            this.vel = normalized.multiply(this.maxSpeed);
        }
    }

    draw(ctx, cameraOffset) {
        const screenPos = new Vector2(WIDTH / 2, HEIGHT / 2);

        if (Char.playerImage && Char.playerImage.complete) {
            ctx.save();
            ctx.translate(screenPos.x, screenPos.y);
            ctx.rotate(this.angle * Math.PI / 180);
            ctx.drawImage(Char.playerImage, -this.scaledSize[0]/2, -this.scaledSize[1]/2,
                         this.scaledSize[0], this.scaledSize[1]);
            ctx.restore();
        } else {
            // Fallback triangle
            const points = [
                new Vector2(this.originalSize.x, 0),
                new Vector2(-this.originalSize.x / 2, -this.originalSize.y / 2),
                new Vector2(-this.originalSize.x / 2, this.originalSize.y / 2)
            ];

            ctx.fillStyle = this.color;
            ctx.beginPath();
            const rotated = points.map(p => Vector2.add(screenPos, p.rotate(this.angle)));
            ctx.moveTo(rotated[0].x, rotated[0].y);
            for (let i = 1; i < rotated.length; i++) {
                ctx.lineTo(rotated[i].x, rotated[i].y);
            }
            ctx.closePath();
            ctx.fill();
        }
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health < 0) {
            this.health = 0;
        }
    }

    activateTripleShot() {
        this.tripleShotActive = true;
        this.tripleShotTimer = 600; // 10 seconds at 60 FPS
    }

    deactivateTripleShot() {
        this.tripleShotActive = false;
    }
}

// Enemy class
class Enemy {
    static batImage = null;

    constructor(color, size, pos, vel, angle = 0, health = 30) {
        this.color = color;
        this.size = new Vector2(size[0], size[1]);
        this.pos = new Vector2(pos[0], pos[1]);
        this.vel = new Vector2(vel[0], vel[1]);
        this.angle = angle;
        this.maxSpeed = 2.0;
        this.deceleration = 0.95;
        this.health = health;
        this.maxHealth = health;

        const sizeFactor = (size[0] + size[1]) / 32;
        this.damage = Math.floor(8 * sizeFactor);
        this.projectileSpeed = 8;
        this.visionRange = 800;

        if (!Enemy.batImage) {
            Enemy.batImage = new Image();
            Enemy.batImage.src = 'enemy_bat.png';
        }
    }

    update(playerPos) {
        const direction = Vector2.subtract(playerPos, this.pos);
        if (direction.length() > 0) {
            const normalized = direction.normalize();
            this.vel.x += normalized.x * 0.03;
            this.vel.y += normalized.y * 0.03;
        }

        this.vel.x *= this.deceleration;
        this.vel.y *= this.deceleration;

        if (this.vel.length() < 0.01) {
            this.vel = new Vector2(0, 0);
        }

        if (this.vel.length() > this.maxSpeed) {
            const normalized = this.vel.normalize();
            this.vel = normalized.multiply(this.maxSpeed);
        }

        this.pos.x += this.vel.x;
        this.pos.y += this.vel.y;
    }

    draw(ctx, cameraOffset) {
        const screenPos = Vector2.subtract(this.pos, cameraOffset);

        if (screenPos.x > -100 && screenPos.x < WIDTH + 100 &&
            screenPos.y > -100 && screenPos.y < HEIGHT + 100) {

            if (Enemy.batImage && Enemy.batImage.complete) {
                ctx.save();
                ctx.translate(screenPos.x, screenPos.y);
                ctx.rotate(this.angle * Math.PI / 180);
                ctx.drawImage(Enemy.batImage, -this.size.x, -this.size.y,
                             this.size.x * 2, this.size.y * 2);
                ctx.restore();
            } else {
                // Fallback triangle
                const points = [
                    new Vector2(this.size.x, 0),
                    new Vector2(-this.size.x / 2, -this.size.y / 2),
                    new Vector2(-this.size.x / 2, this.size.y / 2)
                ];

                ctx.fillStyle = this.color;
                ctx.beginPath();
                const rotated = points.map(p => Vector2.add(screenPos, p.rotate(this.angle)));
                ctx.moveTo(rotated[0].x, rotated[0].y);
                for (let i = 1; i < rotated.length; i++) {
                    ctx.lineTo(rotated[i].x, rotated[i].y);
                }
                ctx.closePath();
                ctx.fill();
            }
        }
    }

    canSeePlayer(playerPos) {
        const distance = Vector2.subtract(playerPos, this.pos).length();
        return distance <= this.visionRange;
    }

    shoot(targetPos, projectileList) {
        if (!this.canSeePlayer(targetPos)) {
            return;
        }

        const direction = Vector2.subtract(targetPos, this.pos);
        if (direction.length() > 0) {
            const normalized = direction.normalize();

            const spreadAngle = (Math.random() - 0.5) * 1.0; // ±0.5 radians
            const cos = Math.cos(spreadAngle);
            const sin = Math.sin(spreadAngle);

            const spreadDirection = new Vector2(
                normalized.x * cos - normalized.y * sin,
                normalized.x * sin + normalized.y * cos
            );

            const projectileVel = spreadDirection.multiply(this.projectileSpeed);
            const projectile = new Projectile(RED, this.pos.copy(), projectileVel);
            projectile.damage = this.damage;
            projectileList.push(projectile);
        }
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health < 0) {
            this.health = 0;
        }
    }
}

// Projectile class
class Projectile {
    constructor(color, pos, vel, length = 10) {
        this.color = color;
        this.pos = pos.copy();
        this.vel = vel.copy();
        this.length = length;
        this.lifetime = 300;
        this.damage = 10; // Default damage
    }

    update() {
        this.pos.x += this.vel.x;
        this.pos.y += this.vel.y;
        this.lifetime -= 1;
        return this.lifetime > 0;
    }

    draw(ctx, cameraOffset) {
        const screenPos = Vector2.subtract(this.pos, cameraOffset);

        if (screenPos.x > -20 && screenPos.x < WIDTH + 20 &&
            screenPos.y > -20 && screenPos.y < HEIGHT + 20) {

            if (this.vel.length() > 0) {
                const direction = this.vel.normalize();
                const halfLength = this.length / 2;
                const startPos = Vector2.subtract(screenPos, direction.multiply(halfLength));
                const endPos = Vector2.add(screenPos, direction.multiply(halfLength));

                ctx.strokeStyle = this.color;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(startPos.x, startPos.y);
                ctx.lineTo(endPos.x, endPos.y);
                ctx.stroke();
            }
        }
    }
}

// Powerup class
class Powerup {
    constructor(powerupType, pos) {
        this.type = powerupType;
        this.pos = new Vector2(pos[0], pos[1]);
        this.size = 12;
        this.collected = false;
    }

    draw(ctx, cameraOffset) {
        const screenPos = Vector2.subtract(this.pos, cameraOffset);

        if (screenPos.x > -50 && screenPos.x < WIDTH + 50 &&
            screenPos.y > -50 && screenPos.y < HEIGHT + 50) {

            if (this.type === "triple_shot") {
                ctx.strokeStyle = CYAN;
                ctx.lineWidth = 3;

                // Horizontal line
                ctx.beginPath();
                ctx.moveTo(screenPos.x - this.size/2, screenPos.y);
                ctx.lineTo(screenPos.x + this.size/2, screenPos.y);
                ctx.stroke();

                // Vertical line
                ctx.beginPath();
                ctx.moveTo(screenPos.x, screenPos.y - this.size/2);
                ctx.lineTo(screenPos.x, screenPos.y + this.size/2);
                ctx.stroke();
            }
        }
    }

    checkCollision(playerPos, playerSize) {
        const distance = Vector2.subtract(this.pos, playerPos).length();
        return distance < (this.size + playerSize.x / 2);
    }
}

// Main Game class
class Game {
    constructor(width, height, fps) {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = width;
        this.height = height;
        this.fps = fps;
        this.running = true;
        this.gameOver = false;

        this.backgroundColor = '#001428';
        this.char = new Char(BLUE, [30, 15], [400, 400], [0, 0], 0);
        this.projectiles = [];
        this.enemies = [];
        this.enemyProjectiles = [];
        this.powerups = [];
        this.powerupSpawnTimer = 0;
        this.powerupSpawnInterval = 600;
        this.enemySpawnTimer = 0;
        this.enemySpawnInterval = 180;

        // Damage flash effect
        this.damageFlashTimer = 0;
        this.damageFlashDuration = 10;

        // Camera system
        this.cameraOffset = new Vector2(0, 0);

        // Score system
        this.score = 0;
        this.damageBonus = 1;
        this.killBonus = 50;

        // Generate stars
        this.stars = [];
        for (let i = 0; i < 200; i++) {
            const starX = (Math.random() - 0.5) * 4000;
            const starY = (Math.random() - 0.5) * 4000;
            this.stars.push(new Star(new Vector2(starX, starY)));
        }

        // Input handling
        this.keys = {};
        this.setupEventListeners();

        // Start game loop
        this.gameLoop();
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;

            if (e.code === 'Space' && !this.gameOver) {
                e.preventDefault();
                this.fireProjectile();
            } else if (e.code === 'KeyR' && this.gameOver) {
                this.restartGame();
            } else if (e.code === 'Escape') {
                this.running = false;
            }
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }

    spawnEnemy() {
        const angle = Math.random() * 2 * Math.PI;
        const distance = Math.random() * 400 + 800;
        const enemyX = this.char.pos.x + Math.cos(angle) * distance;
        const enemyY = this.char.pos.y + Math.sin(angle) * distance;

        const sizeMultiplier = Math.random() * 0.8 + 0.7;
        const enemySize = [20 * sizeMultiplier, 12 * sizeMultiplier];
        const enemyHealth = Math.floor(30 * sizeMultiplier);

        const enemy = new Enemy(RED, enemySize, [enemyX, enemyY], [0, 0], 0, enemyHealth);
        this.enemies.push(enemy);
    }

    spawnPowerup() {
        const angle = Math.random() * 2 * Math.PI;
        const distance = Math.random() * 500 + 500;
        const powerupX = this.char.pos.x + Math.cos(angle) * distance;
        const powerupY = this.char.pos.y + Math.sin(angle) * distance;

        const powerup = new Powerup("triple_shot", [powerupX, powerupY]);
        this.powerups.push(powerup);
    }

    updateCamera() {
        const targetX = this.char.pos.x - this.width / 2;
        const targetY = this.char.pos.y - this.height / 2;
        this.cameraOffset = new Vector2(targetX, targetY);
    }

    checkCollisions() {
        // Player projectiles hitting enemies
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const enemy = this.enemies[j];
                if (Vector2.subtract(projectile.pos, enemy.pos).length() < enemy.size.x) {
                    const damageDealt = 10;
                    enemy.takeDamage(damageDealt);
                    this.score += damageDealt * this.damageBonus;

                    this.projectiles.splice(i, 1);
                    if (enemy.health <= 0) {
                        this.enemies.splice(j, 1);
                        this.score += this.killBonus;
                    }
                    break;
                }
            }
        }

        // Enemy projectiles hitting player
        for (let i = this.enemyProjectiles.length - 1; i >= 0; i--) {
            const projectile = this.enemyProjectiles[i];
            if (Vector2.subtract(projectile.pos, this.char.pos).length() < this.char.size.x) {
                this.char.takeDamage(projectile.damage);
                this.damageFlashTimer = this.damageFlashDuration;
                this.enemyProjectiles.splice(i, 1);
                if (this.char.health <= 0) {
                    this.gameOver = true;
                }
                break;
            }
        }

        // Powerup collisions
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            const powerup = this.powerups[i];
            if (powerup.checkCollision(this.char.pos, this.char.size)) {
                if (powerup.type === "triple_shot") {
                    this.char.activateTripleShot();
                }
                powerup.collected = true;
                this.powerups.splice(i, 1);
            }
        }
    }

    drawMinimap() {
        const minimapSize = 120;
        const minimapX = WIDTH - minimapSize - 20;
        const minimapY = 20;
        const minimapScale = 0.02;

        // Background
        this.ctx.fillStyle = 'rgba(40, 40, 40, 1)';
        this.ctx.fillRect(minimapX, minimapY, minimapSize, minimapSize);
        this.ctx.strokeStyle = WHITE;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(minimapX, minimapY, minimapSize, minimapSize);

        const minimapCenter = new Vector2(minimapX + minimapSize / 2, minimapY + minimapSize / 2);

        // Draw player
        this.ctx.fillStyle = BLUE;
        this.ctx.beginPath();
        this.ctx.arc(minimapCenter.x, minimapCenter.y, 3, 0, 2 * Math.PI);
        this.ctx.fill();

        // Draw enemies
        for (const enemy of this.enemies) {
            const relativePos = Vector2.subtract(enemy.pos, this.char.pos);
            const minimapPos = Vector2.add(minimapCenter, relativePos.multiply(minimapScale));

            if (minimapPos.x > minimapX && minimapPos.x < minimapX + minimapSize &&
                minimapPos.y > minimapY && minimapPos.y < minimapY + minimapSize) {
                this.ctx.fillStyle = RED;
                this.ctx.beginPath();
                this.ctx.arc(minimapPos.x, minimapPos.y, 2, 0, 2 * Math.PI);
                this.ctx.fill();
            }
        }
    }

    drawDamageFlash() {
        if (this.damageFlashTimer > 0) {
            const alpha = (this.damageFlashTimer / this.damageFlashDuration) * 0.4;
            this.ctx.fillStyle = `rgba(255, 0, 0, ${alpha})`;
            this.ctx.fillRect(0, 0, WIDTH, HEIGHT);
            this.damageFlashTimer -= 1;
        }
    }

    drawHealthBar(pos, currentHealth, maxHealth, width = 50, height = 6) {
        // Background (red)
        this.ctx.fillStyle = RED;
        this.ctx.fillRect(pos[0] - width/2, pos[1] - height/2, width, height);

        // Health (green)
        const healthWidth = (currentHealth / maxHealth) * width;
        this.ctx.fillStyle = GREEN;
        this.ctx.fillRect(pos[0] - width/2, pos[1] - height/2, healthWidth, height);

        // Border
        this.ctx.strokeStyle = WHITE;
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(pos[0] - width/2, pos[1] - height/2, width, height);
    }

    drawPowerupBar() {
        const barWidth = 100;
        const barHeight = 6;
        const barX = 80;
        const barY = 50;

        // Background
        this.ctx.fillStyle = 'rgba(40, 40, 40, 1)';
        this.ctx.fillRect(barX - barWidth/2, barY - barHeight/2, barWidth, barHeight);

        // Timer
        if (this.char.tripleShotActive) {
            const timeRemaining = this.char.tripleShotTimer / 600.0;
            const timerWidth = timeRemaining * barWidth;
            this.ctx.fillStyle = CYAN;
            this.ctx.fillRect(barX - barWidth/2, barY - barHeight/2, timerWidth, barHeight);
        }

        // Border
        this.ctx.strokeStyle = WHITE;
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(barX - barWidth/2, barY - barHeight/2, barWidth, barHeight);
    }

    drawGameOverScreen() {
        // Overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, WIDTH, HEIGHT);

        // Game Over title
        this.ctx.font = '96px Arial';
        this.ctx.fillStyle = RED;
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GAME OVER', WIDTH/2, HEIGHT/2 - 100);

        // Final Score
        this.ctx.font = '48px Arial';
        this.ctx.fillStyle = WHITE;
        this.ctx.fillText(`Final Score: ${this.score}`, WIDTH/2, HEIGHT/2 - 20);

        // Instructions
        this.ctx.font = '48px Arial';
        this.ctx.fillStyle = GREEN;
        this.ctx.fillText('Press R to Restart', WIDTH/2, HEIGHT/2 + 120);

        this.ctx.font = '36px Arial';
        this.ctx.fillStyle = WHITE;
        this.ctx.fillText('Press ESC to Quit', WIDTH/2, HEIGHT/2 + 160);
    }

    restartGame() {
        this.gameOver = false;
        this.score = 0;
        this.char = new Char(BLUE, [30, 15], [400, 400], [0, 0], 0);
        this.projectiles = [];
        this.enemies = [];
        this.enemyProjectiles = [];
        this.powerups = [];
        this.powerupSpawnTimer = 0;
        this.enemySpawnTimer = 0;
        this.damageFlashTimer = 0;
        this.cameraOffset = new Vector2(0, 0);
    }

    handleInput() {
        // Rotation
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
            this.char.rotate(-3);
        }
        if (this.keys['ArrowRight'] || this.keys['KeyD']) {
            this.char.rotate(3);
        }

        // Acceleration
        if (this.keys['ArrowUp'] || this.keys['KeyW']) {
            this.char.accelerate(0.2);
        }
        if (this.keys['ArrowDown'] || this.keys['KeyS']) {
            this.char.accelerate(-0.2);
        }
    }

    fireProjectile() {
        const rad = this.char.angle * Math.PI / 180;
        const frontTipDistance = (this.char.size.x / 4) + 2;
        const tipOffset = new Vector2(Math.cos(rad), Math.sin(rad)).multiply(frontTipDistance);
        const projectilePos = Vector2.add(this.char.pos, tipOffset);

        const projectileSpeed = PROJ_SPEED;
        const baseVel = new Vector2(Math.cos(rad), Math.sin(rad)).multiply(projectileSpeed);
        const finalVel = Vector2.add(baseVel, this.char.vel);

        if (this.char.tripleShotActive) {
            // Triple shot
            for (let i = -1; i <= 1; i++) {
                const spreadAngle = (i * 20) * Math.PI / 180;
                const spreadRad = rad + spreadAngle;
                const spreadVel = new Vector2(Math.cos(spreadRad), Math.sin(spreadRad)).multiply(projectileSpeed);
                const finalSpreadVel = Vector2.add(spreadVel, this.char.vel);
                const projectile = new Projectile(WHITE, projectilePos.copy(), finalSpreadVel);
                this.projectiles.push(projectile);
            }
        } else {
            // Single shot
            const projectile = new Projectile(WHITE, projectilePos, finalVel);
            this.projectiles.push(projectile);
        }
    }

    update() {
        if (!this.gameOver) {
            this.handleInput();
            this.char.update();

            // Enemy spawning
            this.enemySpawnTimer += 1;
            if (this.enemySpawnTimer >= this.enemySpawnInterval) {
                this.spawnEnemy();
                this.enemySpawnTimer = 0;
            }

            // Powerup spawning
            this.powerupSpawnTimer += 1;
            if (this.powerupSpawnTimer >= this.powerupSpawnInterval) {
                this.spawnPowerup();
                this.powerupSpawnTimer = 0;
            }

            // Update enemies
            for (const enemy of this.enemies) {
                enemy.update(this.char.pos);
                if (Math.floor(Math.random() * 120) === 0) {
                    enemy.shoot(this.char.pos, this.enemyProjectiles);
                }
            }

            // Update projectiles
            for (let i = this.projectiles.length - 1; i >= 0; i--) {
                if (!this.projectiles[i].update()) {
                    this.projectiles.splice(i, 1);
                }
            }

            for (let i = this.enemyProjectiles.length - 1; i >= 0; i--) {
                if (!this.enemyProjectiles[i].update()) {
                    this.enemyProjectiles.splice(i, 1);
                }
            }

            this.checkCollisions();
            this.updateCamera();
        }
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = this.backgroundColor;
        this.ctx.fillRect(0, 0, WIDTH, HEIGHT);

        // Draw stars
        for (const star of this.stars) {
            star.draw(this.ctx, this.cameraOffset);
        }

        // Draw enemies
        for (const enemy of this.enemies) {
            enemy.draw(this.ctx, this.cameraOffset);

            // Draw enemy health bar
            const screenPos = Vector2.subtract(enemy.pos, this.cameraOffset);
            if (screenPos.x > -100 && screenPos.x < WIDTH + 100 &&
                screenPos.y > -100 && screenPos.y < HEIGHT + 100) {
                const healthBarPos = [screenPos.x, screenPos.y - enemy.size.y - 10];
                this.drawHealthBar(healthBarPos, enemy.health, enemy.maxHealth, 30, 4);
            }
        }

        // Draw character
        this.char.draw(this.ctx, this.cameraOffset);

        // Draw projectiles
        for (const projectile of this.projectiles) {
            projectile.draw(this.ctx, this.cameraOffset);
        }

        for (const projectile of this.enemyProjectiles) {
            projectile.draw(this.ctx, this.cameraOffset);
        }

        // Draw powerups
        for (const powerup of this.powerups) {
            powerup.draw(this.ctx, this.cameraOffset);
        }

        // Draw UI
        this.drawHealthBar([80, 30], this.char.health, this.char.maxHealth, 100, 10);
        this.drawPowerupBar();
        this.drawMinimap();
        this.drawDamageFlash();

        // Draw score
        this.ctx.font = '36px Arial';
        this.ctx.fillStyle = WHITE;
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Score: ${this.score}`, 10, HEIGHT - 40);

        // Game over screen
        if (this.gameOver) {
            this.drawGameOverScreen();
        }
    }

    gameLoop() {
        if (this.running) {
            this.update();
            this.draw();
            setTimeout(() => this.gameLoop(), 1000 / this.fps);
        }
    }
}

// Start the game when page loads
window.addEventListener('load', () => {
    new Game(WIDTH, HEIGHT, FPS);
});
