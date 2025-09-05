// フロッガー - ゲームロジック

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ゲーム状態
let gameState = {
    score: 0,
    lives: 3,
    gameOver: false,
    level: 1,
    isDemo: false,
    lastUserInput: Date.now(),
    demoMoveTimer: 0,
    demoTarget: { x: 380, y: 50 }
};

// 効果音システム
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

function playJumpSound() {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
}

function playScoreSound() {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(500, audioContext.currentTime + 0.1);
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.2);
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.3);
    
    gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.4, audioContext.currentTime + 0.3);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
}

function playDeathSound() {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.5);
    
    gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
}

function playGameOverSound() {
    const oscillator1 = audioContext.createOscillator();
    const oscillator2 = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator1.connect(gainNode);
    oscillator2.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator1.frequency.setValueAtTime(300, audioContext.currentTime);
    oscillator1.frequency.exponentialRampToValueAtTime(150, audioContext.currentTime + 1);
    
    oscillator2.frequency.setValueAtTime(200, audioContext.currentTime);
    oscillator2.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 1);
    
    gainNode.gain.setValueAtTime(0.6, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
    
    oscillator1.start(audioContext.currentTime);
    oscillator2.start(audioContext.currentTime);
    oscillator1.stop(audioContext.currentTime + 1);
    oscillator2.stop(audioContext.currentTime + 1);
}

// カエル
const frog = {
    x: 380,
    y: 550,
    width: 40,
    height: 40,
    startX: 380,
    startY: 550,
    isJumping: false,
    jumpProgress: 0,
    jumpStartX: 0,
    jumpStartY: 0,
    jumpEndX: 0,
    jumpEndY: 0,
    jumpDuration: 200 // ミリ秒
};

// 車と丸太の配列
let cars = [];
let logs = [];

// ゲームエリアの設定
const ROAD_START = 300;
const ROAD_END = 500;
const WATER_START = 100;
const WATER_END = 250;
const GOAL_Y = 50;

// 初期化
function init() {
    createObstacles();
    gameLoop();
}

// 障害物を作成
function createObstacles() {
    cars = [];
    logs = [];
    
    // 車を作成（道路エリア）
    for (let lane = 0; lane < 4; lane++) {
        const y = ROAD_START + lane * 50;
        const direction = lane % 2 === 0 ? 1 : -1;
        const speed = 2 + Math.random() * 2;
        
        for (let i = 0; i < 3; i++) {
            cars.push({
                x: direction > 0 ? -100 - i * 200 : canvas.width + i * 200,
                y: y,
                width: 60,
                height: 30,
                speed: speed * direction,
                color: ['#f00', '#00f', '#ff0', '#f0f'][lane]
            });
        }
    }
    
    // 丸太を作成（川エリア）
    for (let lane = 0; lane < 3; lane++) {
        const y = WATER_START + lane * 50;
        const direction = lane % 2 === 0 ? 1 : -1;
        const speed = 1 + Math.random() * 1.5;
        
        for (let i = 0; i < 2; i++) {
            logs.push({
                x: direction > 0 ? -150 - i * 300 : canvas.width + i * 300,
                y: y,
                width: 120,
                height: 30,
                speed: speed * direction
            });
        }
    }
}

// 描画関数
function draw() {
    // 背景をクリア
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 道路を描画
    ctx.fillStyle = '#333';
    ctx.fillRect(0, ROAD_START, canvas.width, ROAD_END - ROAD_START);
    
    // 川を描画
    ctx.fillStyle = '#006';
    ctx.fillRect(0, WATER_START, canvas.width, WATER_END - WATER_START);
    
    // ゴールエリアを描画
    ctx.fillStyle = '#060';
    ctx.fillRect(0, 0, canvas.width, GOAL_Y);
    
    // 安全地帯を描画
    ctx.fillStyle = '#040';
    ctx.fillRect(0, GOAL_Y, canvas.width, 50);
    ctx.fillRect(0, 250, canvas.width, 50);
    ctx.fillRect(0, 500, canvas.width, 50);
    
    // 車を描画
    cars.forEach(car => {
        ctx.fillStyle = car.color;
        ctx.fillRect(car.x, car.y, car.width, car.height);
        // 車のライト
        ctx.fillStyle = '#fff';
        if (car.speed > 0) {
            ctx.fillRect(car.x + car.width - 5, car.y + 5, 3, 8);
            ctx.fillRect(car.x + car.width - 5, car.y + car.height - 13, 3, 8);
        } else {
            ctx.fillRect(car.x + 2, car.y + 5, 3, 8);
            ctx.fillRect(car.x + 2, car.y + car.height - 13, 3, 8);
        }
    });
    
    // 丸太を描画
    logs.forEach(log => {
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(log.x, log.y, log.width, log.height);
        // 丸太の模様
        ctx.fillStyle = '#654321';
        for (let i = 0; i < log.width; i += 20) {
            ctx.fillRect(log.x + i, log.y + 5, 2, log.height - 10);
        }
    });
    
    // カエルを描画
    drawFrog();
}

