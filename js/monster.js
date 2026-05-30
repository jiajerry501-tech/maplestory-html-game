// Monster Entity
class Monster {
    constructor(x, y, type) {
        this.config = CONFIG.MONSTERS[type];
        this.type = type;
        this.x = x;
        this.y = y;
        this.width = this.config.width;
        this.height = this.config.height;
        this.vx = this.config.speed * (Math.random() > 0.5 ? 1 : -1);
        this.vy = 0;

        this.maxHp = this.config.hp;
        this.hp = this.maxHp;
        this.damage = this.config.damage;
        this.speed = this.config.speed;
        this.exp = this.config.exp;

        this.isOnGround = false;
        this.isDead = false;
        this.respawnTimer = 0;
        this.spawnX = x;
        this.spawnY = y;
        this.patrolRange = 120 + Math.random() * 80;

        // Animation
        this.animTimer = 0;
        this.flashTimer = 0;
        this.bounceOffset = 0;
        this.bounceDir = 1;
    }

    takeDamage(amount) {
        if (this.isDead) return false;
        this.hp -= amount;
        this.flashTimer = 10;
        if (this.hp <= 0) {
            this.die();
            return true; // killed
        }
        // Knockback
        this.vy = -3;
        return false;
    }

    die() {
        this.isDead = true;
        this.respawnTimer = 180; // 3 seconds at 60fps
    }

    update(player, platforms, dt = 1) {
        if (this.isDead) {
            this.respawnTimer -= dt;
            if (this.respawnTimer <= 0) {
                this.respawn();
            }
            return;
        }

        if (this.flashTimer > 0) this.flashTimer--;

        // Patrol AI
        const distFromSpawn = this.x - this.spawnX;
        if (distFromSpawn < -this.patrolRange || distFromSpawn > this.patrolRange) {
            this.vx *= -0.8;
        }

        // Adjust direction (scaled by dt)
        if (this.vx > 0) this.vx = Math.min(this.vx, this.speed * dt);
        else this.vx = Math.max(this.vx, -this.speed * dt);

        // Gravity (scaled by dt)
        this.vy += CONFIG.GRAVITY * dt;
        if (this.vy > CONFIG.MAX_FALL_SPEED * dt) this.vy = CONFIG.MAX_FALL_SPEED * dt;

        // Apply physics
        this.x += this.vx;
        this.y += this.vy;

        // Platform collision
        this.isOnGround = false;
        for (const plat of platforms) {
            if (this.vy >= 0 &&
                this.x + this.width > plat.x &&
                this.x < plat.x + plat.w &&
                this.y + this.height >= plat.y &&
                this.y + this.height <= plat.y + plat.h + this.vy + 2) {
                this.y = plat.y - this.height;
                this.vy = 0;
                this.isOnGround = true;
            }
        }

        // Animation
        this.animTimer++;
        if (this.type === 'SLIME') {
            this.bounceOffset = Math.sin(this.animTimer * 0.05) * 3;
        } else if (this.type === 'MUSHROOM') {
            this.bounceOffset = 0;
        } else if (this.type === 'RIBON_PIG') {
            this.bounceOffset = Math.sin(this.animTimer * 0.06) * 2;
        }

        // World bounds
        this.x = Math.max(5, Math.min(this.x, CONFIG.WORLD_WIDTH - this.width - 5));
        if (this.y > CONFIG.CANVAS_HEIGHT + 200) {
            this.y = this.spawnY;
            this.vy = 0;
        }
    }

    respawn() {
        this.hp = this.maxHp;
        this.x = this.spawnX;
        this.y = this.spawnY;
        this.vy = 0;
        this.vx = this.speed * (Math.random() > 0.5 ? 1 : -1);
        this.isDead = false;
        this.flashTimer = 0;
    }

