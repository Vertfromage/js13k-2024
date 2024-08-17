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
    this.speed = vec2(0.1);
    this.isMouse = true;

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
    let direction;
    if (this.isMouse) {
      // Follow mouse/touch input
      direction = mousePos.subtract(this.pos).normalize();
      // Move the head based on direction and speed
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
        direction = moveInput.normalize();
        // Move the head based on direction and speed
        this.pos = this.pos.add(direction.multiply(this.speed));
      }
    }
  }

  updateAutomatedMovement() {
    // Example AI: Move the chain in a circle or towards a target => needs work
    let targetPos = vec2(Math.cos(time) * 10, Math.sin(time) * 10);
    this.pos = this.pos.lerp(targetPos, 0.05); // Gradual movement towards the target
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
