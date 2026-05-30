// Main Game - Initialization and Game Loop
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = CONFIG.CANVAS_WIDTH;
canvas.height = CONFIG.CANVAS_HEIGHT;

// Game state
let gameRunning = true;

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

// Game update function
function update() {
    // Update player
    player.update(input, gameMap.platforms);

    // Update camera
    camera.follow(player);

    // Update monsters
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
                // One hit per attack
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

    // Particles update
    particles.update();

    // Damage numbers update
    damageNumbers.update();

    // Map update (clouds, etc.)
    gameMap.update(camera);

    // UI update
    ui.update();

    // Respawn on Enter
    if (player.isDead && input.isPressed('Enter')) {
        player.respawn();
    }
}

// Level-up detection via polling
let prevLevel = 1;

function render() {
    ctx.clearRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

    // Draw background
    gameMap.drawBackground(ctx, camera);

    // Draw foreground trees
    gameMap.drawForeground(ctx, camera);

    // Draw platforms
    gameMap.drawPlatforms(ctx, camera);

    // Draw grass
    gameMap.drawGrass(ctx, camera);

    // Draw monsters
    for (const monster of monsters) {
        monster.draw(ctx, camera);
    }

    // Draw player
    player.draw(ctx, camera);

    // Draw particles
    particles.draw(ctx);

    // Draw damage numbers
    damageNumbers.draw(ctx, camera);

    // Draw UI (on top of everything)
    ui.draw(ctx, player, camera);
}

// Check level-up on separate tracking
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

// Game loop
function gameLoop() {
    if (!gameRunning) return;
    update();
    checkLevelUp();
    render();
    input.update();
    requestAnimationFrame(gameLoop);
}

// Handle window resize
function handleResize() {
    const container = document.getElementById('gameContainer');
    const maxWidth = window.innerWidth - 20;
    const maxHeight = window.innerHeight - 20;
    const scale = Math.min(maxWidth / CONFIG.CANVAS_WIDTH, maxHeight / CONFIG.CANVAS_HEIGHT);
    const scaledW = CONFIG.CANVAS_WIDTH * scale;
    const scaledH = CONFIG.CANVAS_HEIGHT * scale;
    canvas.style.width = `${Math.floor(scaledW)}px`;
    canvas.style.height = `${Math.floor(scaledH)}px`;
}

window.addEventListener('resize', handleResize);

// Start the game
handleResize();
gameLoop();

// Keyboard hints overlay
console.log('🎮 MapleStory HTML Game');
console.log('Controls: Arrow Keys/WASD - Move, Space/Up/W - Jump, Z/J - Attack');
