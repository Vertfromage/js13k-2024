"use strict";

// Source platformer example
class GameObject extends EngineObject {
  constructor(pos, size, tileInfo, angle) {
    super(pos, size, tileInfo, angle);
    this.health = 0;
    this.isGameObject = 1;
    this.damageTimer = new Timer();
  }

  update() {
    super.update();

    // flash white when damaged
    if (!this.isDead() && this.damageTimer.isSet()) {
      const a = 0.5 * percent(this.damageTimer, 0.15, 0);
      this.additiveColor = hsl(0, 0, a, 0);
    } else this.additiveColor = hsl(0, 0, 0, 0);

    // kill if below level
    if (!this.isDead() && this.pos.y < -9)
      warmup ? this.destroy() : this.kill();
  }

  damage(damage, damagingObject) {
    ASSERT(damage >= 0);
    if (this.isDead()) return 0;

    // set damage timer;
    this.damageTimer.set();
    for (const child of this.children)
      child.damageTimer && child.damageTimer.set();

    // apply damage and kill if necessary
    const newHealth = max(this.health - damage, 0);
    if (!newHealth) this.kill(damagingObject);

    // set new health and return amount damaged
    return this.health - (this.health = newHealth);
  }

  isDead() {
    return !this.health;
  }
  kill(damagingObject) {
    this.destroy();
  }
}

class Grid {
  constructor(rows, cols) {
    this.rows = rows;
    this.cols = cols;
    this.cells = this.createGrid();
    this.currentChainId = null; // Track the current chain being processed
  }

  createGrid() {
    let grid = [];
    for (let y = 0; y < this.rows; y++) {
      let row = [];
      for (let x = 0; x < this.cols; x++) {
        row.push(new Cell(x, y));
      }
      grid.push(row);
    }
    return grid;
  }

  getCell(x, y) {
    // Ensure x and y are within the grid bounds
    if (x < 0) x = 0;
    if (x >= this.cols) x = this.cols - 1;
    if (y < 0) y = 0;
    if (y >= this.rows) y = this.rows - 1;

    return this.cells[y][x];
  }

  updateOccupiedCells(chains) {
    // Reset all cells to be walkable with a normal cost
    for (let row of this.cells) {
      for (let cell of row) {
        cell.walkable = true; // Default to walkable
        cell.cost = 1; // Default movement cost
      }
    }

    for (let chain of chains) {
      for (let bead of chain.beads) {
        let x = Math.floor(bead.pos.x);
        let y = Math.floor(bead.pos.y);
        let cell = this.getCell(x, y);
        if (cell) {
          cell.cost = chain.id === this.currentChainId ? 0 : 10;
          cell.walkable =
            chain.id === this.currentChainId || cell.cost === 10 ? true : false;
        }
      }
    }
  }

  // New method to get neighbors of a cell
  getNeighbors(cell) {
    let neighbors = [];
    let directions = [
      { x: 0, y: -1 }, // Up
      { x: 1, y: 0 }, // Right
      { x: 0, y: 1 }, // Down
      { x: -1, y: 0 }, // Left
    ];

    for (let dir of directions) {
      let neighborX = cell.x + dir.x;
      let neighborY = cell.y + dir.y;

      // Ensure the neighbor is within grid bounds
      if (
        neighborX >= 0 &&
        neighborX < this.cols &&
        neighborY >= 0 &&
        neighborY < this.rows
      ) {
        let neighbor = this.getCell(neighborX, neighborY);
        if (neighbor) {
          neighbors.push(neighbor);
        }
      }
    }

    return neighbors;
  }
}

function heuristic(cell, goal) {
  // Manhattan distance
  return Math.abs(cell.x - goal.x) + Math.abs(cell.y - goal.y);
}

// diagonal
// function heuristic(cell, goal) {
//   // Euclidean distance
//   return Math.sqrt(Math.pow(cell.x - goal.x, 2) + Math.pow(cell.y - goal.y, 2));
// }

class Cell {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.walkable = true; // Whether the cell is walkable or not
    this.cost = 1; // Movement cost (can still be used if needed)
    this.parent = null; // No longer needed but can be kept for reference
  }
}

// individual portion of a chain
class Bead extends GameObject {
  constructor(pos) {
    super(pos, vec2(1), spriteAtlas.circle, 0);
    this.health = 0;
    this.isGameObject = 1;
    this.damageTimer = new Timer();
  }
  // doesn't move itself is moved according by the chain

  // if it is detached from the chain 3 cases:
  // translucent - vanish
  // opaque - fall through board
  // gold - stay in position to be collected by head of other chain
}

let chainIdCounter = 0;

// the chains/snakes
class Chain extends GameObject {
  constructor(pos) {
    super(pos, vec2(1), spriteAtlas.square, 0);
    this.health = 0;
    this.id = chainIdCounter++; // Assign a unique ID to each chain
    this.isGameObject = 1;
    this.damageTimer = new Timer();
    this.isPlayer = false;
    this.len = 13;
    this.speed = vec2(0.2, 0.2); // Initial speed vector pointing right
    this.defaultSpeed = 0.2; // Speed magnitude
    this.isMouse = true;
    this.direction;
    this.targetPos = vec2(0, 0);

    // initialize the array of beads
    this.beads = this.initBeads(this.pos);
  }

