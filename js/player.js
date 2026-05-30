// Player Character
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = CONFIG.PLAYER.WIDTH;
        this.height = CONFIG.PLAYER.HEIGHT;
        this.vx = 0;
        this.vy = 0;

        // Stats
        this.maxHp = CONFIG.PLAYER.MAX_HP;
        this.hp = this.maxHp;
        this.maxMp = CONFIG.PLAYER.MAX_MP;
        this.mp = this.maxMp;
        this.level = 1;
        this.exp = 0;
        this.maxExp = 15;
        this.attackDamage = CONFIG.PLAYER.ATTACK_DAMAGE;
        this.str = 4;
        this.dex = 4;

        // State
        this.facingRight = true;
        this.isOnGround = false;
        this.isAttacking = false;
        this.attackTimer = 0;
        this.attackCooldown = 0;
        this.isInvincible = false;
        this.invincibleTimer = 0;
        this.walkFrame = 0;
        this.walkTimer = 0;
        this.isDead = false;

        // Hitbox for attack
        this.attackHitbox = null;
    }

    get centerX() { return this.x + this.width / 2; }
    get centerY() { return this.y + this.height / 2; }
    get bottomY() { return this.y + this.height; }

    addExp(amount) {
        this.exp += amount;
        if (this.exp >= this.maxExp) {
            this.levelUp();
        }
    }

    levelUp() {
        this.level++;
        this.exp -= this.maxExp;
        this.maxExp = Math.floor(this.maxExp * 1.4) + 5;
        this.maxHp += 12;
        this.hp = Math.min(this.hp + 30, this.maxHp);
        this.maxMp += 5;
        this.mp = Math.min(this.mp + 10, this.maxMp);
        this.str += 2;
        this.dex += 1;
        this.attackDamage = CONFIG.PLAYER.ATTACK_DAMAGE + Math.floor(this.str * 1.5);
        return true; // signal for level-up effect
    }

    takeDamage(amount) {
        if (this.isInvincible || this.isDead) return;
        this.hp -= amount;
        this.isInvincible = true;
        this.invincibleTimer = CONFIG.PLAYER.INVINCIBILITY_TIME;
        // Knockback
        this.vy = -5;
        this.vx = this.facingRight ? -5 : 5;
        if (this.hp <= 0) {
            this.hp = 0;
            this.isDead = true;
        }
    }

    respawn() {
        this.hp = this.maxHp;
        this.mp = this.maxMp;
        this.x = 100;
        this.y = 400;
        this.vx = 0;
        this.vy = 0;
        this.isDead = false;
        this.isInvincible = true;
        this.invincibleTimer = 2000;
    }

    update(input, platforms, dt = 1) {
        // Cooldown timers (frame-rate independent)
        if (this.attackCooldown > 0) this.attackCooldown -= dt;
        if (this.invincibleTimer > 0) this.invincibleTimer -= dt;
        else this.isInvincible = false;
        if (this.attackTimer > 0) {
            this.attackTimer -= dt;
            if (this.attackTimer <= 0) {
                this.isAttacking = false;
                this.attackHitbox = null;
            }
        }

        if (this.isDead) return;

        // Horizontal movement (scaled by dt for consistent speed)
        if (input.left) {
            this.vx = -CONFIG.PLAYER.SPEED * dt;
            this.facingRight = false;
        } else if (input.right) {
            this.vx = CONFIG.PLAYER.SPEED * dt;
            this.facingRight = true;
        } else {
            this.vx *= Math.pow(CONFIG.FRICTION, dt);
            if (Math.abs(this.vx) < 0.1) this.vx = 0;
        }

        // Jump
        if (input.jump && this.isOnGround) {
            this.vy = CONFIG.PLAYER.JUMP_FORCE * dt;
            this.isOnGround = false;
        }

        // Gravity (scaled by dt)
        this.vy += CONFIG.GRAVITY * dt;
        if (this.vy > CONFIG.MAX_FALL_SPEED * dt) this.vy = CONFIG.MAX_FALL_SPEED * dt;

        // Attack
        if (input.attack && this.attackCooldown <= 0 && !this.isAttacking) {
            this.attack();
        }

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

        // Ceiling collision
        for (const plat of platforms) {
            if (this.vy < 0 &&
                this.x + this.width > plat.x &&
                this.x < plat.x + plat.w &&
                this.y >= plat.y + plat.h - 4 &&
                this.y <= plat.y + plat.h + 4) {
                this.y = plat.y + plat.h;
                this.vy = 1;
            }
        }

        // World bounds
        this.x = Math.max(0, Math.min(this.x, CONFIG.WORLD_WIDTH - this.width));
        if (this.y + this.height > CONFIG.CANVAS_HEIGHT + 100) {
            this.takeDamage(20);
            this.y = 300;
            this.vy = -5;
        }

        // Walk animation
        if (Math.abs(this.vx) > 0.5 && this.isOnGround) {
            this.walkTimer++;
            if (this.walkTimer > 8) {
                this.walkTimer = 0;
                this.walkFrame = (this.walkFrame + 1) % 4;
            }
        } else if (this.isOnGround) {
            this.walkFrame = 0;
            this.walkTimer = 0;
        }

        // Update attack hitbox position
        if (this.isAttacking && this.attackTimer > 15) {
            const ax = this.facingRight ? this.x + this.width : this.x - CONFIG.PLAYER.ATTACK_RANGE;
            this.attackHitbox = {
                x: ax,
                y: this.y + 8,
                w: CONFIG.PLAYER.ATTACK_RANGE,
                h: this.height - 16,
            };
        } else {
            this.attackHitbox = null;
        }
    }

    attack() {
        this.isAttacking = true;
        this.attackTimer = 25;
        this.attackCooldown = CONFIG.PLAYER.ATTACK_COOLDOWN / (1000 / 60);
    }

    draw(ctx, camera) {
        const ox = Math.round(this.x - camera.getOffsetX());
        const oy = Math.round(this.y - camera.getOffsetY());

        ctx.save();

        // Invincibility flash
        if (this.isInvincible && Math.floor(this.invincibleTimer / 80) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(ox + this.width / 2, oy + this.height, this.width / 2 - 2, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        const cx = ox + this.width / 2;
        const cy = oy + this.height / 2;

        // ---- Legs ----
        if (this.isOnGround && Math.abs(this.vx) > 0.5) {
            // Walking animation
            const legOffset = Math.sin(this.walkFrame * Math.PI / 2) * 4;
            ctx.fillStyle = '#5D4037';
            ctx.fillRect(ox + 4, oy + this.height - 8, 8, 8);
            ctx.fillRect(ox + this.width - 12, oy + this.height - 8, 8, 8);
            // Animated lower leg
            ctx.fillRect(ox + 4 + legOffset, oy + this.height - 4, 7, 4);
            ctx.fillRect(ox + this.width - 11 - legOffset, oy + this.height - 4, 7, 4);
        } else if (!this.isOnGround) {
            // Jumping - legs tucked
            ctx.fillStyle = '#5D4037';
            ctx.fillRect(ox + 6, oy + this.height - 10, 8, 6);
            ctx.fillRect(ox + this.width - 14, oy + this.height - 10, 8, 6);
        } else {
            // Standing
            ctx.fillStyle = '#5D4037';
            ctx.fillRect(ox + 5, oy + this.height - 8, 9, 8);
            ctx.fillRect(ox + this.width - 14, oy + this.height - 8, 9, 8);
        }

        // ---- Body ----
        // Shirt
        ctx.fillStyle = '#E74C3C';
        ctx.fillRect(ox + 4, oy + 16, this.width - 8, this.height - 28);

        // Shirt detail (collar)
        ctx.fillStyle = '#C0392B';
        ctx.fillRect(ox + 4, oy + 18, this.width - 8, 3);

        // Arms
        ctx.fillStyle = '#F5CBA7';
        if (this.isAttacking && this.attackTimer > 15) {
            // Attack pose - arm extended
            const armDir = this.facingRight ? 1 : -1;
            ctx.fillRect(cx + armDir * 4, oy + 20, 14, 6);
        } else if (!this.isOnGround) {
            // Jumping - arms up
            ctx.fillRect(ox - 2, oy + 14, 6, 10);
            ctx.fillRect(ox + this.width - 4, oy + 14, 6, 10);
        } else {
            ctx.fillRect(ox - 2, oy + 22, 6, 12);
            ctx.fillRect(ox + this.width - 4, oy + 22, 6, 12);
        }

        // ---- Head ----
        // Face
        ctx.fillStyle = '#F5CBA7';
        ctx.beginPath();
        ctx.arc(cx, oy + 12, 13, 0, Math.PI * 2);
        ctx.fill();

        // Hair
        ctx.fillStyle = '#6D4C41';
        ctx.beginPath();
        ctx.arc(cx, oy + 9, 13, Math.PI, 2 * Math.PI);
        ctx.fill();
        // Hair spikes on top
        ctx.beginPath();
        ctx.moveTo(cx - 10, oy + 6);
        ctx.lineTo(cx - 6, oy - 2);
        ctx.lineTo(cx - 2, oy + 4);
        ctx.lineTo(cx + 2, oy - 3);
        ctx.lineTo(cx + 6, oy + 4);
        ctx.lineTo(cx + 10, oy + 6);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#2C3E50';
        if (this.facingRight) {
            ctx.fillRect(cx + 3, oy + 10, 4, 4);
            ctx.fillRect(cx + 10, oy + 10, 4, 4);
        } else {
            ctx.fillRect(cx - 7, oy + 10, 4, 4);
            ctx.fillRect(cx - 14, oy + 10, 4, 4);
        }
        // Eye shine
        ctx.fillStyle = '#FFF';
        if (this.facingRight) {
            ctx.fillRect(cx + 4, oy + 10, 2, 2);
            ctx.fillRect(cx + 11, oy + 10, 2, 2);
        } else {
            ctx.fillRect(cx - 6, oy + 10, 2, 2);
            ctx.fillRect(cx - 13, oy + 10, 2, 2);
        }

        // Mouth
        ctx.fillStyle = '#E74C3C';
        ctx.fillRect(cx - 2, oy + 16, 4, 2);

        // ---- Weapon (sword) during attack ----
        if (this.isAttacking && this.attackTimer > 10) {
            const dir = this.facingRight ? 1 : -1;
            ctx.save();
            ctx.translate(cx + dir * 18, oy + 22);
            ctx.rotate(dir * 0.7);
            ctx.fillStyle = '#95A5A6';
            ctx.fillRect(0, -2, 28, 4);
            ctx.fillStyle = '#7F8C8D';
            ctx.fillRect(24, -4, 6, 8);
            // Sword handle
            ctx.fillStyle = '#5D4037';
            ctx.fillRect(0, -3, 6, 6);
            ctx.restore();
        }

        ctx.restore();
    }

    getRect() {
        return { x: this.x, y: this.y, w: this.width, h: this.height };
    }
}