    draw(ctx, camera) {
        if (this.isDead) return;

        const ox = Math.round(this.x - camera.getOffsetX());
        const oy = Math.round(this.y + this.bounceOffset - camera.getOffsetY());

        // Skip if off screen
        if (ox < -60 || ox > CONFIG.CANVAS_WIDTH + 60) return;

        ctx.save();

        // Flash white when hit
        if (this.flashTimer > 0) {
            ctx.globalAlpha = 0.7;
        }

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.beginPath();
        ctx.ellipse(ox + this.width / 2, oy + this.height + 2, this.width / 2 - 2, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        const cx = ox + this.width / 2;
        const cy = oy + this.height / 2;

        if (this.type === 'SLIME') {
            this.drawSlime(ctx, ox, oy, cx, cy);
        } else if (this.type === 'MUSHROOM') {
            this.drawMushroom(ctx, ox, oy, cx, cy);
        } else if (this.type === 'RIBON_PIG') {
            this.drawRibbonPig(ctx, ox, oy, cx, cy);
        }

        // HP bar
        if (this.hp < this.maxHp) {
            const barW = this.width + 8;
            const barH = 4;
            const barX = ox - 4;
            const barY = oy - 10;
            ctx.fillStyle = '#333';
            ctx.fillRect(barX, barY, barW, barH);
            ctx.fillStyle = '#E74C3C';
            ctx.fillRect(barX, barY, barW * (this.hp / this.maxHp), barH);
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 1;
            ctx.strokeRect(barX, barY, barW, barH);
        }

        ctx.restore();
    }

    drawSlime(ctx, ox, oy, cx, cy) {
        // Body - bouncy blob
        ctx.fillStyle = this.flashTimer > 0 ? '#FFF' : '#4FC3F7';
        ctx.beginPath();
        const squeeze = Math.sin(this.animTimer * 0.08) * 2;
        ctx.ellipse(cx, oy + this.height / 2 + squeeze,
            this.width / 2, this.height / 2 - squeeze, 0, 0, Math.PI * 2);
        ctx.fill();

        // Outline
        ctx.strokeStyle = '#29B6F6';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Eyes
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.ellipse(cx - 6, oy + 12 + squeeze, 5, 6, 0, 0, Math.PI * 2);
        ctx.ellipse(cx + 6, oy + 12 + squeeze, 5, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Pupils
        const lookDir = this.vx > 0 ? 2 : -2;
        ctx.fillStyle = '#1A237E';
        ctx.beginPath();
        ctx.arc(cx - 6 + lookDir, oy + 13 + squeeze, 2.5, 0, Math.PI * 2);
        ctx.arc(cx + 6 + lookDir, oy + 13 + squeeze, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Mouth
        ctx.strokeStyle = '#1A237E';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx, oy + 18 + squeeze, 4, 0.1, Math.PI - 0.1);
        ctx.stroke();
    }

    drawMushroom(ctx, ox, oy, cx, cy) {
        // Stem
        ctx.fillStyle = this.flashTimer > 0 ? '#FFF' : '#D7CCC8';
        ctx.fillRect(ox + 8, oy + 14, this.width - 16, this.height - 14);

        // Stem outline
        ctx.strokeStyle = '#BCAAA4';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(ox + 8, oy + 14, this.width - 16, this.height - 14);

        // Cap (mushroom top)
        ctx.fillStyle = this.flashTimer > 0 ? '#FFF' : '#81C784';
        ctx.beginPath();
        ctx.ellipse(cx, oy + 8, this.width / 2 + 4, 14, 0, Math.PI, 0);
        ctx.fill();

        // Cap outline
        ctx.strokeStyle = '#66BB6A';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(cx, oy + 8, this.width / 2 + 4, 14, 0, Math.PI, 0);
        ctx.stroke();

        // Spots on cap
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(cx - 8, oy + 4, 4, 0, Math.PI * 2);
        ctx.arc(cx + 6, oy + 2, 3, 0, Math.PI * 2);
        ctx.arc(cx - 1, oy + 8, 3, 0, Math.PI * 2);
        ctx.fill();

        // Eyes on stem
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.ellipse(cx - 6, oy + 22, 4, 5, 0, 0, Math.PI * 2);
        ctx.ellipse(cx + 6, oy + 22, 4, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Pupils - angry looking
        const lookX = this.vx > 0 ? 1.5 : -1.5;
        ctx.fillStyle = '#1A237E';
        ctx.fillRect(cx - 6 + lookX, oy + 21, 3, 4);
        ctx.fillRect(cx + 6 + lookX, oy + 21, 3, 4);

        // Angry eyebrows
        ctx.strokeStyle = '#4E342E';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx - 12, oy + 15);
        ctx.lineTo(cx - 3, oy + 17);
        ctx.moveTo(cx + 12, oy + 15);
        ctx.lineTo(cx + 3, oy + 17);
        ctx.stroke();
    }

    drawRibbonPig(ctx, ox, oy, cx, cy) {
        // Body
        ctx.fillStyle = this.flashTimer > 0 ? '#FFF' : '#FFB74D';
        ctx.beginPath();
        ctx.ellipse(cx, oy + this.height / 2, this.width / 2, this.height / 2 - 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Outline
        ctx.strokeStyle = '#FFA726';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Snout
        ctx.fillStyle = '#FF8A65';
        ctx.beginPath();
        ctx.ellipse(cx, oy + this.height - 10, 8, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Nostrils
        ctx.fillStyle = '#BF360C';
        ctx.fillRect(cx - 4, oy + this.height - 11, 2.5, 2.5);
        ctx.fillRect(cx + 1.5, oy + this.height - 11, 2.5, 2.5);

        // Eyes
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.ellipse(cx - 7, oy + 12, 5, 6, 0, 0, Math.PI * 2);
        ctx.ellipse(cx + 7, oy + 12, 5, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Pupils
        const lookX = this.vx > 0 ? 2 : -2;
        ctx.fillStyle = '#1A237E';
        ctx.beginPath();
        ctx.arc(cx - 7 + lookX, oy + 13, 2.5, 0, Math.PI * 2);
        ctx.arc(cx + 7 + lookX, oy + 13, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Ears
        ctx.fillStyle = '#FFB74D';
        ctx.beginPath();
        ctx.ellipse(cx - 14, oy + 6, 5, 7, -0.3, 0, Math.PI * 2);
        ctx.ellipse(cx + 14, oy + 6, 5, 7, 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Ribbon
        ctx.fillStyle = '#E91E63';
        ctx.beginPath();
        ctx.moveTo(cx + 12, oy + 4);
        ctx.lineTo(cx + 22, oy - 2);
        ctx.lineTo(cx + 18, oy + 6);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(cx + 16, oy + 4);
        ctx.lineTo(cx + 26, oy + 2);
        ctx.lineTo(cx + 18, oy + 8);
        ctx.fill();
        // Ribbon center
        ctx.fillStyle = '#C2185B';
        ctx.beginPath();
        ctx.arc(cx + 14, oy + 4, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    getRect() {
        return { x: this.x, y: this.y, w: this.width, h: this.height };
    }
}