function drawFrog() {
    let drawX = frog.x;
    let drawY = frog.y;
    let scale = 1;
    
    // ジャンプアニメーション
    if (frog.isJumping) {
        const progress = frog.jumpProgress;
        // 放物線を描く（上に跳ね上がる）
        const jumpHeight = Math.sin(progress * Math.PI) * 20;
        drawY -= jumpHeight;
        
        // ジャンプ中は少し大きく見せる
        scale = 1 + Math.sin(progress * Math.PI) * 0.3;
    }
    
    // カエルの体
    ctx.fillStyle = '#0f0';
    const scaledWidth = frog.width * scale;
    const scaledHeight = frog.height * scale;
    const offsetX = (scaledWidth - frog.width) / 2;
    const offsetY = (scaledHeight - frog.height) / 2;
    
    ctx.fillRect(drawX - offsetX, drawY - offsetY, scaledWidth, scaledHeight);
    
    // カエルの目
    ctx.fillStyle = '#000';
    const eyeSize = 6 * scale;
    ctx.fillRect(drawX - offsetX + 8 * scale, drawY - offsetY + 5 * scale, eyeSize, eyeSize);
    ctx.fillRect(drawX - offsetX + 26 * scale, drawY - offsetY + 5 * scale, eyeSize, eyeSize);
    
    // カエルの口
    ctx.fillStyle = '#000';
    ctx.fillRect(drawX - offsetX + 15 * scale, drawY - offsetY + 25 * scale, 10 * scale, 3 * scale);
    
    // デモモード中は光る輪郭を追加
    if (gameState.isDemo) {
        ctx.strokeStyle = '#ff0';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.5 + Math.sin(Date.now() / 200) * 0.3;
        ctx.strokeRect(drawX - offsetX - 2, drawY - offsetY - 2, scaledWidth + 4, scaledHeight + 4);
        ctx.globalAlpha = 1;
    }
    
    // ジャンプ中は足を描画
    if (frog.isJumping) {
        ctx.fillStyle = '#0a0';
        // 後ろ足
        ctx.fillRect(drawX - offsetX - 5, drawY - offsetY + scaledHeight - 10, 8, 15);
        ctx.fillRect(drawX - offsetX + scaledWidth - 3, drawY - offsetY + scaledHeight - 10, 8, 15);
        // 前足
        ctx.fillRect(drawX - offsetX + 5, drawY - offsetY + 10, 6, 12);
        ctx.fillRect(drawX - offsetX + scaledWidth - 11, drawY - offsetY + 10, 6, 12);
    }
}

