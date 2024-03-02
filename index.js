// Importy klas (zakładam, że masz je w osobnych plikach)
import Player from "./Player.js";
import Ground from "./Ground.js";
import CactiController from "./CactiController.js";
import BirdController from "./BirdController.js"; // Nowa klasa dla ptaków
import Score from "./Score.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// Konfiguracja gry
const GAME_SPEED_START = 1; 
const GAME_SPEED_INCREMENT = 0.00001;

const GAME_WIDTH = 800;
const GAME_HEIGHT = 200;

// Konfiguracja gracza
const PLAYER_WIDTH = 88 / 1.5; 
const PLAYER_HEIGHT = 94 / 1.5; 
const MAX_JUMP_HEIGHT = GAME_HEIGHT;
const MIN_JUMP_HEIGHT = 150;

// Konfiguracja ziemi
const GROUND_WIDTH = 2400;
const GROUND_HEIGHT = 24;
const GROUND_AND_CACTUS_SPEED = 0.5;

// Konfiguracja kaktusów
const CACTI_CONFIG = [
  { width: 48 / 1.5, height: 100 / 1.5, image: "images/cactus_1.png" },
  { width: 98 / 1.5, height: 100 / 1.5, image: "images/cactus_2.png" },
  { width: 68 / 1.5, height: 70 / 1.5, image: "images/cactus_3.png" },
];

// Obiekty gry
let player = null;
let ground = null;
let cactiController = null;
let birdController = null; // Nowy kontroler dla ptaków
let score = null;

let scaleRatio = null;
let previousTime = null;
let gameSpeed = GAME_SPEED_START;
let gameOver = false;
let deathSoundPlayed = false; // Kontrola odtwarzania dźwięku
let hasAddedEventListenersForRestart = false;
let waitingToStart = true;

const deathSound = new Audio('images/smutnasprawa.mp4'); // Ścieżka do dźwięku porażki

function createSprites() {
  scaleRatio = getScaleRatio();

  player = new Player(ctx, PLAYER_WIDTH * scaleRatio, PLAYER_HEIGHT * scaleRatio, MIN_JUMP_HEIGHT * scaleRatio, MAX_JUMP_HEIGHT * scaleRatio, scaleRatio);
  ground = new Ground(ctx, GROUND_WIDTH * scaleRatio, GROUND_HEIGHT * scaleRatio, GROUND_AND_CACTUS_SPEED, scaleRatio);
  
  const cactiImages = CACTI_CONFIG.map(cactus => ({
    image: new Image().src = cactus.image,
    width: cactus.width * scaleRatio,
    height: cactus.height * scaleRatio
  }));
  
  cactiController = new CactiController(ctx, cactiImages, scaleRatio, GROUND_AND_CACTUS_SPEED);
  
  // Przykład inicjalizacji BirdController, potrzebujesz zaimplementować logikę tej klasy
  birdController = new BirdController(ctx, scaleRatio, GROUND_AND_CACTUS_SPEED);
  
  score = new Score(ctx, scaleRatio);
}

function setScreen() {
  scaleRatio = getScaleRatio();
  canvas.width = GAME_WIDTH * scaleRatio;
  canvas.height = GAME_HEIGHT * scaleRatio;
  createSprites();
}

function reset() {
  deathSoundPlayed = false;
  gameOver = false;
  waitingToStart = false;
  ground.reset();
  cactiController.reset();
  birdController.reset(); // Resetuj również ptaki
  score.reset();
  gameSpeed = GAME_SPEED_START;
  hasAddedEventListenersForRestart = false;
}

function showGameOver() {
  const fontSize = 70 * scaleRatio;
  ctx.font = `${fontSize}px Verdana`;
  ctx.fillStyle = "grey";
  const x = canvas.width / 4.5;
  const y = canvas.height / 2;
  ctx.fillText("Koniec tego dobrego!", x, y);

  if (!deathSoundPlayed) {
    deathSound.play();
    deathSoundPlayed = true;
  }
  
  setupGameReset();
}

function setupGameReset() {
  if (!hasAddedEventListenersForRestart) {
    hasAddedEventListenersForRestart = true;
    setTimeout(() => {
      window.addEventListener("keyup", reset, { once: true });
      window.addEventListener("touchstart", reset, { once: true });
    }, 1000);
  }
}

function showStartGameText() {
  const fontSize = 40 * scaleRatio;
  ctx.font = `${fontSize}px Verdana`;
  ctx.fillStyle = "grey";
  const x = canvas.width / 14;
  const y = canvas.height / 2;
  ctx.fillText("Naciśnij ekran bądź spację", x, y);
}

function gameLoop(currentTime) {
  if (previousTime === null) {
    previousTime = currentTime;
    requestAnimationFrame(gameLoop);
    return;
  }
  const frameTimeDelta = currentTime - previousTime;
  previousTime = currentTime;

  clearScreen();

  if (!gameOver && !waitingToStart) {
    ground.update(gameSpeed, frameTimeDelta);
    cactiController.update(gameSpeed, frameTimeDelta);
    birdController.update(gameSpeed, frameTimeDelta); // Aktualizuj ptaki
    player.update(gameSpeed, frameTimeDelta);
    score.update(frameTimeDelta);
    updateGameSpeed(frameTimeDelta);
    
    if (cactiController.collideWith(player) || birdController.collideWith(player)) {
      gameOver = true;
      score.setHighScore();
    }
  }

  ground.draw();
  cactiController.draw();
  birdController.draw(); // Rysuj ptaki
  player.draw();
  score.draw();

  if (gameOver) showGameOver();
  if (waitingToStart) showStartGameText();

  requestAnimationFrame(gameLoop);
}

function clearScreen() {
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function getScaleRatio() {
  const screenHeight = Math.min(window.innerHeight, document.documentElement.clientHeight);
  const screenWidth = Math.min(window.innerWidth, document.documentElement.clientWidth);

  return screenWidth / screenHeight < GAME_WIDTH / GAME_HEIGHT ? screenWidth / GAME_WIDTH : screenHeight / GAME_HEIGHT;
}

function updateGameSpeed(frameTimeDelta) {
  gameSpeed += frameTimeDelta * GAME_SPEED_INCREMENT;
}

setScreen();
window.addEventListener("resize", () => setTimeout(setScreen, 500));
if (screen.orientation) screen.orientation.addEventListener("change", setScreen);
window.addEventListener("keyup", (e) => { if(e.code === "Space" && waitingToStart) reset(); });
window.addEventListener("touchstart", () => { if(waitingToStart) reset(); });

requestAnimationFrame(gameLoop);

window.addEventListener("keyup", reset, { once: true });
window.addEventListener("touchstart", reset, { once: true });
