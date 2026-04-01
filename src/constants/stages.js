// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Crab Puzzle — Stage Definitions
//  World concept: "Fix the Bugs" — crab bugs invade the system
//  Clear stages by scoring the target within 30 seconds
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ─── Zones ───────────────────────────────────────────────────────
// Each zone = a category of "bugs" in the system
export const ZONES = [
  { id: 1, name: 'BOOT SECTOR',     color: '#3090D0', stages: [1,2,3,4,5]       },
  { id: 2, name: 'MEMORY LEAK',     color: '#48B040', stages: [6,7,8,9,10]      },
  { id: 3, name: 'STACK OVERFLOW',  color: '#E07830', stages: [11,12,13,14,15]  },
  { id: 4, name: 'NULL POINTER',    color: '#E868A8', stages: [16,17,18,19,20]  },
  { id: 5, name: 'DEADLOCK',        color: '#C82020', stages: [21,22,23,24,25]  },
  { id: 6, name: 'RACE CONDITION',  color: '#7040B0', stages: [26,27,28,29,30]  },
  { id: 7, name: 'KERNEL PANIC',    color: '#909098', stages: [31,32]           },
];

// ─── Stage definitions ───────────────────────────────────────────
// target: score to beat in timeLimit seconds
// obstacles: grey Bit blocks placed on the grid at start
// obstacleRate: spawn rate of new obstacle blocks from above (0-1)
//
// Difficulty scale:
//   Stage 1-5:   target 150-300   obstacles 0    rate 0
//   Stage 6-10:  target 350-560   obstacles 0    rate 0
//   Stage 11-15: target 620-950   obstacles 1-2  rate 0.02
//   Stage 16-20: target 1050-1500 obstacles 2-3  rate 0.04
//   Stage 21-25: target 1650-2300 obstacles 3-4  rate 0.07
//   Stage 26-30: target 2500-3300 obstacles 4-5  rate 0.10
//   Stage 31-32: target 3600-4000 obstacles 6    rate 0.14