  initBeads(pos) {
    let beadSpacing = 1; // Distance between each bead
    let beads = [];

    for (let i = 0; i < this.len; i++) {
      // Offset each bead by `beadSpacing` units behind the head
      let beadPos = pos.subtract(vec2(i * beadSpacing, 0)); // Adjust x-axis or y-axis depending on the direction you want the chain to start
      beads.push(new Bead(beadPos));
    }

    return beads;
  }

  update() {
    super.update();

    if (this.isPlayer) {
      this.updatePlayerMovement();
    } else {
      this.updateAutomatedMovement();
    }

    // Update bead positions based on the chain's movement
    this.updateBeadPositions();
  }

  updatePlayerMovement() {
    if (this.isMouse) {
      // Calculate the direction vector from the player's current position to the mouse position
      let direction = mousePos.subtract(this.pos);

      // Normalize the direction vector if it's non-zero
      if (direction.length() > 0) {
        direction = direction.normalize();
      }

      // Move the player's position based on the direction and speed
      this.pos = this.pos.add(direction.multiply(this.speed));
    } else {
      // Use keyboard/gamepad input
      let moveInput = isUsingGamepad
        ? gamepadStick(0)
        : vec2(
            keyIsDown("ArrowRight") - keyIsDown("ArrowLeft"),
            keyIsDown("ArrowUp") - keyIsDown("ArrowDown")
          );

      // Only normalize and move if there's input
      if (moveInput.length() > 0) {
        this.direction = moveInput.normalize();
        // Move the head based on direction and speed
        this.pos = this.pos.add(this.direction.multiply(this.speed));
      } else if (this.direction) {
        // Continue moving in the last known direction if no new input
        this.pos = this.pos.add(this.direction.multiply(this.speed));
      }
    }
  }

  updateAutomatedMovement() {
    let startCell = grid.getCell(
      Math.floor(this.pos.x),
      Math.floor(this.pos.y)
    );

    if (!startCell) {
      console.log("No Start cell!");
      return;
    }
    let goalX = Math.floor(this.targetPos.x);
    let goalY = Math.floor(this.targetPos.y);

    // Check if the target position is within grid bounds
    if (goalX < 0 || goalX >= grid.cols || goalY < 0 || goalY >= grid.rows) {
      console.warn("Target position is out of bounds:", this.targetPos);
      return; // Abort the movement if the goal is out of bounds
    }

    let goalCell = grid.getCell(goalX, goalY);

    // If the goal cell is invalid or not walkable, handle accordingly
    if (!goalCell || !goalCell.walkable) {
      console.warn("Goal cell is invalid or not walkable.");
      return;
    }

    let neighbors = grid.getNeighbors(startCell);

    // Find the neighbor with the smallest heuristic (closest to the goal)
    let bestNeighbor = null;
    let bestHeuristic = Infinity;

    for (let neighbor of neighbors) {
      if (neighbor && neighbor.walkable) {
        // Ensure neighbor is not null
        let heuristicValue = heuristic(neighbor, goalCell);
        if (heuristicValue < bestHeuristic) {
          bestHeuristic = heuristicValue;
          bestNeighbor = neighbor;
        }
      }
    }

    // Move towards the best neighbor
    if (bestNeighbor) {
      let direction = vec2(bestNeighbor.x, bestNeighbor.y)
        .subtract(this.pos)
        .normalize();

      this.pos = this.pos.add(direction.multiply(this.speed));
    } else {
      console.warn("No valid moves found.");
    }
  }

  updateBeadPositions() {
    const beadSpacing = 1; // The fixed distance between beads

    if (this.beads.length > 0) {
      this.beads[0].pos = this.pos; // The first bead follows the head's position
    }

    for (let i = 1; i < this.beads.length; i++) {
      let prevBead = this.beads[i - 1];
      let currBead = this.beads[i];

      // Calculate the vector pointing from the current bead to the previous bead
      let direction = prevBead.pos.subtract(currBead.pos);

      // Calculate the distance between the current bead and the previous bead
      let distance = direction.length();

      // console.log(`Bead ${i}: prev (${prevBead.pos.x}, ${prevBead.pos.y}), curr (${currBead.pos.x}, ${currBead.pos.y}), distance: ${distance}`);

      // If the distance is greater than beadSpacing, move the current bead
      if (distance > beadSpacing) {
        // Normalize the direction to create a unit vector, then scale it to beadSpacing
        direction = direction.normalize().scale(beadSpacing);

        // Move the current bead to the correct position at the exact bead spacing
        currBead.pos = prevBead.pos.subtract(direction);
      }
    }
  }

  kill() {
    // stop moving
    // Trigger the kill for the beads
    // if it's player set timer/button for restart, if it's npc add a new npc
    super.kill();
  }

  // when head collides 3 cases
  // 1. own beads doesn't matter
  // 2. chain in in-active state (less than 13 opaque beads)
  // tell chain you collided with to add opaque bead, continue unharmed
  // 3. chain in active state
  // tell chain to add gold bead + trigger kill on self
}
