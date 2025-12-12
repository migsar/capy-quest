
import { Application, Container, Graphics, Sprite, Texture, Assets } from 'pixi.js';
import { BOARD_WIDTH, BOARD_HEIGHT, CELL_SIZE, PALETTE, ASSET_URLS } from '../constants';
import { EntityType, Position, Direction, Predator, Treat, PredatorType, TreatType } from '../types';
import { generateMaze } from '../services/levelGenerator';

type GameEventCallback = (event: string, data?: any) => void;

export class GameEngine {
  public app: Application;
  private gameContainer: Container;
  private grid: number[][] = [];
  
  // Entities
  private player: Sprite | null = null;
  private playerPos: Position = { x: 1, y: 1 };
  private predators: { sprite: Sprite, data: Predator }[] = [];
  private gates: Map<string, Sprite> = new Map();
  private treats: Map<string, Sprite> = new Map();
  private walls: Container = new Container();
  private floor: Container = new Container();
  
  // Textures
  private textures: Record<string, Texture> = {};

  // State
  private currentDirection: Direction | null = null;
  private nextDirection: Direction | null = null;
  private heldKeys: Set<string> = new Set(); // For fluid input
  
  private moveTimer: number = 0;
  private readonly MOVE_INTERVAL = 12; // Adjusted for smoothness
  private isMoving: boolean = false;
  private targetPos: Position | null = null;
  
  private predatorTimer: number = 0;
  private readonly PREDATOR_INTERVAL = 80; // Slower patrol
  
  private eventCallback: GameEventCallback;
  private isPaused: boolean = false;
  
  private time: number = 0; // For animations

  constructor(element: HTMLElement, callback: GameEventCallback) {
    this.app = new Application();
    this.eventCallback = callback;
    this.gameContainer = new Container();
  }

  async init() {
    await this.app.init({
      width: BOARD_WIDTH * CELL_SIZE,
      height: BOARD_HEIGHT * CELL_SIZE,
      background: PALETTE.UI_BG,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });
    
    // @ts-ignore
    document.getElementById('game-canvas-container')?.appendChild(this.app.canvas);
    
    // Load Assets
    const bundle = [
        { alias: 'capybara', src: ASSET_URLS.CAPYBARA },
        { alias: 'jaguar', src: ASSET_URLS.JAGUAR },
        { alias: 'anaconda', src: ASSET_URLS.ANACONDA },
        { alias: 'caiman', src: ASSET_URLS.CAIMAN },
        { alias: 'wood', src: ASSET_URLS.WOOD },
        { alias: 'pumpkin', src: ASSET_URLS.PUMPKIN },
        { alias: 'watermelon', src: ASSET_URLS.WATERMELON },
        { alias: 'corn', src: ASSET_URLS.CORN },
    ];
    
    await Assets.load(bundle);

    // Map loaded assets
    this.textures.PLAYER = Assets.get('capybara');
    this.textures[PredatorType.JAGUAR] = Assets.get('jaguar');
    this.textures[PredatorType.ANACONDA] = Assets.get('anaconda');
    this.textures[PredatorType.CAIMAN] = Assets.get('caiman');
    this.textures.GATE = Assets.get('wood');
    this.textures[TreatType.PUMPKIN] = Assets.get('pumpkin');
    this.textures[TreatType.WATERMELON] = Assets.get('watermelon');
    this.textures[TreatType.CORN] = Assets.get('corn');

    // Generate procedural background textures
    this.generateProceduralTextures();

    this.app.stage.addChild(this.gameContainer);
    this.gameContainer.addChild(this.floor);
    this.gameContainer.addChild(this.walls);

    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    this.app.ticker.add(this.update.bind(this));
  }