// デモプレイのAI制御
function updateDemoAI() {
    gameState.demoMoveTimer++;
    
    // 45フレームごとに行動を決定（約0.75秒）
    if (gameState.demoMoveTimer < 45 || frog.isJumping) return;
    
    gameState.demoMoveTimer = 0;
    
    const moveDistance = 50;
    
    // 現在の位置に基づいてシンプルな判断
    // 基本戦略：前進を優先し、危険があれば回避
    
    // ゴールエリアに到達していない場合は前進を試みる
    if (frog.y > GOAL_Y) {
        // 道路エリアにいる場合
        if (frog.y >= ROAD_START && frog.y <= ROAD_END) {
            // 車をチェック
            let canMoveUp = true;
            const nextY = frog.y - moveDistance;
            
            cars.forEach(car => {
                // 次の位置で車と衝突するかチェック
                if (Math.abs(car.y - nextY) < 40) {
                    const futureCarX = car.x + car.speed * 10; // 少し先の車の位置を予測
                    if (Math.abs(futureCarX - frog.x) < 80) {
                        canMoveUp = false;
                    }
                }
            });
            
            if (canMoveUp) {
                simulateKeyPress('ArrowUp');
            } else {
                // 左右に避ける
                const dodgeDirection = Math.random() > 0.5 ? 'ArrowLeft' : 'ArrowRight';
                if (dodgeDirection === 'ArrowLeft' && frog.x > 50) {
                    simulateKeyPress('ArrowLeft');
                } else if (dodgeDirection === 'ArrowRight' && frog.x < canvas.width - frog.width - 50) {
                    simulateKeyPress('ArrowRight');
                }
            }
        }
        // 水エリアにいる場合
        else if (frog.y >= WATER_START && frog.y <= WATER_END) {
            // 現在丸太に乗っているかチェック
            let currentLog = null;
            logs.forEach(log => {
                if (frog.x + frog.width > log.x && frog.x < log.x + log.width &&
                    frog.y + frog.height > log.y && frog.y < log.y + log.height) {
                    currentLog = log;
                }
            });
            
            if (currentLog) {
                // 丸太の端に近づいたら中央へ移動
                const logCenter = currentLog.x + currentLog.width / 2;
                const frogCenter = frog.x + frog.width / 2;
                
                if (frogCenter < logCenter - 20 && frog.x < canvas.width - frog.width - 50) {
                    simulateKeyPress('ArrowRight');
                } else if (frogCenter > logCenter + 20 && frog.x > 50) {
                    simulateKeyPress('ArrowLeft');
                } else {
                    // 次の丸太へジャンプするタイミングを探る
                    let canJump = false;
                    const nextY = frog.y - moveDistance;
                    
                    logs.forEach(log => {
                        if (Math.abs(log.y - nextY) < 30) {
                            const futureLogX = log.x + log.speed * 15;
                            if (Math.abs(futureLogX + log.width/2 - frogCenter) < 60) {
                                canJump = true;
                            }
                        }
                    });
                    
                    if (canJump || nextY < WATER_START) {
                        simulateKeyPress('ArrowUp');
                    }
                }
            } else {
                // 丸太に乗っていない場合は緊急回避
                simulateKeyPress('ArrowDown');
            }
        }
        // 安全地帯にいる場合
        else {
            // 単純に前進
            simulateKeyPress('ArrowUp');
        }
    }
}

// キー入力をシミュレート
function simulateKeyPress(key) {
    if (frog.isJumping) return;
    
    const moveDistance = 50;
    let newX = frog.x;
    let newY = frog.y;
    
    switch(key) {
        case 'ArrowUp':
            if (frog.y > 0) newY = frog.y - moveDistance;
            break;
        case 'ArrowDown':
            if (frog.y < canvas.height - frog.height) newY = frog.y + moveDistance;
            break;
        case 'ArrowLeft':
            if (frog.x > 0) newX = frog.x - moveDistance;
            break;
        case 'ArrowRight':
            if (frog.x < canvas.width - frog.width) newX = frog.x + moveDistance;
            break;
    }
    
    if (newX !== frog.x || newY !== frog.y) {
        playJumpSound();
        frog.jumpStartX = frog.x;
        frog.jumpStartY = frog.y;
        frog.jumpEndX = newX;
        frog.jumpEndY = newY;
        frog.isJumping = true;
        frog.jumpProgress = 0;
    }
}

// デモモードのチェック
function checkDemoMode() {
    if (gameState.gameOver) return;
    
    // 5秒間操作がなければデモモード開始
    if (!gameState.isDemo && Date.now() - gameState.lastUserInput > 5000) {
        startDemo();
    }
}

// デモモード開始
function startDemo() {
    gameState.isDemo = true;
    gameState.demoMoveTimer = 0;
    restart(); // ゲームをリセット
    document.getElementById('demoText').style.display = 'block';
}

// デモモード終了
function stopDemo() {
    if (gameState.isDemo) {
        gameState.isDemo = false;
        document.getElementById('demoText').style.display = 'none';
        restart(); // ゲームをリセット
    }
}

