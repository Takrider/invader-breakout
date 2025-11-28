const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const livesElement = document.getElementById('lives');

// Audio Context
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();

const hiphopAudio = new Audio('hiphop.mp3');
hiphopAudio.loop = true;

function playSound(type) {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    if (type === 'paddle') {
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(500, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.1);
    } else if (type === 'pig') {
        // Oink sound (short, rough)
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(300, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.15);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.15);
    } else if (type === 'cow') {
        // Moo sound (low, long, sliding down)
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(120, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(80, audioCtx.currentTime + 0.8);
        gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.8);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.8);
    } else if (type === 'boss') {
        // Boss hit sound (heavy impact)
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(100, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.2);
        gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.2);
    } else if (type === 'wall') {
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(220, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.05);
    } else if (type === 'over') {
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(110, audioCtx.currentTime + 0.5);
        gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.5);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.5);
    } else if (type === 'win') {
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime + 0.2);
        oscillator.frequency.setValueAtTime(1760, audioCtx.currentTime + 0.4);
        gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.6);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.6);
    }
}

// Game Constants
const PADDLE_WIDTH = 100;
const PADDLE_HEIGHT = 15;
const BALL_RADIUS = 8;
const BRICK_ROW_COUNT = 5;
const BRICK_COLUMN_COUNT = 9;
const BRICK_WIDTH = 60;
const BRICK_HEIGHT = 30;
const BRICK_PADDING = 20;
const BRICK_OFFSET_TOP = 60;
const BRICK_OFFSET_LEFT = 45;

// Game State
let score = 0;
let lives = 5;
let gameRunning = false;
let gameOver = false;
let gameWon = false;

// Paddle
const paddle = {
    x: canvas.width / 2 - PADDLE_WIDTH / 2,
    y: canvas.height - 40,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    dx: 7,
    color: '#0f0'
};

// Ball
const ball = {
    x: canvas.width / 2,
    y: canvas.height - 50,
    dx: 4 * (Math.random() > 0.5 ? 1 : -1), // Random start direction
    dy: -4,
    radius: BALL_RADIUS,
    color: '#fff'
};

// Boss
const boss = {
    x: canvas.width / 2 - 50,
    y: 50,
    width: 100,
    height: 100,
    health: 10,
    maxHealth: 10,
    dx: 2,
    active: false,
    speechTimer: 0,
    invulnerableTimer: 0,
    dying: false,
    rotation: 0,
    fallSpeed: 0
};

// Bricks (Invaders)
const bricks = [];
for (let c = 0; c < BRICK_COLUMN_COUNT; c++) {
    bricks[c] = [];
    for (let r = 0; r < BRICK_ROW_COUNT; r++) {
        bricks[c][r] = { x: 0, y: 0, status: 1 };
    }
}

// Controls
let rightPressed = false;
let leftPressed = false;

document.addEventListener('keydown', keyDownHandler, false);
document.addEventListener('keyup', keyUpHandler, false);

function keyDownHandler(e) {
    if (e.key === 'Right' || e.key === 'ArrowRight') {
        rightPressed = true;
    } else if (e.key === 'Left' || e.key === 'ArrowLeft') {
        leftPressed = true;
    } else if (e.code === 'Space') {
        if (!gameRunning && !gameOver && !gameWon) {
            gameRunning = true;
            draw();
        } else if (gameOver || gameWon) {
            hiphopAudio.pause();
            hiphopAudio.currentTime = 0;
            document.location.reload();
        }
    }
}

function keyUpHandler(e) {
    if (e.key === 'Right' || e.key === 'ArrowRight') {
        rightPressed = false;
    } else if (e.key === 'Left' || e.key === 'ArrowLeft') {
        leftPressed = false;
    }
}

// Drawing Functions
function drawBall() {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = "#ffff00"; // Yellow face
    ctx.fill();
    ctx.closePath();

    // Eyes
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.arc(ball.x - 3, ball.y - 2, 1.5, 0, Math.PI * 2);
    ctx.arc(ball.x + 3, ball.y - 2, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Smile
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, 5, 0.2 * Math.PI, 0.8 * Math.PI);
    ctx.stroke();
}

function drawPaddle() {
    ctx.beginPath();
    ctx.rect(paddle.x, paddle.y, paddle.width, paddle.height);
    ctx.fillStyle = paddle.color;
    ctx.fill();
    ctx.closePath();
}

function drawBricks() {
    ctx.font = "24px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (let c = 0; c < BRICK_COLUMN_COUNT; c++) {
        for (let r = 0; r < BRICK_ROW_COUNT; r++) {
            if (bricks[c][r].status === 1) {
                const brickX = (c * (BRICK_WIDTH + BRICK_PADDING)) + BRICK_OFFSET_LEFT;
                const brickY = (r * (BRICK_HEIGHT + BRICK_PADDING)) + BRICK_OFFSET_TOP;
                bricks[c][r].x = brickX;
                bricks[c][r].y = brickY;

                // Draw animal emoji instead of rect
                let emoji = (r % 2 === 0) ? "🐷" : "🐮";
                ctx.fillText(emoji, brickX + BRICK_WIDTH / 2, brickY + BRICK_HEIGHT / 2);
            }
        }
    }
}