  private generateProceduralTextures() {
    const g = new Graphics();
    const S = CELL_SIZE; // scaling factor

    // 1. DIRT FLOOR
    g.clear();
    g.rect(0, 0, S, S);
    g.fill(PALETTE.DIRT_BG);
    for(let i=0; i<8; i++) {
        g.rect(Math.random()*S, Math.random()*S, S*0.1, S*0.1);
        g.fill(PALETTE.DIRT_NOISE);
    }
    this.textures.DIRT = this.app.renderer.generateTexture(g);

    // 2. BUSH WALL
    g.clear();
    g.rect(0, 0, S, S);
    g.fill(PALETTE.BUSH_MAIN); 
    g.circle(S*0.25, S*0.25, S*0.2); g.fill(PALETTE.BUSH_LIGHT);
    g.circle(S*0.75, S*0.25, S*0.15); g.fill(PALETTE.BUSH_LIGHT);
    g.circle(S*0.5, S*0.5, S*0.22); g.fill(PALETTE.BUSH_DARK);
    this.textures.WALL = this.app.renderer.generateTexture(g);

    // 3. WATER POND
    g.clear();
    g.rect(0, 0, S, S);
    g.fill(PALETTE.WATER_MAIN);
    g.rect(S*0.1, S*0.25, S*0.3, S*0.06); g.fill(PALETTE.WATER_LIGHT);
    g.rect(S*0.6, S*0.6, S*0.25, S*0.06); g.fill(PALETTE.WATER_LIGHT);
    this.textures.WATER = this.app.renderer.generateTexture(g);
  }

  public loadLevel(levelIndex: number) {
    // Cleanup
    this.walls.removeChildren();
    this.floor.removeChildren();
    this.gates.forEach(s => s.destroy());
    this.gates.clear();
    this.treats.forEach(s => s.destroy());
    this.treats.clear();
    this.predators.forEach(p => p.sprite.destroy());
    this.predators = [];
    if (this.player) {
      this.player.destroy();
      this.player = null;
    }

    // Reset State
    this.currentDirection = null;
    this.nextDirection = null;
    this.heldKeys.clear();
    this.isMoving = false;
    this.targetPos = null;

    // Generate Level
    const data = generateMaze(levelIndex);
    this.grid = data.grid;
    this.playerPos = { ...data.playerStart };

    // Draw Grid
    for (let y = 0; y < BOARD_HEIGHT; y++) {
      for (let x = 0; x < BOARD_WIDTH; x++) {
        const type = this.grid[y][x];
        const px = x * CELL_SIZE;
        const py = y * CELL_SIZE;

        const floorSprite = new Sprite(this.textures.DIRT);
        floorSprite.position.set(px, py);
        this.floor.addChild(floorSprite);

        if (type === EntityType.WALL) {
           const wall = new Sprite(this.textures.WALL);
           wall.position.set(px, py);
           this.walls.addChild(wall);
        } else if (type === EntityType.POND) {
           const water = new Sprite(this.textures.WATER);
           water.position.set(px, py);
           this.floor.addChild(water); 
        }
      }
    }

    // Gates
    data.gates.forEach(g => {
      const s = new Sprite(this.textures.GATE);
      s.width = CELL_SIZE;
      s.height = CELL_SIZE;
      s.position.set(g.x * CELL_SIZE, g.y * CELL_SIZE);
      this.gameContainer.addChild(s);
      this.gates.set(`${g.x},${g.y}`, s);
    });

    // Treats
    data.treats.forEach(t => {
      const texture = this.textures[t.type] || this.textures[TreatType.WATERMELON];
      const s = new Sprite(texture);
      s.width = CELL_SIZE;
      s.height = CELL_SIZE;
      s.position.set(t.position.x * CELL_SIZE, t.position.y * CELL_SIZE);
      this.gameContainer.addChild(s);
      this.treats.set(`${t.position.x},${t.position.y}`, s);
    });

    // Predators
    data.predators.forEach((p, i) => {
      const texture = this.textures[p.type] || this.textures[PredatorType.JAGUAR];
      const s = new Sprite(texture);
      s.width = CELL_SIZE;
      s.height = CELL_SIZE;
      s.position.set(p.position.x * CELL_SIZE, p.position.y * CELL_SIZE);
      this.gameContainer.addChild(s);
      
      this.predators.push({
        sprite: s,
        data: p
      });
    });

    // Player
    this.player = new Sprite(this.textures.PLAYER);
    this.player.width = CELL_SIZE;
    this.player.height = CELL_SIZE;
    this.player.position.set(this.playerPos.x * CELL_SIZE, this.playerPos.y * CELL_SIZE);
    this.gameContainer.addChild(this.player);
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    // Prevent default scrolling for arrows
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
      e.preventDefault();
    }
    
