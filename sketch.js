let player;
let bullets = [];
let enemies = [];
let enemyBullets = [];
let gameOver = false;
let victory = false;
let shootCooldown = 0;
let enemiesKilled = 0;
let boss = null;
let bossSpawned = false;
let bossLife = 14;
let bossMaxLife = 14;
let bossShootCooldown = 0;

function setup() {
  createCanvas(600, 600);
  startGame();
}

function startGame() {
  player = new Player();
  bullets = [];
  enemies = [];
  enemyBullets = [];
  gameOver = false;
  victory = false;
  shootCooldown = 0;
  enemiesKilled = 0;
  boss = null;
  bossSpawned = false;
  bossLife = bossMaxLife;
  spawnEnemies(5);
}

function draw() {
  background(0);

  // Mostrar tela game over
  if (gameOver) {
    fill(255, 0, 0);
    textAlign(CENTER, CENTER);
    textSize(48);
    text("GAME OVER", width / 2, height / 2);
    textSize(20);
    text("Pressione ENTER para reiniciar", width / 2, height / 2 + 50);
    return; // não atualiza o resto do jogo
  }

  // Mostrar tela vitória
  if (victory) {
    fill(0, 255, 0);
    textAlign(CENTER, CENTER);
    textSize(48);
    text("VOCÊ VENCEU!", width / 2, height / 2);
    textSize(20);
    text("Pressione ENTER para jogar de novo", width / 2, height / 2 + 50);
    return;
  }

  // HUD
  fill(255);
  textSize(16);
  textAlign(LEFT, TOP);
  text("Inimigos derrotados: " + enemiesKilled, 10, 10);

  player.update();
  player.show();

  if (shootCooldown > 0) shootCooldown--;

  // Tiro contínuo segurando espaço
  if (keyIsDown(32) && shootCooldown === 0) {
    bullets.push(new Bullet(player.x, player.y));
    shootCooldown = 10;
  }

  // Atualizar e mostrar tiros do jogador
  for (let i = bullets.length - 1; i >= 0; i--) {
    bullets[i].update();
    bullets[i].show();
    if (bullets[i].offscreen()) {
      bullets.splice(i, 1);
    }
  }

  // Spawn de inimigos pequenos a cada segundo, só se chefe não apareceu
  if (frameCount % 60 === 0 && !bossSpawned) {
    spawnEnemies(1);
  }

  // Atualizar inimigos pequenos
  for (let i = enemies.length - 1; i >= 0; i--) {
    enemies[i].update();
    enemies[i].show();

    if (enemies[i].hitsPlayer(player)) {
      gameOver = true;
    }

    for (let j = bullets.length - 1; j >= 0; j--) {
      if (enemies[i] && enemies[i].hits(bullets[j])) {
        enemies.splice(i, 1);
        bullets.splice(j, 1);
        enemiesKilled++;
        break;
      }
    }
  }

  // Aparecer chefe após matar 20 inimigos pequenos
  if (enemiesKilled >= 20 && !bossSpawned) {
    boss = new Boss(width / 2, 100);
    bossSpawned = true;
    bossLife = bossMaxLife;
  }

  // Atualizar chefe e seus tiros
  if (boss) {
    boss.update();
    boss.show();
    boss.showLifeBar();

    if (bossShootCooldown > 0) bossShootCooldown--;
    if (bossShootCooldown === 0) {
      boss.shoot();
      bossShootCooldown = 60;
    }

    for (let i = bullets.length - 1; i >= 0; i--) {
      if (!boss) break; // evita erro caso boss seja removido no loop

      if (boss.hits(bullets[i])) {
        bullets.splice(i, 1);
        bossLife--;
        if (bossLife <= 0) {
          boss = null;
          victory = true;
          break; // para o loop para evitar erros
        }
      }
    }
  }

  // Atualizar tiros do chefe
  for (let i = enemyBullets.length - 1; i >= 0; i--) {
    enemyBullets[i].update();
    enemyBullets[i].show();
    if (enemyBullets[i].offscreen()) {
      enemyBullets.splice(i, 1);
    } else if (enemyBullets[i].hitsPlayer(player)) {
      gameOver = true;
    }
  }
}

