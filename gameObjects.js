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
    if (x >= 0 && x < this.cols && y >= 0 && y < this.rows) {
      return this.cells[y][x];
    }
    return null;
  }

  updateOccupiedCells(chains) {
    // First, reset all cells to be walkable
    for (let row of this.cells) {
      for (let cell of row) {
        cell.walkable = true; // Default to walkable
      }
    }

    for (let chain of chains) {
      // Now, mark cells occupied by beads as non-walkable
      for (let bead of chain.beads) {
        let x = Math.floor(bead.pos.x);
        let y = Math.floor(bead.pos.y);
        let cell = this.getCell(x, y);
        if (cell) {
          cell.walkable = false;
        }
      }
    }
  }
}

function aStar(grid, start, goal) {
  // console.log("grid, start, goal", grid, start, goal);
  let openList = [start];
  let closedList = [];

  while (openList.length > 0) {
    let current = openList.reduce((prev, curr) =>
      prev.f < curr.f ? prev : curr
    );

    if (current === goal) {
      let path = [];
      while (current.parent) {
        path.push(current);
        current = current.parent;
      }
      return path.reverse(); // Return the path from start to goal
    }

    openList = openList.filter((cell) => cell !== current);
    closedList.push(current);

    let neighbors = getNeighbors(grid, current);
    for (let neighbor of neighbors) {
      if (closedList.includes(neighbor) || !neighbor.walkable) {
        continue;
      }

      let tentativeG = current.g + 1; // Assume distance between neighbors is 1
      if (!openList.includes(neighbor) || tentativeG < neighbor.g) {
        neighbor.parent = current;
        neighbor.g = tentativeG;
        neighbor.h = heuristic(neighbor, goal);
        neighbor.f = neighbor.g + neighbor.h;

        if (!openList.includes(neighbor)) {
          openList.push(neighbor);
        }
      }
    }
  }

  return []; // No path found
}

function heuristic(cell, goal) {
  // Manhattan distance (assuming 4-directional movement)
  console.log("Cell and goal", cell, goal);
  return Math.abs(cell.x - goal.x) + Math.abs(cell.y - goal.y);
}

function getNeighbors(grid, cell) {
  let neighbors = [];
  let directions = [
    { x: 0, y: -1 },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: -1, y: 0 },
  ];

  for (let dir of directions) {
    let neighbor = grid.getCell(cell.x + dir.x, cell.y + dir.y);
    if (neighbor) {
      neighbors.push(neighbor);
    }
  }

  return neighbors;
}

class Cell {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.walkable = true;
    this.parent = null;
    this.g = 0; // Cost from start to this cell
    this.h = 0; // Heuristic estimate of cost to goal
    this.f = 0; // g + h
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

// the chains/snakes
class Chain extends GameObject {
  constructor(pos) {
    super(pos, vec2(1), spriteAtlas.square, 0);
    this.health = 0;
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
    // Convert snake's current position and target position to grid cells
    console.log("grid",grid)
    let startCell = grid.getCell(
      Math.floor(this.pos.x),
      Math.floor(this.pos.y)
    );
    console.log("start cell", startCell)
    console.log("targetPos", this.targetPos)
    let goalCell = grid.getCell(this.targetPos.x, this.targetPos.y);
    console.log("goal cell",goalCell)

    // Find the path using A*
    let path = aStar(grid, startCell, goalCell);

    // If a path exists, move towards the next cell in the path
    if (path.length > 0) {
      let nextCell = path[0];
      let direction = vec2(nextCell.x, nextCell.y)
        .subtract(this.pos)
        .normalize();
      this.pos = this.pos.add(direction.multiply(this.speed));
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
