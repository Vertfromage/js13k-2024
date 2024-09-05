/*
    LittleJS JS13K Starter Game
    - For size limited projects
    - Includes all core engine features
    - Builds to 7kb zip file
*/

"use strict";

// sound effects
const sound_click = new Sound([1, 0.5]);

// game variables
let isMouse = false;
let player, playerStartPos, spriteAtlas, AI, chains, grid;

let gridRows = 30; // Example: number of cells vertically
let gridCols = 45; // Example: number of cells horizontally

// webgl can be disabled to save even more space
//glEnable = false;

///////////////////////////////////////////////////////////////////////////////
function gameInit() {
  // To keep track of all chains
  chains = [];
  // to help with AI movement
  grid = new Grid(gridRows, gridCols);
  // create a table of all sprites
  spriteAtlas = {
    circle: tile(0),
    square: tile(2),
  };

  cameraPos = vec2(16, 8);

  // initialize player
  playerStartPos = vec2(16, 8);
  player = new Chain(playerStartPos);
  player.isPlayer = true;
  player.isMouse = isMouse;
  chains.push(player);

  // Initialize AI
  // Initialize AI
  let aiStartPos = vec2(10, 8); // Example starting position for AI
  AI = new Chain(aiStartPos);
  // AI.targetPos = vec2(25,15)
  AI.targetPos = player.pos;
  chains.push(AI);
}

///////////////////////////////////////////////////////////////////////////////
function gameUpdate() {
  grid.currentChainId = AI.id;
  grid.updateOccupiedCells(chains);
  // Update AI's target position to follow the player (change later)
  AI.targetPos = player.pos;
}

///////////////////////////////////////////////////////////////////////////////
function gameUpdatePost() {
  cameraPos = player.pos;
}

///////////////////////////////////////////////////////////////////////////////
function gameRender() {
  // draw a grey square in the background without using webgl
  drawRect(vec2(25, 15), vec2(45, 30), new Color(0.6, 0.6, 0.6), 0, 0);
}

///////////////////////////////////////////////////////////////////////////////
function gameRenderPost() {
  // draw to overlay canvas for hud rendering
  drawTextScreen("JS13K Games 2024", vec2(mainCanvasSize.x / 2, 60), 80);
  console.log("AI Position:", AI.pos);
  console.log("Player Position:", player.pos);
}

///////////////////////////////////////////////////////////////////////////////
// Startup LittleJS Engine
engineInit(gameInit, gameUpdate, gameUpdatePost, gameRender, gameRenderPost);
