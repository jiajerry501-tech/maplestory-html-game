// UI - HUD and Effects
class UI {
    constructor() {
        this.messages = [];
        this.levelUpFlash = 0;
        this.comboCount = 0;
        this.comboTimer = 0;
    }

    showMessage(text, color = '#FFD700', duration = 120) {
        this.messages.push({
            text,
            color,
            duration,
            maxDuration: duration,
            y: CONFIG.CANVAS_HEIGHT / 2 - 50,
        });
    }

    update() {
        // Update messages
        for (let i = this.messages.length - 1; i >= 0; i--) {
            const msg = this.messages[i];
            msg.duration--;
            msg.y -= 0.5;
            if (msg.duration <= 0) {
                this.messages.splice(i, 1);
            }
        }

        if (this.levelUpFlash > 0) this.levelUpFlash--;
        if (this.comboTimer > 0) {
            this.comboTimer--;
            if (this.comboTimer === 0) this.comboCount = 0;
        }
    }

    onMonsterKilled() {
        this.comboCount++;
        this.comboTimer = 120;
    }

    draw(ctx, player, camera) {
        this._drawHpBar(ctx, player);
        this._drawMpBar(ctx, player);
        this._drawExpBar(ctx, player);
        this._drawLevelInfo(ctx, player);
        this._drawMessages(ctx);
        this._drawMiniMap(ctx, player, camera);

        // Combo display
        if (this.comboCount > 1 && this.comboTimer > 0) {
            ctx.font = 'bold 20px "Segoe UI", Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#FF6B6B';
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 3;
            const comboText = `${this.comboCount} Combo!`;
            ctx.strokeText(comboText, CONFIG.CANVAS_WIDTH / 2, 90);
            ctx.fillText(comboText, CONFIG.CANVAS_WIDTH / 2, 90);
        }

        // Level up flash
        if (this.levelUpFlash > 0) {
            const alpha = Math.min(1, this.levelUpFlash / 30);
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 48px "Segoe UI", Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 5;
            const text = 'Level Up!';
            ctx.strokeText(text, CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 - 30);
            ctx.fillText(text, CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 - 30);
            ctx.restore();
        }

        // Death overlay
        if (player.isDead) {
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
            ctx.font = 'bold 36px "Segoe UI", Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#E74C3C';
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 4;
            ctx.strokeText('你死了', CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 - 20);
            ctx.fillText('你死了', CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 - 20);
            ctx.font = '18px "Segoe UI", Arial, sans-serif';
            ctx.fillStyle = '#FFF';
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.strokeText('按 Enter 复活', CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 + 30);
            ctx.fillText('按 Enter 复活', CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 + 30);
        }

        // Controls hint
        ctx.font = '12px "Segoe UI", Arial, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.fillText('方向键/WASD: 移动 | Z/J: 攻击 | 空格: 跳跃', CONFIG.CANVAS_WIDTH - 15, CONFIG.CANVAS_HEIGHT - 15);
    }

    _drawHpBar(ctx, player) {
        const barX = 20;
        const barY = 20;
        const barW = 200;
        const barH = 22;

        // Background
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(barX - 2, barY - 2, barW + 4, barH + 4);
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX - 2, barY - 2, barW + 4, barH + 4);

        // HP bar background
        ctx.fillStyle = '#333';
        ctx.fillRect(barX, barY, barW, barH);

        // HP fill with gradient
        const hpRatio = player.hp / player.maxHp;
        const hpColor = hpRatio > 0.5 ? '#2ECC71' : hpRatio > 0.25 ? '#F1C40F' : '#E74C3C';
        const grad = ctx.createLinearGradient(barX, barY, barX + barW * hpRatio, barY);
        grad.addColorStop(0, hpColor);
        grad.addColorStop(1, hpRatio > 0.5 ? '#27AE60' : hpRatio > 0.25 ? '#F39C12' : '#C0392B');
        ctx.fillStyle = grad;
        ctx.fillRect(barX + 2, barY + 2, (barW - 4) * hpRatio, barH - 4);

        // HP text
        ctx.font = 'bold 13px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = '#FFF';
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        const hpText = `HP ${Math.ceil(player.hp)} / ${player.maxHp}`;
        ctx.strokeText(hpText, barX + barW / 2, barY + 16);
        ctx.fillText(hpText, barX + barW / 2, barY + 16);

