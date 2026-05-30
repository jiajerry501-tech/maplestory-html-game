// Game Map - Background and Platforms
class GameMap {
    constructor() {
        this.platforms = CONFIG.PLATFORMS;
        this.clouds = this._generateClouds();
        this.trees = this._generateTrees();
        this.decorations = this._generateDecorations();
    }

    _generateClouds() {
        const clouds = [];
        for (let i = 0; i < 15; i++) {
            clouds.push({
                x: Math.random() * CONFIG.WORLD_WIDTH,
                y: 20 + Math.random() * 120,
                w: 80 + Math.random() * 140,
                h: 30 + Math.random() * 20,
                speed: 0.1 + Math.random() * 0.2,
                opacity: 0.4 + Math.random() * 0.4,
            });
        }
        return clouds;
    }

    _generateTrees() {
        const trees = [];
        // Bottom ground trees
        for (let i = 0; i < 25; i++) {
            const x = i * 130 + Math.random() * 60;
            if (x > CONFIG.WORLD_WIDTH) break;
            trees.push({
                x: x,
                type: Math.floor(Math.random() * 3),
                scale: 0.8 + Math.random() * 0.5,
            });
        }
        return trees;
    }

    _generateDecorations() {
        const deco = [];
        // Small grass tufts on ground
        for (let i = 0; i < 60; i++) {
            const x = Math.random() * CONFIG.WORLD_WIDTH;
            // Find ground platform at this x
            const ground = this.platforms.find(p => p.h > 40 && x >= p.x && x <= p.x + p.w);
            if (ground) {
                deco.push({
                    x: x,
                    y: ground.y,
                    type: 'grass',
                    height: 4 + Math.random() * 6,
                });
            }
        }
        // Background hills
        for (let i = 0; i < 6; i++) {
            deco.push({
                x: i * 600 - 100,
                height: 60 + Math.random() * 80,
                width: 400 + Math.random() * 300,
                type: 'hill',
                color: i % 2 === 0 ? '#A8D5BA' : '#C8E6C9',
            });
        }
        return deco;
    }

    update(camera) {
        // Move clouds slowly for parallax
        for (const cloud of this.clouds) {
            cloud.x += cloud.speed;
            if (cloud.x > CONFIG.WORLD_WIDTH + 200) {
                cloud.x = -cloud.w - 50;
                cloud.y = 20 + Math.random() * 120;
            }
        }
    }