    let dir: Direction | null = null;
    if (['ArrowUp', 'w', 'W'].includes(e.key)) dir = 'UP';
    if (['ArrowDown', 's', 'S'].includes(e.key)) dir = 'DOWN';
    if (['ArrowLeft', 'a', 'A'].includes(e.key)) dir = 'LEFT';
    if (['ArrowRight', 'd', 'D'].includes(e.key)) dir = 'RIGHT';

    if (dir) {
      this.heldKeys.add(dir);
      this.nextDirection = dir;
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    let dir: Direction | null = null;
    if (['ArrowUp', 'w', 'W'].includes(e.key)) dir = 'UP';
    if (['ArrowDown', 's', 'S'].includes(e.key)) dir = 'DOWN';
    if (['ArrowLeft', 'a', 'A'].includes(e.key)) dir = 'LEFT';
    if (['ArrowRight', 'd', 'D'].includes(e.key)) dir = 'RIGHT';

    if (dir) {
      this.heldKeys.delete(dir);
      // If the released key was the scheduled direction, check if we have others held
      if (this.nextDirection === dir) {
         if (this.heldKeys.size > 0) {
             // Fallback to the last added key (rough approximation, Set doesn't guarantee order but works for this)
             this.nextDirection = Array.from(this.heldKeys).pop() as Direction;
         } else {
             this.nextDirection = null;
         }
      }
    }
  }

  private update(ticker: any) {
    if (this.isPaused || !this.player) return;

    this.time += 0.1;
    const S = CELL_SIZE;
    
    // Bobbing Animation
    const bob = Math.sin(this.time) * (S * 0.05); 
    this.player.y = (this.isMoving && this.targetPos ? this.player.y : this.playerPos.y * S) + bob;
    
    this.predators.forEach(p => {
        p.sprite.y = p.data.position.y * S + Math.cos(this.time + p.data.id) * (S * 0.05);
    });

    // --- Player Movement Logic ---
    if (!this.isMoving) {
      // Fluid Input: Check held keys if nextDirection is null
      if (!this.nextDirection && this.heldKeys.size > 0) {
          this.nextDirection = Array.from(this.heldKeys).pop() as Direction;
      }

      if (this.nextDirection) {
        this.currentDirection = this.nextDirection;
        
        // Flip sprite based on direction, preserving the scale (size)
        const scaleX = Math.abs(this.player.scale.x);
        if (this.currentDirection === 'LEFT') {
            this.player.scale.x = -scaleX;
            this.player.anchor.set(1, 0); // Origin top-right (visual left)
        }
        if (this.currentDirection === 'RIGHT') {
            this.player.scale.x = scaleX;
            this.player.anchor.set(0, 0); // Origin top-left
        }

        const nextPos = this.getNextPos(this.playerPos, this.currentDirection);
        
        if (this.isValidMove(nextPos)) {
          if (this.grid[nextPos.y][nextPos.x] === EntityType.GATE) {
             this.isPaused = true;
             // Stop movement intention on gate hit so we don't auto-walk after
             this.currentDirection = null; 
             this.heldKeys.clear(); 
             this.eventCallback('GATE_HIT', nextPos);
          } else {
             this.targetPos = nextPos;
             this.isMoving = true;
             this.moveTimer = 0;
          }
        }
      }
    } else if (this.targetPos && this.currentDirection) {
      this.moveTimer++;
      const progress = this.moveTimer / this.MOVE_INTERVAL;
      
      const startX = this.playerPos.x * S;
      const startY = this.playerPos.y * S;
      const endX = this.targetPos.x * S;
      const endY = this.targetPos.y * S;

      let currentX = startX + (endX - startX) * progress;
      let currentY = startY + (endY - startY) * progress;
      
      this.player.x = currentX;
      this.player.y = currentY + bob;

      if (this.moveTimer >= this.MOVE_INTERVAL) {
        // MOVEMENT FINISHED
        this.isMoving = false;
        this.playerPos = { ...this.targetPos };
        this.targetPos = null;
        this.checkCollisions();
        
        // Stop immediately if key was released during movement
        if (this.currentDirection && !this.heldKeys.has(this.currentDirection)) {
            // Check if another key is held
             if (this.heldKeys.size > 0) {
                 this.nextDirection = Array.from(this.heldKeys).pop() as Direction;
             } else {
                 this.nextDirection = null;
             }
        }
      }
    }

    // --- Predator Logic (Random Walk) ---
    this.predatorTimer++;
    if (this.predatorTimer > this.PREDATOR_INTERVAL) {
      this.movePredators();
      this.predatorTimer = 0;
    }

    // --- Collisions ---
    const px = this.player.x + (S/2); 
    const py = this.player.y + (S/2);
    
    for (const pred of this.predators) {
      const ex = pred.sprite.x + (S/2);
      const ey = pred.sprite.y + (S/2);
      const dist = Math.sqrt(Math.pow(px - ex, 2) + Math.pow(py - ey, 2));
      
      if (dist < S * 0.7) {
        this.isPaused = true;
        // Stop Movement
        this.isMoving = false;
        this.targetPos = null;
        // Snap player to current grid pos to avoid visual glitch during pause
        if (this.player) {
          this.player.x = this.playerPos.x * S;
          this.player.y = this.playerPos.y * S;
        }
        
        this.eventCallback('HIT_PREDATOR', { id: pred.data.id, pos: pred.data.position });
        return; // Break update loop
      }
    }
  }

