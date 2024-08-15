'use strict';


// Source platformer example
class GameObject extends EngineObject 
{
    constructor(pos, size, tileInfo, angle)
    {
        super(pos, size, tileInfo, angle);
        this.health = 0;
        this.isGameObject = 1;
        this.damageTimer = new Timer;
    }

    update()
    {
        super.update();

        // flash white when damaged
        if (!this.isDead() && this.damageTimer.isSet())
        {
            const a = .5*percent(this.damageTimer, .15, 0);
            this.additiveColor = hsl(0,0,a,0);
        }
        else
            this.additiveColor = hsl(0,0,0,0);

        // kill if below level
        if (!this.isDead() && this.pos.y < -9)
            warmup ? this.destroy() : this.kill();
    }

    damage(damage, damagingObject)
    {
        ASSERT(damage >= 0);
        if (this.isDead())
            return 0;
        
        // set damage timer;
        this.damageTimer.set();
        for (const child of this.children)
            child.damageTimer && child.damageTimer.set();

        // apply damage and kill if necessary
        const newHealth = max(this.health - damage, 0);
        if (!newHealth)
            this.kill(damagingObject);

        // set new health and return amount damaged
        return this.health - (this.health = newHealth);
    }

    isDead()                { return !this.health; }
    kill(damagingObject)    { this.destroy(); }
}

// individual portion of a chain
class Bead extends GameObject
{
    // doesn't move itself is moved according by the chain

    // if it is detached from the chain 3 cases:
    // translucent - vanish
    // opaque - fall through board
    // gold - stay in position to be collected by head of other chain
}

// the chains/snakes
class Chain extends GameObject
{
    update(){
        super.update();
        // has an array of beads, loop through giving previous position of head/bead ahead of it.
    }

    kill(){
        // stop moving
        // Trigger the kill for the beads
        // if it's player set timer/button for restart, if it's npc add a new npc
        super.kill()
    }

    // when head collides 3 cases
    // 1. own beads doesn't matter
    // 2. chain in in-active state (less than 13 opaque beads)
    // tell chain you collided with to add opaque bead, continue unharmed
    // 3. chain in active state
    // tell chain to add gold bead + trigger kill on self
    
}


