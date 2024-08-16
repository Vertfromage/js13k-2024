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
    super(pos, vec2(1), spriteAtlas.circle, 0);
    this.health = 0;
    this.isGameObject = 1;
    this.damageTimer = new Timer();
    this.isPlayer = false;

    // initialize the array of beads
    this.beads = initBeads()
  }

  initBeads(pos) {
    let maxOffset = 2; // Max random offset for the curve

    let beads = [...Array(n)].map((_, i) => {
      // Randomize both x and y with a slight variation to create a curve
      let randomX = Math.sin(i / 2) * maxOffset + Math.random();
      let randomY = Math.cos(i / 2) * maxOffset + Math.random();

      // Adjust the position for the next bead
      pos = pos.add(vec2(randomX, randomY));

      return new Bead(pos);
    });

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
      direction = mousePos.sub(this.pos).normalize();
    } else {
      // Use keyboard/gamepad input
      let moveInput = isUsingGamepad
        ? gamepadStick(0)
        : vec2(keyIsDown('ArrowRight') - keyIsDown('ArrowLeft'), 
               keyIsDown('ArrowUp') - keyIsDown('ArrowDown'));
      direction = moveInput.normalize();
    }

    // Move the head based on direction and speed
    this.pos = this.pos.add(direction.mul(speed));
  }

  updateAutomatedMovement() {
    // Example AI: Move the chain in a circle or towards a target => needs work
    let targetPos = vec2(Math.cos(time) * 10, Math.sin(time) * 10);
    this.pos = this.pos.lerp(targetPos, 0.05);  // Gradual movement towards the target
  }

  updateBeadPositions() {
    for (let i = this.beads.length - 1; i > 0; i--) {
      // Each bead follows the position of the bead ahead of it
      this.beads[i].pos = this.beads[i - 1].pos;
    }
    // The first bead follows the head's position
    this.beads[0].pos = this.pos;
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