export const STAGES = [
  // ── Zone 1: BOOT SECTOR ──────────────────────────────────────
  { id:  1, name: 'BUG #001', subtitle: 'Hello Bug',       zone: 1, target:  150, timeLimit: 30, obstacles: 0, obstacleRate: 0.00 },
  { id:  2, name: 'BUG #002', subtitle: 'First Crash',     zone: 1, target:  200, timeLimit: 30, obstacles: 0, obstacleRate: 0.00 },
  { id:  3, name: 'BUG #003', subtitle: 'Reboot Loop',     zone: 1, target:  240, timeLimit: 30, obstacles: 0, obstacleRate: 0.00 },
  { id:  4, name: 'BUG #004', subtitle: 'Blue Screen',     zone: 1, target:  280, timeLimit: 30, obstacles: 0, obstacleRate: 0.00 },
  { id:  5, name: 'BUG #005', subtitle: 'Safe Mode',       zone: 1, target:  320, timeLimit: 30, obstacles: 0, obstacleRate: 0.00 },

  // ── Zone 2: MEMORY LEAK ────────────────────────────────────
  { id:  6, name: 'BUG #006', subtitle: 'Heap Dump',       zone: 2, target:  370, timeLimit: 30, obstacles: 0, obstacleRate: 0.00 },
  { id:  7, name: 'BUG #007', subtitle: 'Overflow',        zone: 2, target:  420, timeLimit: 30, obstacles: 0, obstacleRate: 0.00 },
  { id:  8, name: 'BUG #008', subtitle: 'Garbage Collect', zone: 2, target:  470, timeLimit: 30, obstacles: 0, obstacleRate: 0.00 },
  { id:  9, name: 'BUG #009', subtitle: 'Dangling Ptr',    zone: 2, target:  520, timeLimit: 30, obstacles: 0, obstacleRate: 0.00 },
  { id: 10, name: 'BUG #010', subtitle: 'Out of Memory',   zone: 2, target:  580, timeLimit: 30, obstacles: 0, obstacleRate: 0.00 },

  // ── Zone 3: STACK OVERFLOW ────────────────────────────────
  { id: 11, name: 'BUG #011', subtitle: 'Deep Recursion',  zone: 3, target:  650, timeLimit: 30, obstacles: 1, obstacleRate: 0.02 },
  { id: 12, name: 'BUG #012', subtitle: 'Frame Fault',     zone: 3, target:  720, timeLimit: 30, obstacles: 1, obstacleRate: 0.02 },
  { id: 13, name: 'BUG #013', subtitle: 'Infinite Loop',   zone: 3, target:  800, timeLimit: 30, obstacles: 2, obstacleRate: 0.03 },
  { id: 14, name: 'BUG #014', subtitle: 'Buffer Overrun',  zone: 3, target:  880, timeLimit: 30, obstacles: 2, obstacleRate: 0.03 },
  { id: 15, name: 'BUG #015', subtitle: 'Segfault',        zone: 3, target:  970, timeLimit: 30, obstacles: 2, obstacleRate: 0.03 },

  // ── Zone 4: NULL POINTER ──────────────────────────────────
  { id: 16, name: 'BUG #016', subtitle: 'Dereference',     zone: 4, target: 1070, timeLimit: 30, obstacles: 2, obstacleRate: 0.04 },
  { id: 17, name: 'BUG #017', subtitle: 'Void Pointer',    zone: 4, target: 1180, timeLimit: 30, obstacles: 3, obstacleRate: 0.04 },
  { id: 18, name: 'BUG #018', subtitle: 'Wild Pointer',    zone: 4, target: 1300, timeLimit: 30, obstacles: 3, obstacleRate: 0.05 },
  { id: 19, name: 'BUG #019', subtitle: 'Type Mismatch',   zone: 4, target: 1420, timeLimit: 30, obstacles: 3, obstacleRate: 0.05 },
  { id: 20, name: 'BUG #020', subtitle: 'Access Denied',   zone: 4, target: 1560, timeLimit: 30, obstacles: 3, obstacleRate: 0.05 },

  // ── Zone 5: DEADLOCK ──────────────────────────────────────
  { id: 21, name: 'BUG #021', subtitle: 'Mutex Lock',      zone: 5, target: 1700, timeLimit: 30, obstacles: 4, obstacleRate: 0.07 },
  { id: 22, name: 'BUG #022', subtitle: 'Thread Stall',    zone: 5, target: 1870, timeLimit: 30, obstacles: 4, obstacleRate: 0.07 },
  { id: 23, name: 'BUG #023', subtitle: 'Circular Wait',   zone: 5, target: 2050, timeLimit: 30, obstacles: 4, obstacleRate: 0.08 },
  { id: 24, name: 'BUG #024', subtitle: 'Starvation',      zone: 5, target: 2200, timeLimit: 30, obstacles: 4, obstacleRate: 0.08 },
  { id: 25, name: 'BUG #025', subtitle: 'Priority Invert', zone: 5, target: 2350, timeLimit: 30, obstacles: 5, obstacleRate: 0.08 },

  // ── Zone 6: RACE CONDITION ────────────────────────────────
  { id: 26, name: 'BUG #026', subtitle: 'Data Race',       zone: 6, target: 2550, timeLimit: 30, obstacles: 5, obstacleRate: 0.10 },
  { id: 27, name: 'BUG #027', subtitle: 'Dirty Read',      zone: 6, target: 2750, timeLimit: 30, obstacles: 5, obstacleRate: 0.10 },
  { id: 28, name: 'BUG #028', subtitle: 'Lost Update',     zone: 6, target: 2950, timeLimit: 30, obstacles: 5, obstacleRate: 0.11 },
  { id: 29, name: 'BUG #029', subtitle: 'Phantom Read',    zone: 6, target: 3150, timeLimit: 30, obstacles: 5, obstacleRate: 0.11 },
  { id: 30, name: 'BUG #030', subtitle: 'Fork Bomb',       zone: 6, target: 3380, timeLimit: 30, obstacles: 5, obstacleRate: 0.12 },

  // ── Zone 7: KERNEL PANIC ──────────────────────────────────
  { id: 31, name: 'BUG #031', subtitle: 'Kernel Panic',    zone: 7, target: 3650, timeLimit: 30, obstacles: 6, obstacleRate: 0.14 },
  { id: 32, name: 'BUG #032', subtitle: 'System Failure',  zone: 7, target: 4100, timeLimit: 30, obstacles: 6, obstacleRate: 0.14 },
];

// ─── Helpers ─────────────────────────────────────────────────────

export function getStage(id) {
  return STAGES.find(s => s.id === id) ?? STAGES[0];
}

export function getZone(stageId) {
  return ZONES.find(z => z.stages.includes(stageId)) ?? ZONES[0];
}

export const TOTAL_STAGES = STAGES.length; // 32

// Star rating based on score vs target
export function calcStars(score, target) {
  if (score <  target)          return 0;
  if (score <  target * 1.4)   return 1;
  if (score <  target * 2.0)   return 2;
  return 3;
}

// Life system
export const MAX_LIVES           = 5;
export const LIFE_REGEN_MINUTES  = 5;   // 1 life per 5 minutes
export const LIFE_REGEN_MS       = LIFE_REGEN_MINUTES * 60 * 1000;