    drawBackground(ctx, camera) {
        const ox = camera.getOffsetX();
        const oy = camera.getOffsetY();

        // Sky gradient
        const grad = ctx.createLinearGradient(0, 0, 0, CONFIG.CANVAS_HEIGHT);
        grad.addColorStop(0, '#4A90D9');
        grad.addColorStop(0.5, '#87CEEB');
        grad.addColorStop(1, '#E0F4FF');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

        // Distant mountains (parallax)
        this._drawMountains(ctx, ox, oy);

        // Clouds (mid-layer parallax)
        for (const cloud of this.clouds) {
            const sx = cloud.x - ox * 0.3;
            const sy = cloud.y - oy;
            // Wrap clouds around screen
            const wrappedX = ((sx % (CONFIG.WORLD_WIDTH * 0.3)) + CONFIG.WORLD_WIDTH * 0.3) % (CONFIG.WORLD_WIDTH * 0.3) - 100;
            if (wrappedX > -200 && wrappedX < CONFIG.CANVAS_WIDTH + 200) {
                ctx.globalAlpha = cloud.opacity;
                ctx.fillStyle = '#FFF';
                // Draw cloud as rounded rect
                this._drawRoundedRect(ctx, wrappedX, sy, cloud.w, cloud.h, cloud.h / 2);
                ctx.fill();
                // Add cloud bump
                ctx.beginPath();
                ctx.ellipse(wrappedX + cloud.w * 0.3, sy - 5, cloud.w * 0.2, cloud.h * 0.5, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.ellipse(wrappedX + cloud.w * 0.7, sy - 3, cloud.w * 0.15, cloud.h * 0.4, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
            }
        }
    }

    _drawMountains(ctx, ox) {
        // Distant mountains
        for (const deco of this.decorations) {
            if (deco.type === 'hill') {
                const sx = deco.x - ox * 0.2;
                ctx.fillStyle = deco.color;
                ctx.beginPath();
                ctx.moveTo(sx, CONFIG.CANVAS_HEIGHT);
                ctx.quadraticCurveTo(
                    sx + deco.width / 2,
                    CONFIG.CANVAS_HEIGHT - deco.height,
                    sx + deco.width,
                    CONFIG.CANVAS_HEIGHT
                );
                ctx.fill();
            }
        }
    }

    drawPlatforms(ctx, camera) {
        const ox = camera.getOffsetX();
        const oy = camera.getOffsetY();

        for (const plat of this.platforms) {
            const sx = plat.x - ox;
            const sy = plat.y - oy;

            // Skip if off screen
            if (sx > CONFIG.CANVAS_WIDTH + 10 || sx + plat.w < -10) continue;

            if (plat.h > 40) {
                // Ground/platform block
                // Dirt body
                ctx.fillStyle = '#8D6E63';
                ctx.fillRect(sx, sy + 8, plat.w, plat.h - 8);
                // Grass top
                ctx.fillStyle = '#66BB6A';
                ctx.fillRect(sx, sy, plat.w, 10);
                // Grass highlight
                ctx.fillStyle = '#81C784';
                ctx.fillRect(sx, sy, plat.w, 4);
                // Dirt texture
                ctx.fillStyle = '#A1887F';
                for (let i = 0; i < 5; i++) {
                    const tx = sx + 20 + i * 35 + Math.sin(i * 3) * 10;
                    const ty = sy + 20 + i * 12;
                    ctx.fillRect(tx, ty, 6, 6);
                    ctx.fillRect(tx + 50, ty + 20, 6, 6);
                }
                // Ground edge
                ctx.strokeStyle = '#5D4037';
                ctx.lineWidth = 1;
                ctx.strokeRect(sx, sy, plat.w, plat.h);
            } else {
                // Floating platform
                // Main block
                ctx.fillStyle = '#8D6E63';
                ctx.fillRect(sx, sy + 4, plat.w, plat.h - 4);
                // Grass top
                ctx.fillStyle = '#66BB6A';
                ctx.fillRect(sx, sy, plat.w, 6);
                ctx.fillStyle = '#81C784';
                ctx.fillRect(sx, sy, plat.w, 3);
                // Platform edge
                ctx.strokeStyle = '#5D4037';
                ctx.lineWidth = 1;
                ctx.strokeRect(sx, sy, plat.w, plat.h);
                // Support stones on sides
                ctx.fillStyle = '#6D4C41';
                ctx.fillRect(sx - 2, sy + 4, 4, plat.h - 2);
                ctx.fillRect(sx + plat.w - 2, sy + 4, 4, plat.h - 2);
            }
        }
    }

    drawForeground(ctx, camera) {
        const ox = camera.getOffsetX();

        // Draw trees (behind player but in front of background)
        for (const tree of this.trees) {
            const sx = tree.x - ox * 0.8;
            if (sx < -100 || sx > CONFIG.CANVAS_WIDTH + 100) continue;

            const scale = tree.scale;

            if (tree.type === 0) {
                // Pine tree
                // Trunk
                ctx.fillStyle = '#5D4037';
                ctx.fillRect(sx - 3 * scale, CONFIG.CANVAS_HEIGHT - 60 * scale, 6 * scale, 60 * scale);
                // Foliage layers
                ctx.fillStyle = '#388E3C';
                ctx.beginPath();
                ctx.moveTo(sx, CONFIG.CANVAS_HEIGHT - 120 * scale);
                ctx.lineTo(sx - 22 * scale, CONFIG.CANVAS_HEIGHT - 50 * scale);
                ctx.lineTo(sx + 22 * scale, CONFIG.CANVAS_HEIGHT - 50 * scale);
                ctx.fill();
                ctx.fillStyle = '#43A047';
                ctx.beginPath();
                ctx.moveTo(sx, CONFIG.CANVAS_HEIGHT - 95 * scale);
                ctx.lineTo(sx - 18 * scale, CONFIG.CANVAS_HEIGHT - 40 * scale);
                ctx.lineTo(sx + 18 * scale, CONFIG.CANVAS_HEIGHT - 40 * scale);
                ctx.fill();
            } else if (tree.type === 1) {
                // Round tree
                ctx.fillStyle = '#5D4037';
                ctx.fillRect(sx - 4 * scale, CONFIG.CANVAS_HEIGHT - 50 * scale, 8 * scale, 50 * scale);
                ctx.fillStyle = '#4CAF50';
                ctx.beginPath();
                ctx.arc(sx, CONFIG.CANVAS_HEIGHT - 75 * scale, 28 * scale, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#66BB6A';
                ctx.beginPath();
                ctx.arc(sx - 5 * scale, CONFIG.CANVAS_HEIGHT - 80 * scale, 15 * scale, 0, Math.PI * 2);
                ctx.arc(sx + 8 * scale, CONFIG.CANVAS_HEIGHT - 78 * scale, 12 * scale, 0, Math.PI * 2);
                ctx.fill();
            } else {
                // Tall palm-like tree
                ctx.fillStyle = '#5D4037';
                ctx.fillRect(sx - 3 * scale, CONFIG.CANVAS_HEIGHT - 80 * scale, 6 * scale, 80 * scale);
                ctx.fillStyle = '#388E3C';
                ctx.beginPath();
                ctx.arc(sx, CONFIG.CANVAS_HEIGHT - 95 * scale, 20 * scale, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#4CAF50';
                ctx.beginPath();
                ctx.arc(sx - 12 * scale, CONFIG.CANVAS_HEIGHT - 90 * scale, 14 * scale, 0, Math.PI * 2);
                ctx.arc(sx + 12 * scale, CONFIG.CANVAS_HEIGHT - 90 * scale, 14 * scale, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    drawGrass(ctx, camera) {
        const ox = camera.getOffsetX();
        for (const deco of this.decorations) {
            if (deco.type === 'grass') {
                const sx = deco.x - ox;
                if (sx < -10 || sx > CONFIG.CANVAS_WIDTH + 10) continue;
                const sy = deco.y - camera.getOffsetY();
                ctx.strokeStyle = '#4CAF50';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(sx, sy);
                ctx.quadraticCurveTo(sx - 2, sy - deco.height, sx - 1, sy - deco.height);
                ctx.moveTo(sx + 2, sy);
                ctx.quadraticCurveTo(sx + 4, sy - deco.height + 3, sx + 3, sy - deco.height + 3);
                ctx.stroke();
            }
        }
    }

    _drawRoundedRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    isOnPlatform(entity) {
        // Check if entity's feet are touching a platform top
        for (const plat of this.platforms) {
            if (entity.x + entity.width > plat.x &&
                entity.x < plat.x + plat.w &&
                Math.abs(entity.y + entity.height - plat.y) < 3) {
                return true;
            }
        }
        return false;
    }
}
