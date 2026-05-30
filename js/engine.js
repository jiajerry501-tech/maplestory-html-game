// Input Manager
class InputManager {
    constructor() {
        this.keys = {};
        this.justPressed = {};
        this._previous = {};
        window.addEventListener('keydown', (e) => {
            if (!this.keys[e.key]) this.justPressed[e.key] = true;
            this.keys[e.key] = true;
            e.preventDefault();
        });
        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
            e.preventDefault();
        });
    }

    isDown(key) { return !!this.keys[key]; }
    isPressed(key) {
        if (this.justPressed[key]) {
            this.justPressed[key] = false;
            return true;
        }
        return false;
    }

    update() {
        // justPressed is consumed by isPressed; reset on missed frames
        this.justPressed = {};
    }

    // Direction helpers
    get left() { return this.isDown('ArrowLeft') || this.isDown('a') || this.isDown('A'); }
    get right() { return this.isDown('ArrowRight') || this.isDown('d') || this.isDown('D'); }
    get jump() { return this.isPressed('ArrowUp') || this.isPressed(' ') || this.isPressed('w') || this.isPressed('W'); }
    get attack() { return this.isPressed('z') || this.isPressed('Z') || this.isPressed('j') || this.isPressed('J'); }
}

// Camera system
class Camera {
    constructor(width, height) {
        this.x = 0;
        this.y = 0;
        this.width = width;
        this.height = height;
        this.worldWidth = CONFIG.WORLD_WIDTH;
    }

    follow(target) {
        // Smoothly follow the player
        const targetX = target.x + target.width / 2 - this.width / 2;
        const targetY = 0; // Keep vertical fixed for now
        this.x += (targetX - this.x) * 0.1;
        this.x = Math.max(0, Math.min(this.x, this.worldWidth - this.width));
    }

    getOffsetX() { return Math.round(this.x); }
    getOffsetY() { return Math.round(this.y); }
}

// Collision helpers
const Collision = {
    aabb(a, b) {
        return a.x < b.x + b.w && a.x + a.w > b.x &&
               a.y < b.y + b.h && a.y + a.h > b.y;
    },

    // Check if point is inside rect
    pointInRect(px, py, r) {
        return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
    },
};

// Particle system for effects
class Particle {
    constructor(x, y, vx, vy, color, size, life) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.size = size;
        this.life = life;
        this.maxLife = life;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.15;
        this.life--;
    }

    draw(ctx) {
        const alpha = this.life / this.maxLife;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.size, this.size);
        ctx.globalAlpha = 1;
    }

    get dead() { return this.life <= 0; }
}

class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    emit(x, y, count, options = {}) {
        const {
            spread = 3,
            colors = ['#FFD700', '#FF6B6B', '#FFA500'],
            sizeRange = [2, 6],
            lifeRange = [20, 40],
            speedRange = [1, 4],
            gravity = 0.15,
        } = options;

        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = speedRange[0] + Math.random() * (speedRange[1] - speedRange[0]);
            const size = sizeRange[0] + Math.random() * (sizeRange[1] - sizeRange[0]);
            const life = lifeRange[0] + Math.floor(Math.random() * (lifeRange[1] - lifeRange[0]));
            const color = colors[Math.floor(Math.random() * colors.length)];
            const p = new Particle(
                x + (Math.random() - 0.5) * spread,
                y + (Math.random() - 0.5) * spread,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed - 2,
                color, size, life
            );
            p.vy += gravity;
            this.particles.push(p);
        }
    }

    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update();
            if (this.particles[i].dead) {
                this.particles.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        for (const p of this.particles) {
            p.draw(ctx);
        }
    }
}

// Damage number system
class DamageNumbers {
    constructor() {
        this.numbers = [];
    }

    add(x, y, value, color = '#FFD700') {
        this.numbers.push({
            x, y,
            value: Math.floor(value),
            color,
            life: 50,
            maxLife: 50,
            vy: -2.5,
        });
    }

    update() {
        for (let i = this.numbers.length - 1; i >= 0; i--) {
            const n = this.numbers[i];
            n.y += n.vy;
            n.vy += 0.08;
            n.life--;
            if (n.life <= 0) this.numbers.splice(i, 1);
        }
    }

    draw(ctx, camera) {
        for (const n of this.numbers) {
            const alpha = Math.min(1, n.life / 20);
            ctx.globalAlpha = alpha;
            ctx.font = 'bold 16px "Segoe UI", Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 3;
            const sx = n.x - camera.getOffsetX();
            const sy = n.y - camera.getOffsetY();
            ctx.strokeText(n.value, sx, sy);
            ctx.fillStyle = n.color;
            ctx.fillText(n.value, sx, sy);
            ctx.globalAlpha = 1;
        }
    }
}
