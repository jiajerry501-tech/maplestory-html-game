// Main Game - Initialization and Game Loop
(function() {
    let canvas, ctx;

    function init() {
        canvas = document.getElementById('gameCanvas');
        if (!canvas) {
            document.body.innerHTML = '<div style="color:red;padding:20px;">错误: 找不到 canvas 元素</div>';
            return;
        }
        ctx = canvas.getContext('2d');

        canvas.width = CONFIG.CANVAS_WIDTH;
        canvas.height = CONFIG.CANVAS_HEIGHT;

        // Initialize systems
        const input = new InputManager();
        const camera = new Camera(CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
        const gameMap = new GameMap();
        const player = new Player(100, 400);
        const particles = new ParticleSystem();
        const damageNumbers = new DamageNumbers();
        const ui = new UI();

        // Create monsters from spawn points
        const monsters = CONFIG.SPAWN_POINTS.map(spawn =>
            new Monster(spawn.x, spawn.y, spawn.type)
        );

        let prevLevel = 1;

        function update() {
            player.update(input, gameMap.platforms);
            camera.follow(player);

            for (const monster of monsters) {
                monster.update(player, gameMap.platforms);
            }

            // Player attack detection
            if (player.attackHitbox) {
                for (const monster of monsters) {
                    if (monster.isDead) continue;
                    if (Collision.aabb(player.attackHitbox, monster.getRect())) {
                        const killed = monster.takeDamage(player.attackDamage);
                        if (killed) {
                            player.addExp(monster.exp);
                            damageNumbers.add(monster.x + monster.width / 2, monster.y, monster.exp, '#FFD700');
                            particles.emit(monster.x + monster.width / 2, monster.y + monster.height / 2, 15, {
                                colors: ['#FFD700', '#FF6B6B', '#4FC3F7', '#FFF'],
                                spread: 30,
                            });
                            ui.onMonsterKilled();
                        } else {
                            damageNumbers.add(monster.x + monster.width / 2, monster.y, player.attackDamage, '#FFF');
                            particles.emit(monster.x + monster.width / 2, monster.y + monster.height / 2, 8, {
                                colors: ['#FFF', '#FFD700'],
                                spread: 15,
                            });
                        }
                        break;
                    }
                }
            }

            // Monster-player collision
            for (const monster of monsters) {
                if (monster.isDead) continue;
                if (Collision.aabb(player.getRect(), monster.getRect())) {
                    player.takeDamage(monster.damage);
                    damageNumbers.add(player.x + player.width / 2, player.y, monster.damage, '#FF6B6B');
                    particles.emit(player.centerX, player.centerY, 10, {
                        colors: ['#FF6B6B', '#FFF'],
                        spread: 20,
                    });
                }
            }

            particles.update();
            damageNumbers.update();
            gameMap.update(camera);
            ui.update();

            if (player.isDead && input.isPressed('Enter')) {
                player.respawn();
            }
        }

        function render() {
            ctx.clearRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

            gameMap.drawBackground(ctx, camera);
            gameMap.drawForeground(ctx, camera);
            gameMap.drawPlatforms(ctx, camera);
            gameMap.drawGrass(ctx, camera);

            for (const monster of monsters) {
                monster.draw(ctx, camera);
            }

            player.draw(ctx, camera);
            particles.draw(ctx);
            damageNumbers.draw(ctx, camera);
            ui.draw(ctx, player, camera);
        }

        function checkLevelUp() {
            if (player.level > prevLevel) {
                ui.showMessage(`升级! Lv.${player.level}`, '#FFD700', 150);
                ui.levelUpFlash = 40;
                particles.emit(player.centerX, player.centerY, 30, {
                    colors: ['#FFD700', '#FFA500', '#FFF', '#FF6B6B'],
                    spread: 50,
                    speedRange: [2, 6],
                });
                prevLevel = player.level;
            }
        }

        function gameLoop() {
            update();
            checkLevelUp();
            render();
            input.update();
            requestAnimationFrame(gameLoop);
        }

        function handleResize() {
            const maxWidth = window.innerWidth - 20;
            const maxHeight = window.innerHeight - 20;
            const scale = Math.min(maxWidth / CONFIG.CANVAS_WIDTH, maxHeight / CONFIG.CANVAS_HEIGHT);
            canvas.style.width = `${Math.floor(CONFIG.CANVAS_WIDTH * scale)}px`;
            canvas.style.height = `${Math.floor(CONFIG.CANVAS_HEIGHT * scale)}px`;
        }

        window.addEventListener('resize', handleResize);
        handleResize();
        gameLoop();

        console.log('🎮 MapleStory HTML Game started!');
        console.log('Controls: Arrow Keys/WASD - Move, Space/Up/W - Jump, Z/J - Attack');
    }

    // Wrap in try-catch for debugging
    try {
        init();
    } catch (e) {
        document.body.innerHTML = '<div style="color:#E74C3C;padding:20px;font-family:monospace;">' +
            '<h2>游戏加载失败</h2>' +
            '<p>' + e.toString() + '</p>' +
            '<pre style="margin-top:10px;background:#1a1a2e;padding:10px;overflow:auto;">' +
            (e.stack || 'No stack trace') + '</pre>' +
            '<p style="margin-top:10px;">请按 F12 打开控制台查看更多错误信息</p>' +
            '</div>';
        console.error('Game initialization error:', e);
    }
})();
