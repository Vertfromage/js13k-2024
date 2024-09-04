Plan:

### Game Summary:  
In this game, players control a "snake" represented by a chain of 13 beads plus a head. The beads start out translucent, and the primary objective is to navigate the board to collect opaque beads while avoiding collisions with other chains. The game is set on a top-down, semi-opaque pseudo-3D board with a marble texture, creating an immersive visual experience enhanced by particle effects and drifting clouds.

### Gameplay Logic:
1. **Snake Chain Mechanics:**
   - **Initial State:** Each snake starts with 13 translucent beads and a head.
   - **Becoming Opaque:** When another snake collects a fruit, one of the player’s translucent beads becomes opaque.
   - **Full Chain Effect:** Once the player’s snake has 13 opaque beads, all beads start glowing, and the snake's speed increases and it can pass through all other snakes, then it turns translucent again.
   - **Gold Beads:** When the player collects 13 beads a gold bead is added to the head of the player’s snake.
   - **Diamond beads** When the player collects 13 gold beads they get replaced by a diamond bead. 
   - **Collisions** The destroyed snake loses all its beads (opaque and translucent), and the gold beads are scattered on the board, available for collection.

2. **Board and Environment:**
   - **Visuals:** The board has a top-down view with a semi-opaque pseudo-3D appearance, featuring a marble texture.
   - **Particle Effects:** Clouds of particles drift across the board, adding a dynamic element to the environment.
   - **Falling Beads:** When a chain is destroyed, its opaque beads fall through the board, creating a visually striking effect.

3. **Scoring and Objectives:**
   - **Collect Beads:** The main goal is to collect as many opaque and gold beads as possible while avoiding losing your own. Collect an opaque bead when you eat a fruit.
   - **Defeat Opponents:** Destroy other snakes by making them run into you when you have a glowing, full chain of opaque beads.

4. **AI and Multiplayer:**
   - **Single-Player Mode:** The initial version will feature one player and simple AI-controlled snakes that follow random movement patterns.
   - **Multiplayer Extension:** The game is designed with future expansion in mind, allowing for potential multiplayer gameplay where multiple players can compete against each other in real-time.

### Graphic Look:
- The game will feature a **top-down view** on a **semi-opaque pseudo-3D board** with a **marble texture**.
- **Snakes** are composed of **chains of beads**, which change in appearance (from translucent to opaque to glowing) based on game events.
- **Particle effects** and **drifting clouds** will add atmosphere and dynamic visual interest to the board.
- **Falling beads** and **gold bead collections** will provide additional visual feedback during gameplay.