// 更新関数
function update() {
    if (gameState.gameOver && !gameState.isDemo) return;
    
    // デモモードのチェック
    checkDemoMode();
    
    // デモモード中はAIが操作
    if (gameState.isDemo) {
        updateDemoAI();
        
        // デモモード中にゲームオーバーしたら自動リスタート
        if (gameState.gameOver) {
            setTimeout(() => {
                gameState.score = 0;
                gameState.lives = 3;
                gameState.gameOver = false;
                gameState.isDemo = true; // デモモードを維持
                resetFrog();
                createObstacles();
                document.getElementById('gameOverText').style.display = 'none';
            }, 2000);
        }
    }
    
    // カエルのジャンプアニメーション更新
    if (frog.isJumping) {
        frog.jumpProgress += 1/12; // 60FPSで約200ms
        
        if (frog.jumpProgress >= 1) {
            frog.jumpProgress = 0;
            frog.isJumping = false;
            frog.x = frog.jumpEndX;
            frog.y = frog.jumpEndY;
        } else {
            // スムーズな移動
            const easeProgress = frog.jumpProgress;
            frog.x = frog.jumpStartX + (frog.jumpEndX - frog.jumpStartX) * easeProgress;
            frog.y = frog.jumpStartY + (frog.jumpEndY - frog.jumpStartY) * easeProgress;
        }
    }
    
    // 車を更新
    cars.forEach(car => {
        car.x += car.speed;
        
        // 画面外に出たら反対側から出現
        if (car.speed > 0 && car.x > canvas.width + 100) {
            car.x = -car.width - 100;
        } else if (car.speed < 0 && car.x < -car.width - 100) {
            car.x = canvas.width + 100;
        }
    });
    
    // 丸太を更新
    logs.forEach(log => {
        log.x += log.speed;
        
        // 画面外に出たら反対側から出現
        if (log.speed > 0 && log.x > canvas.width + 150) {
            log.x = -log.width - 150;
        } else if (log.speed < 0 && log.x < -log.width - 150) {
            log.x = canvas.width + 150;
        }
    });
    
    // 衝突判定
    checkCollisions();
    
    // ゴール判定
    if (frog.y <= GOAL_Y) {
        gameState.score += 100;
        playScoreSound(); // 得点効果音
        resetFrog();
    }
}

function checkCollisions() {
    // 車との衝突
    if (frog.y >= ROAD_START && frog.y <= ROAD_END - frog.height) {
        cars.forEach(car => {
            if (frog.x < car.x + car.width &&
                frog.x + frog.width > car.x &&
                frog.y < car.y + car.height &&
                frog.y + frog.height > car.y) {
                loseLife();
            }
        });
    }
    
    // 水エリアでの丸太判定
    if (frog.y >= WATER_START && frog.y <= WATER_END - frog.height) {
        let onLog = false;
        logs.forEach(log => {
            if (frog.x < log.x + log.width &&
                frog.x + frog.width > log.x &&
                frog.y < log.y + log.height &&
                frog.y + frog.height > log.y) {
                onLog = true;
                // 丸太と一緒に移動
                frog.x += log.speed;
            }
        });
        
        if (!onLog) {
            loseLife();
        }
    }
    
    // 画面外チェック
    if (frog.x < 0 || frog.x > canvas.width - frog.width) {
        loseLife();
    }
}

function loseLife() {
    playDeathSound(); // 死亡効果音
    gameState.lives--;
    if (gameState.lives <= 0) {
        gameOver();
    } else {
        resetFrog();
    }
}

function resetFrog() {
    frog.x = frog.startX;
    frog.y = frog.startY;
    frog.isJumping = false;
    frog.jumpProgress = 0;
}

function gameOver() {
    gameState.gameOver = true;
    playGameOverSound(); // ゲームオーバー効果音
    document.getElementById('gameOverText').style.display = 'block';
}

function restart() {
    gameState.score = 0;
    gameState.lives = 3;
    gameState.gameOver = false;
    resetFrog();
    createObstacles();
    document.getElementById('gameOverText').style.display = 'none';
    
    // デモモードでない場合は入力時間を更新
    if (!gameState.isDemo) {
        gameState.lastUserInput = Date.now();
    }
}

// キーボード入力
const keys = {};

document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    
    // ユーザー入力を記録
    gameState.lastUserInput = Date.now();
    
    // デモモード中の場合は終了
    if (gameState.isDemo) {
        stopDemo();
        return;
    }
    
    if (gameState.gameOver && e.key.toLowerCase() === 'r') {
        restart();
        return;
    }
    
    if (gameState.gameOver || frog.isJumping) return;
    
    const moveDistance = 50;
    let newX = frog.x;
    let newY = frog.y;
    
    switch(e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            if (frog.y > 0) newY = frog.y - moveDistance;
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            if (frog.y < canvas.height - frog.height) newY = frog.y + moveDistance;
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            if (frog.x > 0) newX = frog.x - moveDistance;
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            if (frog.x < canvas.width - frog.width) newX = frog.x + moveDistance;
            break;
    }
    
    // ジャンプアニメーションを開始
    if (newX !== frog.x || newY !== frog.y) {
        playJumpSound(); // ジャンプ効果音
        frog.jumpStartX = frog.x;
        frog.jumpStartY = frog.y;
        frog.jumpEndX = newX;
        frog.jumpEndY = newY;
        frog.isJumping = true;
        frog.jumpProgress = 0;
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// UI更新
function updateUI() {
    document.getElementById('score').textContent = gameState.score;
    document.getElementById('lives').textContent = gameState.lives;
}

// ゲームループ
function gameLoop() {
    update();
    draw();
    updateUI();
    requestAnimationFrame(gameLoop);
}

// ゲーム開始
init();