function drawBoss() {
    if (!boss.active) return;

    if (boss.dying) {
        boss.y += boss.fallSpeed;
        boss.rotation += 0.05;
        boss.fallSpeed += 0.1;

        if (boss.y > canvas.height + 200) {
            boss.active = false;
            gameWon = true;
            gameRunning = false;
        }
    } else {
        if (boss.invulnerableTimer > 0) {
            boss.invulnerableTimer--;
        }

        // Move Boss
        boss.x += boss.dx;
        if (boss.x + boss.width > canvas.width || boss.x < 0) {
            boss.dx = -boss.dx;
        }
    }

    const centerX = boss.x + boss.width / 2;
    const centerY = boss.y + boss.height / 2;

    ctx.save();
    ctx.translate(centerX, centerY);

    if (boss.dying) {
        ctx.rotate(boss.rotation);
    }

    // Flip if moving left
    if (boss.dx < 0) {
        ctx.scale(-1, 1);
    }

    // Draw Horse (Side View)
    // Head
    ctx.beginPath();
    ctx.ellipse(0, -10, 30, 15, Math.PI / 6, 0, Math.PI * 2);
    ctx.fillStyle = "#8B4513"; // SaddleBrown
    ctx.fill();

    // Snout
    ctx.beginPath();
    ctx.ellipse(25, -5, 15, 10, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#A0522D"; // Sienna
    ctx.fill();

    // Neck
    ctx.beginPath();
    ctx.moveTo(-15, -5);
    ctx.lineTo(-25, 40);
    ctx.lineTo(10, 40);
    ctx.lineTo(5, 5);
    ctx.fillStyle = "#8B4513";
    ctx.fill();

    // Ears
    ctx.beginPath();
    ctx.moveTo(-15, -20);
    ctx.lineTo(-20, -40);
    ctx.lineTo(-5, -25);
    ctx.fillStyle = "#8B4513";
    ctx.fill();

    // Mane
    ctx.beginPath();
    ctx.moveTo(-18, -30);
    ctx.quadraticCurveTo(-35, -10, -28, 30);
    ctx.lineTo(-20, 30);
    ctx.quadraticCurveTo(-25, 0, -15, -20);
    ctx.fillStyle = "#000";
    ctx.fill();

    // Eye
    ctx.beginPath();
    ctx.arc(5, -15, 3, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(6, -15, 1.5, 0, Math.PI * 2);
    ctx.fillStyle = "#000";
    ctx.fill();

    // Nostril
    ctx.beginPath();
    ctx.arc(30, -5, 1.5, 0, Math.PI * 2);
    ctx.fillStyle = "#000";
    ctx.fill();

    ctx.restore();

    ctx.restore();

    // Speech Bubble
    if (boss.dying) {
        const bubbleX = centerX + (boss.dx > 0 ? -60 : 60);
        const bubbleY = centerY - 50;

        ctx.beginPath();
        ctx.ellipse(bubbleX, bubbleY, 80, 30, 0, 0, Math.PI * 2);
        ctx.fillStyle = "#fff";
        ctx.fill();
        ctx.strokeStyle = "#000";
        ctx.stroke();
        ctx.closePath();

        // Tail
        ctx.beginPath();
        ctx.moveTo(bubbleX + (boss.dx > 0 ? 20 : -20), bubbleY + 25);
        ctx.lineTo(centerX, centerY - 20);
        ctx.lineTo(bubbleX + (boss.dx > 0 ? 40 : -40), bubbleY + 20);
        ctx.fill();
        ctx.stroke();
        ctx.closePath();

        ctx.font = "14px 'Press Start 2P'";
        ctx.fillStyle = "#000";
        ctx.textAlign = "center";
        ctx.fillText("ヒヒ〜ん", bubbleX, bubbleY + 5);
    } else if (boss.speechTimer > 0) {
        boss.speechTimer--;

        const bubbleX = centerX + (boss.dx > 0 ? -60 : 60); // Position behind the horse
        const bubbleY = centerY - 50;

        ctx.beginPath();
        ctx.ellipse(bubbleX, bubbleY, 80, 30, 0, 0, Math.PI * 2);
        ctx.fillStyle = "#fff";
        ctx.fill();
        ctx.strokeStyle = "#000";
        ctx.stroke();
        ctx.closePath();

        // Tail
        ctx.beginPath();
        ctx.moveTo(bubbleX + (boss.dx > 0 ? 20 : -20), bubbleY + 25);
        ctx.lineTo(centerX, centerY - 20);
        ctx.lineTo(bubbleX + (boss.dx > 0 ? 40 : -40), bubbleY + 20);
        ctx.fill();
        ctx.stroke();
        ctx.closePath();

        ctx.font = "14px 'Press Start 2P'";
        ctx.fillStyle = "#000";
        ctx.textAlign = "center";
        ctx.fillText("このヒマ人が！", bubbleX, bubbleY + 5);
    }
}

function drawMessage(text, subtext) {
    ctx.font = "40px 'Press Start 2P'";
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    if (subtext) {
        ctx.font = "20px 'Press Start 2P'";
        ctx.fillText(subtext, canvas.width / 2, canvas.height / 2 + 50);
    }
}

// Collision Detection
function collisionDetection() {
    for (let c = 0; c < BRICK_COLUMN_COUNT; c++) {
        for (let r = 0; r < BRICK_ROW_COUNT; r++) {
            const b = bricks[c][r];
            if (b.status === 1) {
                if (ball.x > b.x && ball.x < b.x + BRICK_WIDTH && ball.y > b.y && ball.y < b.y + BRICK_HEIGHT) {
                    ball.dy = -ball.dy;
                    b.status = 0;
                    score += 10;
                    scoreElement.innerText = score;

                    // Play animal sound based on row
                    if (r % 2 === 0) {
                        playSound('pig');
                    } else {
                        playSound('cow');
                    }

                    if (score === BRICK_ROW_COUNT * BRICK_COLUMN_COUNT * 10) {
                        // Activate Boss Mode instead of winning immediately
                        boss.active = true;
                        // Reset ball
                        ball.x = canvas.width / 2;
                        ball.y = canvas.height - 50;
                        ball.dx = 4 * (Math.random() > 0.5 ? 1 : -1);
                        ball.dy = -4;
                    }
                }
            }
        }
    }

    // Boss Collision
    if (boss.active) {
        if (ball.x > boss.x && ball.x < boss.x + boss.width && ball.y > boss.y && ball.y < boss.y + boss.height) {
            if (boss.invulnerableTimer === 0) {
                ball.dy = -ball.dy;
                boss.health--;
                boss.speechTimer = 60; // Show speech for 60 frames
                boss.invulnerableTimer = 30; // Invulnerable for 30 frames (0.5s)
                playSound('boss');

                if (boss.health <= 0) {
                    boss.dying = true;
                    boss.fallSpeed = 1;
                    playSound('win');
                    hiphopAudio.play().catch(e => console.log("Audio play failed:", e));
                }
            }
        }
    }
}

// Main Game Loop
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (boss.active) {
        drawBoss();
    } else {
        drawBricks();
    }
    drawPaddle();

    if (!gameRunning) {
        if (gameOver) {
            drawMessage("GAME OVER", "Press SPACE to Retry");
        } else if (gameWon) {
            drawMessage("YOU WIN!", "Press SPACE to Play Again");
        } else {
            drawBall(); // Show ball at start position
            drawMessage("READY?", "Press SPACE to Start");
        }
        return;
    }

    drawBall();
    collisionDetection();

    // Ball Movement
    if (ball.x + ball.dx > canvas.width - ball.radius || ball.x + ball.dx < ball.radius) {
        ball.dx = -ball.dx;
        playSound('wall');
    }
    if (ball.y + ball.dy < ball.radius) {
        ball.dy = -ball.dy;
        playSound('wall');
    } else if (ball.dy > 0 && ball.y + ball.radius >= paddle.y && ball.x > paddle.x && ball.x < paddle.x + paddle.width) {
        // Paddle collision logic - add some angle variation
        let collidePoint = ball.x - (paddle.x + paddle.width / 2);
        collidePoint = collidePoint / (paddle.width / 2);

        let angle = collidePoint * (Math.PI / 3); // Max 60 degree angle

        let speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);

        // Increase speed slightly on every paddle hit for difficulty
        speed = Math.min(speed * 1.05, 12);

        ball.dx = speed * Math.sin(angle);
        ball.dy = -speed * Math.cos(angle);
        playSound('paddle');
    } else if (ball.y + ball.dy > canvas.height - ball.radius) {
        // Missed paddle
        lives--;
        livesElement.innerText = lives;
        if (!lives) {
            gameOver = true;
            gameRunning = false;
            playSound('over');
        } else {
            // Reset ball and paddle
            ball.x = canvas.width / 2;
            ball.y = canvas.height - 50;
            ball.dx = 4 * (Math.random() > 0.5 ? 1 : -1); // Random start direction
            ball.dy = -4;
            paddle.x = (canvas.width - PADDLE_WIDTH) / 2;
            gameRunning = false; // Pause before next life
        }
    }

    ball.x += ball.dx;
    ball.y += ball.dy;

    // Paddle Movement
    if (rightPressed && paddle.x < canvas.width - paddle.width) {
        paddle.x += paddle.dx;
    } else if (leftPressed && paddle.x > 0) {
        paddle.x -= paddle.dx;
    }

    if (gameRunning) {
        requestAnimationFrame(draw);
    } else {
        draw(); // Draw one last frame to show game over state
    }
}

// Initial draw
draw();