        // HP icon
        ctx.fillStyle = '#E74C3C';
        ctx.font = '14px "Segoe UI", Arial, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('❤', barX - 18, barY + 16);
    }

    _drawMpBar(ctx, player) {
        const barX = 20;
        const barY = 46;
        const barW = 200;
        const barH = 16;

        // Background
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(barX - 2, barY - 2, barW + 4, barH + 4);
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX - 2, barY - 2, barW + 4, barH + 4);

        // MP bar background
        ctx.fillStyle = '#333';
        ctx.fillRect(barX, barY, barW, barH);

        // MP fill
        const mpRatio = player.mp / player.maxMp;
        const grad = ctx.createLinearGradient(barX, barY, barX + barW * mpRatio, barY);
        grad.addColorStop(0, '#3498DB');
        grad.addColorStop(1, '#2980B9');
        ctx.fillStyle = grad;
        ctx.fillRect(barX + 2, barY + 2, (barW - 4) * mpRatio, barH - 4);

        // MP text
        ctx.font = '11px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = '#FFF';
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1.5;
        const mpText = `MP ${Math.ceil(player.mp)} / ${player.maxMp}`;
        ctx.strokeText(mpText, barX + barW / 2, barY + 12);
        ctx.fillText(mpText, barX + barW / 2, barY + 12);

        // MP icon
        ctx.fillStyle = '#3498DB';
        ctx.font = '12px "Segoe UI", Arial, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('💧', barX - 17, barY + 11);
    }

    _drawExpBar(ctx, player) {
        const barX = 20;
        const barY = 68;
        const barW = 200;
        const barH = 12;

        // Background
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX - 1, barY - 1, barW + 2, barH + 2);

        // EXP fill
        const expRatio = player.exp / player.maxExp;
        const grad = ctx.createLinearGradient(barX, barY, barX + barW * expRatio, barY);
        grad.addColorStop(0, '#F1C40F');
        grad.addColorStop(1, '#F39C12');
        ctx.fillStyle = grad;
        ctx.fillRect(barX + 1, barY + 1, (barW - 2) * expRatio, barH - 2);

        // EXP text
        ctx.font = '9px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = '#FFF';
        ctx.textAlign = 'center';
        const expText = `EXP ${player.exp} / ${player.maxExp}`;
        ctx.fillText(expText, barX + barW / 2, barY + 10);
    }

    _drawLevelInfo(ctx, player) {
        ctx.font = 'bold 14px "Segoe UI", Arial, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#FFD700';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        const lvlText = `Lv.${player.level}`;
        ctx.strokeText(lvlText, 20, 102);
        ctx.fillText(lvlText, 20, 102);

        // Stats
        ctx.font = '11px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = '#CCC';
        ctx.textAlign = 'left';
        ctx.fillText(`STR: ${player.str}  DEX: ${player.dex}  ATK: ${player.attackDamage}`, 20, 120);
    }

    _drawMessages(ctx) {
        for (const msg of this.messages) {
            const alpha = Math.min(1, msg.duration / 20);
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.font = 'bold 22px "Segoe UI", Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 3;
            ctx.strokeText(msg.text, CONFIG.CANVAS_WIDTH / 2, msg.y);
            ctx.fillStyle = msg.color;
            ctx.fillText(msg.text, CONFIG.CANVAS_WIDTH / 2, msg.y);
            ctx.restore();
        }
    }

    _drawMiniMap(ctx, player, camera) {
        const mmX = CONFIG.CANVAS_WIDTH - 170;
        const mmY = 15;
        const mmW = 155;
        const mmH = 80;
        const scale = mmW / CONFIG.WORLD_WIDTH;

        // Background
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(mmX, mmY, mmW, mmH);
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(mmX, mmY, mmW, mmH);

        // Draw platforms
        ctx.fillStyle = 'rgba(102, 187, 106, 0.5)';
        for (const plat of CONFIG.PLATFORMS) {
            ctx.fillRect(mmX + plat.x * scale, mmY + (plat.y / CONFIG.CANVAS_HEIGHT) * mmH,
                Math.max(2, plat.w * scale), Math.max(2, plat.h * 0.3));
        }

        // Camera viewport
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 1;
        const viewX = mmX + camera.x * scale;
        const viewW = CONFIG.CANVAS_WIDTH * scale;
        ctx.strokeRect(viewX, mmY, viewW, mmH);

        // Player dot
        ctx.fillStyle = '#FF6B6B';
        ctx.beginPath();
        ctx.arc(mmX + player.centerX * scale, mmY + (player.y / CONFIG.CANVAS_HEIGHT) * mmH, 3, 0, Math.PI * 2);
        ctx.fill();

        // Mini-map label
        ctx.font = '9px "Segoe UI", Arial, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.fillText('MAP', mmX + mmW - 3, mmY + 10);
    }
}