function keyPressed() {
  // Reiniciar jogo com ENTER após game over ou vitória
  if ((gameOver || victory) && keyCode === ENTER) {
    startGame();
  }
}

// Spawn inimigos pequenos
function spawnEnemies(qtd) {
  for (let i = 0; i < qtd; i++) {
    let x = random(50, width - 50);
    let y = random(-100, -30);
    enemies.push(new Enemy(x, y));
  }
}

// Classes

class Player {
  constructor() {
    this.x = width / 2;
    this.y = height - 50;
    this.speed = 5;
  }

  update() {
    if (keyIsDown(LEFT_ARROW)) this.x -= this.speed;
    if (keyIsDown(RIGHT_ARROW)) this.x += this.speed;
    this.x = constrain(this.x, 20, width - 20);
  }

  show() {
    fill(0, 255, 0);
    triangle(this.x, this.y, this.x - 20, this.y + 30, this.x + 20, this.y + 30);
  }
}

class Bullet {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.speed = 8;
    this.width = 8;
    this.height = 16;
  }

  update() {
    this.y -= this.speed;
  }

  show() {
    fill(255, 255, 0);
    noStroke();
    rect(this.x - this.width / 2, this.y, this.width, this.height, 4);
  }

  offscreen() {
    return this.y < 0;
  }
}

class Enemy {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.speed = 2;
    this.size = 30;
  }

  update() {
    this.y += this.speed;
  }

  show() {
    fill(255, 0, 0);
    ellipse(this.x, this.y, this.size);
  }

  hits(bullet) {
    let d = dist(this.x, this.y, bullet.x, bullet.y);
    return d < this.size / 2;
  }

  hitsPlayer(player) {
    let d = dist(this.x, this.y, player.x, player.y);
    return d < this.size / 2 + 15;
  }
}

class Boss {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = 80;
    this.speed = 3;
    this.direction = 1;
  }

  update() {
    this.x += this.speed * this.direction;
    if (frameCount % 120 === 0) {
      this.speed = random(2, 4);
    }
    if (this.x > width - this.size / 2 || this.x < this.size / 2) {
      this.direction *= -1;
    }
  }

  show() {
    fill(200, 0, 200);
    ellipse(this.x, this.y, this.size);
  }

  showLifeBar() {
    let barWidth = 120;
    let barHeight = 15;
    let x = this.x - barWidth / 2;
    let y = this.y - this.size / 2 - 25;

    stroke(255);
    noFill();
    rect(x, y, barWidth, barHeight, 5);

    noStroke();

    let lifeRatio = bossLife / bossMaxLife;
    let r = lerp(255, 0, lifeRatio);
    let g = lerp(0, 255, lifeRatio);
    fill(r, g, 0);
    let lifeWidth = lifeRatio * barWidth;
    rect(x, y, lifeWidth, barHeight, 5);
  }

  hits(bullet) {
    let d = dist(this.x, this.y, bullet.x, bullet.y);
    return d < this.size / 2;
  }

  shoot() {
    let bx = this.x;
    let by = this.y + this.size / 2;
    // Tiros caindo para baixo (ângulo PI/2)
    for (let i = -2; i <= 2; i++) {
      enemyBullets.push(new EnemyBullet(bx + i * 15, by, PI / 2));
    }
  }
}

class EnemyBullet {
  constructor(x, y, angle = PI / 2) {
    this.x = x;
    this.y = y;
    this.speed = 7;
    this.angle = angle;
    this.size = 14;
  }

  update() {
    this.x += this.speed * cos(this.angle);
    this.y += this.speed * sin(this.angle);
  }

  show() {
    fill(255, 100, 0);
    ellipse(this.x, this.y, this.size);
  }

  offscreen() {
    return this.y > height + this.size || this.x < -this.size || this.x > width + this.size;
  }

  hitsPlayer(player) {
    let d = dist(this.x, this.y, player.x, player.y);
    return d < 15;
  }
}