  private movePredators() {
    this.predators.forEach(p => {
      // 1. Determine valid moves
      const { x, y } = p.data.position;
      const candidates: Position[] = [];
      const dirs = [{x:0,y:1}, {x:0,y:-1}, {x:1,y:0}, {x:-1,y:0}];
      
      for(const d of dirs) {
          const nx = x + d.x;
          const ny = y + d.y;
          
          if(nx >= 0 && nx < BOARD_WIDTH && ny >= 0 && ny < BOARD_HEIGHT) {
              const cell = this.grid[ny][nx];
              // Predators can walk on EMPTY or PLAYER, but not WALL, GATE, or POND
              if(cell !== EntityType.WALL && cell !== EntityType.GATE && cell !== EntityType.POND) {
                  candidates.push({x: nx, y: ny});
              }
          }
      }
      
      // 2. Pick a random valid neighbor
      if (candidates.length > 0) {
          const next = candidates[Math.floor(Math.random() * candidates.length)];
          p.data.position = next;
          
          // 3. Teleport Sprite (Retro style, no lerp for enemies for now)
          p.sprite.x = next.x * CELL_SIZE;
          p.sprite.y = next.y * CELL_SIZE;

          // 4. Face direction
          const scaleX = Math.abs(p.sprite.scale.x);
          if (next.x > x) {
              p.sprite.scale.x = scaleX; 
              p.sprite.anchor.set(0, 0);
          } else if (next.x < x) {
              p.sprite.scale.x = -scaleX;
              p.sprite.anchor.set(1, 0);
          }
      }
    });
  }

  private checkCollisions() {
    const key = `${this.playerPos.x},${this.playerPos.y}`;
    const type = this.grid[this.playerPos.y][this.playerPos.x];

    if (type === EntityType.TREAT) {
      if (this.treats.has(key)) {
         this.isPaused = true;
         this.eventCallback('HIT_TREAT', this.playerPos);
      }
    } else if (type === EntityType.POND) {
      this.isPaused = true;
      this.eventCallback('WIN_LEVEL');
    }
  }

  public resolveTreat(pos: Position) {
    // Treat disappears regardless of answer
    const key = `${pos.x},${pos.y}`;
    if (this.treats.has(key)) {
      this.treats.get(key)?.destroy();
      this.treats.delete(key);
      this.grid[pos.y][pos.x] = EntityType.EMPTY;
    }
    this.resume();
  }

