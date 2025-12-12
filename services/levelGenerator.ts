import { BOARD_WIDTH, BOARD_HEIGHT } from "../constants";
import { EntityType, Position, Predator, Treat, PredatorType, TreatType } from "../types";

export const generateMaze = (levelIndex: number): { 
  grid: number[][], 
  playerStart: Position, 
  predators: Predator[],
  treats: Treat[],
  gates: Position[],
  pond: Position
} => {
  const width = BOARD_WIDTH;
  const height = BOARD_HEIGHT;
  
  // 1. Initialize grid full of walls
  const grid: number[][] = Array.from({ length: height }, () => 
    Array.from({ length: width }, () => EntityType.WALL)
  );

  // 2. Recursive Backtracker for Maze Generation
  const start: Position = { x: 1, y: 1 };
  grid[start.y][start.x] = EntityType.EMPTY;
  
  const stack: Position[] = [start];
  const directions = [
    { x: 0, y: -2 }, // Up
    { x: 0, y: 2 },  // Down
    { x: -2, y: 0 }, // Left
    { x: 2, y: 0 }   // Right
  ];

  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const neighbors: { p: Position, d: Position }[] = [];

    for (const d of directions) {
      const nx = current.x + d.x;
      const ny = current.y + d.y;

      if (nx > 0 && nx < width - 1 && ny > 0 && ny < height - 1) {
        if (grid[ny][nx] === EntityType.WALL) {
          neighbors.push({ p: { x: nx, y: ny }, d: { x: d.x / 2, y: d.y / 2 } });
        }
      }
    }

    if (neighbors.length > 0) {
      const chosen = neighbors[Math.floor(Math.random() * neighbors.length)];
      grid[current.y + chosen.d.y][current.x + chosen.d.x] = EntityType.EMPTY;
      grid[chosen.p.y][chosen.p.x] = EntityType.EMPTY;
      stack.push(chosen.p);
    } else {
      stack.pop();
    }
  }

  // 3. Create Pond Area (4x4 block in bottom right)
  const pondWidth = 4;
  const pondHeight = 4;
  const pondStartX = width - pondWidth - 1;
  const pondStartY = height - pondHeight - 1;

  // Carve out the pond
  for (let y = pondStartY; y < pondStartY + pondHeight; y++) {
    for (let x = pondStartX; x < pondStartX + pondWidth; x++) {
      grid[y][x] = EntityType.POND;
    }
  }

  // Ensure entrance to the pond
  const pondEntrance: Position = { x: pondStartX - 1, y: pondStartY + 1 }; // Entrance on the left side
  
  // Seal perimeter around pond to ensure the entrance is the ONLY way in
  for(let y = pondStartY; y < pondStartY + pondHeight; y++) {
    if(pondStartX - 1 > 0) grid[y][pondStartX - 1] = EntityType.WALL;
  }
  for(let x = pondStartX; x < pondStartX + pondWidth; x++) {
    if(pondStartY - 1 > 0) grid[pondStartY - 1][x] = EntityType.WALL;
  }

  // Open the entrance explicitly
  grid[pondEntrance.y][pondEntrance.x] = EntityType.EMPTY;
  // Ensure connectivity to the entrance
  if (grid[pondEntrance.y][pondEntrance.x - 1] === EntityType.WALL) {
     grid[pondEntrance.y][pondEntrance.x - 1] = EntityType.EMPTY;
  }

  // Define the "Goal" position as the center of the pond
  const pond: Position = { 
    x: pondStartX + Math.floor(pondWidth/2), 
    y: pondStartY + Math.floor(pondHeight/2) 
  };

  // 4. Find Solution Path (BFS)
  const solutionPath = findPath(grid, start, pondEntrance);
  
  // 5. Place Gates on the Path
  const gates: Position[] = [];
  
  // Always place the final gate at the pond entrance
  // Note: We do this BEFORE loop removal so we can protect it
  grid[pondEntrance.y][pondEntrance.x] = EntityType.GATE;
  gates.push({ ...pondEntrance });

  if (solutionPath.length > 0) {
    // Gate 2: Midway
    // Place it roughly 60% of the way, but ensure it's not the same as the entrance gate
    const midIndex = Math.floor(solutionPath.length * 0.6); 
    const midPos = solutionPath[midIndex];
    
    // Validate midPos: Must be valid, not start, and not the pond entrance we just placed
    if (midPos && 
        (midPos.x !== start.x || midPos.y !== start.y) && 
        (midPos.x !== pondEntrance.x || midPos.y !== pondEntrance.y)) {
        
        grid[midPos.y][midPos.x] = EntityType.GATE;
        gates.push({ ...midPos });
    }
  }

  // 6. Post-processing: Loop Creation (IMPROVED for better gameplay)
  // Significantly increased loop removal to 40% to make the map more open and prevent predator blocking
  const loopsToRemove = Math.floor((width * height) * 0.40); 
  
  const isAdjacentToGate = (x: number, y: number): boolean => {
      const dirs = [[0,1],[0,-1],[1,0],[-1,0],[1,1],[1,-1],[-1,1],[-1,-1]]; // Check 8 neighbors
      for(const d of dirs) {
          const nx = x + d[0];
          const ny = y + d[1];
          if(nx>=0 && nx<width && ny>=0 && ny<height) {
              if (grid[ny][nx] === EntityType.GATE) return true;
          }
      }
      return false;
  };

  for (let i = 0; i < loopsToRemove; i++) {
    const rx = Math.floor(Math.random() * (width - 2)) + 1;
    const ry = Math.floor(Math.random() * (height - 2)) + 1;
    
    // Safety checks:
    const isStartArea = (Math.abs(rx - start.x) <= 2 && Math.abs(ry - start.y) <= 2);
    const isPondArea = (rx >= pondStartX - 1 && ry >= pondStartY - 1);

    if (grid[ry][rx] === EntityType.WALL && 
        !isStartArea && 
        !isPondArea &&
        !isAdjacentToGate(rx, ry)) {
       grid[ry][rx] = EntityType.EMPTY;
    }
  }

  // 7. Place Entities (Predators & Treats)
  const emptySpots: Position[] = [];
  for(let y=1; y<height-1; y++) {
    for(let x=1; x<width-1; x++) {
      // Check if inside pond area
      const inPond = x >= pondStartX && x < pondStartX + pondWidth && 
                     y >= pondStartY && y < pondStartY + pondHeight;
      const isGate = grid[y][x] === EntityType.GATE;
      const isStart = (Math.abs(x - start.x) <= 3 && Math.abs(y - start.y) <= 3); // Increased start buffer
      
      if(grid[y][x] === EntityType.EMPTY && !inPond && !isGate && !isStart) {
        emptySpots.push({x, y});
      }
    }
  }

  // Shuffle spots
  for (let i = emptySpots.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [emptySpots[i], emptySpots[j]] = [emptySpots[j], emptySpots[i]];
  }

  // Predators
  const predators: Predator[] = [];
  const numPredators = 3; 
  const predTypes = [PredatorType.JAGUAR, PredatorType.ANACONDA, PredatorType.CAIMAN];
  
  for(let i=0; i<numPredators && emptySpots.length > 0; i++) {
    const pos = emptySpots.pop()!;
    const type = predTypes[i % predTypes.length];
    
    predators.push({
      id: i,
      position: pos,
      direction: 'RIGHT',
      type: type
    });
  }

  // Treats
  const treats: Treat[] = [];
  const numTreats = 6;
  const treatTypes = [TreatType.WATERMELON, TreatType.CORN, TreatType.PUMPKIN];
  
  for(let i=0; i<numTreats && emptySpots.length > 0; i++) {
    const pos = emptySpots.pop()!;
    grid[pos.y][pos.x] = EntityType.TREAT;
    treats.push({
      position: pos,
      type: treatTypes[i % treatTypes.length]
    });
  }

  return {
    grid,
    playerStart: start,
    predators,
    treats,
    gates,
    pond
  };
};

// BFS implementation to find path
const findPath = (grid: number[][], start: Position, end: Position): Position[] => {
    const q: { pos: Position, path: Position[] }[] = [{ pos: start, path: [start] }];
    const visited = new Set<string>();
    visited.add(`${start.x},${start.y}`);
    
    const directions = [
        {x:0, y:-1}, {x:0, y:1}, {x:-1, y:0}, {x:1, y:0}
    ];

    while(q.length > 0) {
        const { pos, path } = q.shift()!;
        
        if (pos.x === end.x && pos.y === end.y) {
            return path;
        }

        for (const d of directions) {
            const nx = pos.x + d.x;
            const ny = pos.y + d.y;
            
            if (nx >= 0 && nx < grid[0].length && ny >= 0 && ny < grid.length) {
                // We treat walls as blocked. Gates haven't been placed yet, so they are currently EMPTY or WALL.
                // Note: The pond entrance was explicitly set to EMPTY before this call.
                if (grid[ny][nx] !== EntityType.WALL && !visited.has(`${nx},${ny}`)) {
                    visited.add(`${nx},${ny}`);
                    q.push({
                        pos: {x: nx, y: ny},
                        path: [...path, {x: nx, y: ny}]
                    });
                }
            }
        }
    }
    return [];
};