  public resolvePredator(predId: number, success: boolean) {
    if (success) {
      // Jump Over / Move to other side
      const pred = this.predators.find(p => p.data.id === predId);
      if (pred) {
        // Calculate "Other Side". 
        // Simple heuristic: Try to move player 2 steps in current direction (jumping over)
        // If undefined direction (stationary hit), move away from predator
        
        let targetX = this.playerPos.x;
        let targetY = this.playerPos.y;
        
        // If we were moving, jump 2 squares forward (1 is predator, 2 is behind it)
        if (this.currentDirection) {
           const next = this.getNextPos(this.playerPos, this.currentDirection); // Predator pos
           const jump = this.getNextPos(next, this.currentDirection); // Behind predator
           if (this.isValidJumpTarget(jump)) {
             targetX = jump.x;
             targetY = jump.y;
           } else {
             // Blocked, try to find any empty neighbor that isn't the predator
             const neighbors = this.getValidNeighbors(this.playerPos);
             const safe = neighbors.find(n => n.x !== pred.data.position.x || n.y !== pred.data.position.y);
             if (safe) { targetX = safe.x; targetY = safe.y; }
           }
        } else {
           // Predator hit us while idle. Move to any neighbor not occupied by predator
           const neighbors = this.getValidNeighbors(this.playerPos);
           const safe = neighbors.find(n => n.x !== pred.data.position.x || n.y !== pred.data.position.y);
           if (safe) { targetX = safe.x; targetY = safe.y; }
        }

        // Apply Move
        this.playerPos = { x: targetX, y: targetY };
        if (this.player) {
          this.player.x = targetX * CELL_SIZE;
          this.player.y = targetY * CELL_SIZE;
        }
      }
    } else {
      // Wrong Answer: Reset to Safe Square (Start)
      this.resetPlayerPosition();
    }
    
    // Ensure we aren't "inside" the predator anymore physically to prevent instant re-trigger
    // The jump or reset handles this.
    
    this.resume();
  }

  private getValidNeighbors(pos: Position): Position[] {
    const res: Position[] = [];
    const dirs = [{x:0,y:1}, {x:0,y:-1}, {x:1,y:0}, {x:-1,y:0}];
    for (const d of dirs) {
      const nx = pos.x + d.x;
      const ny = pos.y + d.y;
      if (this.grid[ny] && this.grid[ny][nx] !== EntityType.WALL && this.grid[ny][nx] !== EntityType.GATE) {
        res.push({x: nx, y: ny});
      }
    }
    return res;
  }

  private isValidJumpTarget(pos: Position): boolean {
    if (!this.grid[pos.y] || this.grid[pos.y][pos.x] === undefined) return false;
    const t = this.grid[pos.y][pos.x];
    return t !== EntityType.WALL && t !== EntityType.GATE && t !== EntityType.POND;
  }

  public unlockGate(pos: Position) {
    const key = `${pos.x},${pos.y}`;
    if (this.gates.has(key)) {
      this.gates.get(key)?.destroy();
      this.gates.delete(key);
      this.grid[pos.y][pos.x] = EntityType.EMPTY;
    }
    this.resume();
  }

  public resume() {
    this.isPaused = false;
    this.currentDirection = null;
    this.nextDirection = null;
    this.heldKeys.clear();
  }

  public destroy() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    this.app.destroy(true, { children: true, texture: true });
  }

  private resetPlayerPosition() {
    this.playerPos = { x: 1, y: 1 };
    if (this.player) {
      this.player.position.set(this.playerPos.x * CELL_SIZE, this.playerPos.y * CELL_SIZE);
      // Reset flip
      const scaleX = Math.abs(this.player.scale.x);
      this.player.scale.x = scaleX;
      this.player.anchor.set(0, 0);
    }
    this.isMoving = false;
    this.targetPos = null;
    this.currentDirection = null;
    this.nextDirection = null;
    this.heldKeys.clear();
  }

  private getNextPos(pos: Position, dir: Direction): Position {
    let { x, y } = pos;
    if (dir === 'UP') y--;
    if (dir === 'DOWN') y++;
    if (dir === 'LEFT') x--;
    if (dir === 'RIGHT') x++;
    return { x, y };
  }

  private isValidMove(pos: Position): boolean {
    if (!this.grid || !this.grid[pos.y] || this.grid[pos.y][pos.x] === undefined) return false;
    const cell = this.grid[pos.y][pos.x];
    return cell !== EntityType.WALL;
  }
}
