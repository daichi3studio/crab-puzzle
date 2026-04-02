// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Crab Puzzle — Stage Definitions
//  World concept: "Fix the Bugs" — crab bugs invade the system
//  Clear stages by scoring the target within the time limit
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ─── Zones ───────────────────────────────────────────────────────
export const ZONES = [
  { id: 1, name: 'BOOT SECTOR',     color: '#3090D0', stages: [ 1, 2, 3, 4, 5]  },
  { id: 2, name: 'MEMORY LEAK',     color: '#48B040', stages: [ 6, 7, 8, 9,10]  },
  { id: 3, name: 'STACK OVERFLOW',  color: '#E07830', stages: [11,12,13,14,15]  },
  { id: 4, name: 'NULL POINTER',    color: '#E868A8', stages: [16,17,18,19,20]  },
  { id: 5, name: 'DEADLOCK',        color: '#C82020', stages: [21,22,23,24,25]  },
  { id: 6, name: 'RACE CONDITION',  color: '#7040B0', stages: [26,27,28,29,30]  },
  { id: 7, name: 'KERNEL PANIC',    color: '#909098', stages: [31,32,33,34,35]  },
  { id: 8, name: 'SYSTEM MELTDOWN', color: '#FF6820', stages: [36,37,38,39,40]  },
];

// ─── Stage definitions ───────────────────────────────────────────
// comboTarget: minimum cascade level to earn ⭐2 (cascade=1→×2, 2→×3, etc.)
// Stars: ⭐1=clear, ⭐2=clear+combo≥comboTarget, ⭐3=clear+score≥target×1.3
// Obstacles: appear from stage 20, max 30 total on board
// comboTarget gradual ramp (cascade level needed for ⭐2):
//  1-2: ×2 (intro, almost free)
//  3-9: ×3
// 10-18: ×4
// 19-30: ×5
// 31-40: ×6
export const STAGES = [
  // ── Zone 1: BOOT SECTOR (25s) ────────────────────────────────
  { id:  1, name: 'BUG #001', subtitle: 'Hello Bug',       zone: 1, target:  220, timeLimit: 25, obstacles: 0, obstacleRate: 0.00, comboTarget: 1 },
  { id:  2, name: 'BUG #002', subtitle: 'First Crash',     zone: 1, target:  290, timeLimit: 25, obstacles: 0, obstacleRate: 0.00, comboTarget: 2 },
  { id:  3, name: 'BUG #003', subtitle: 'Reboot Loop',     zone: 1, target:  360, timeLimit: 25, obstacles: 0, obstacleRate: 0.00, comboTarget: 2 },
  { id:  4, name: 'BUG #004', subtitle: 'Blue Screen',     zone: 1, target:  430, timeLimit: 25, obstacles: 0, obstacleRate: 0.00, comboTarget: 2 },
  { id:  5, name: 'BUG #005', subtitle: 'Safe Mode',       zone: 1, target:  500, timeLimit: 25, obstacles: 0, obstacleRate: 0.00, comboTarget: 2 },

  // ── Zone 2: MEMORY LEAK (28s) ────────────────────────────────
  { id:  6, name: 'BUG #006', subtitle: 'Heap Dump',       zone: 2, target:  520, timeLimit: 28, obstacles: 0, obstacleRate: 0.00, comboTarget: 2 },
  { id:  7, name: 'BUG #007', subtitle: 'Overflow',        zone: 2, target:  590, timeLimit: 28, obstacles: 0, obstacleRate: 0.00, comboTarget: 2 },
  { id:  8, name: 'BUG #008', subtitle: 'Garbage Collect', zone: 2, target:  660, timeLimit: 28, obstacles: 0, obstacleRate: 0.00, comboTarget: 3 },
  { id:  9, name: 'BUG #009', subtitle: 'Dangling Ptr',    zone: 2, target:  730, timeLimit: 28, obstacles: 0, obstacleRate: 0.00, comboTarget: 3 },
  { id: 10, name: 'BUG #010', subtitle: 'Out of Memory',   zone: 2, target:  810, timeLimit: 28, obstacles: 0, obstacleRate: 0.00, comboTarget: 3 },

  // ── Zone 3: STACK OVERFLOW (28s, no obstacles) ───────────────
  { id: 11, name: 'BUG #011', subtitle: 'Deep Recursion',  zone: 3, target:  650, timeLimit: 28, obstacles: 0, obstacleRate: 0.00, comboTarget: 3 },
  { id: 12, name: 'BUG #012', subtitle: 'Frame Fault',     zone: 3, target:  720, timeLimit: 28, obstacles: 0, obstacleRate: 0.00, comboTarget: 3 },
  { id: 13, name: 'BUG #013', subtitle: 'Infinite Loop',   zone: 3, target:  800, timeLimit: 28, obstacles: 0, obstacleRate: 0.00, comboTarget: 3 },
  { id: 14, name: 'BUG #014', subtitle: 'Buffer Overrun',  zone: 3, target:  880, timeLimit: 28, obstacles: 0, obstacleRate: 0.00, comboTarget: 4 },
  { id: 15, name: 'BUG #015', subtitle: 'Segfault',        zone: 3, target:  970, timeLimit: 28, obstacles: 0, obstacleRate: 0.00, comboTarget: 4 },

  // ── Zone 4: NULL POINTER (30s, obstacles from stage 20) ──────
  { id: 16, name: 'BUG #016', subtitle: 'Dereference',     zone: 4, target: 1070, timeLimit: 30, obstacles: 0, obstacleRate: 0.00, comboTarget: 4 },
  { id: 17, name: 'BUG #017', subtitle: 'Void Pointer',    zone: 4, target: 1180, timeLimit: 30, obstacles: 0, obstacleRate: 0.00, comboTarget: 4 },
  { id: 18, name: 'BUG #018', subtitle: 'Wild Pointer',    zone: 4, target: 1300, timeLimit: 30, obstacles: 0, obstacleRate: 0.00, comboTarget: 4 },
  { id: 19, name: 'BUG #019', subtitle: 'Type Mismatch',   zone: 4, target: 1420, timeLimit: 30, obstacles: 0, obstacleRate: 0.00, comboTarget: 5 },
  { id: 20, name: 'BUG #020', subtitle: 'Access Denied',   zone: 4, target: 1560, timeLimit: 30, obstacles: 1, obstacleRate: 0.03, comboTarget: 5 },

  // ── Zone 5: DEADLOCK (30s) ────────────────────────────────────
  { id: 21, name: 'BUG #021', subtitle: 'Mutex Lock',      zone: 5, target: 1700, timeLimit: 30, obstacles: 1, obstacleRate: 0.03, comboTarget: 5 },
  { id: 22, name: 'BUG #022', subtitle: 'Thread Stall',    zone: 5, target: 1870, timeLimit: 30, obstacles: 2, obstacleRate: 0.04, comboTarget: 5 },
  { id: 23, name: 'BUG #023', subtitle: 'Circular Wait',   zone: 5, target: 2050, timeLimit: 30, obstacles: 2, obstacleRate: 0.04, comboTarget: 5 },
  { id: 24, name: 'BUG #024', subtitle: 'Starvation',      zone: 5, target: 2200, timeLimit: 30, obstacles: 3, obstacleRate: 0.05, comboTarget: 5 },
  { id: 25, name: 'BUG #025', subtitle: 'Priority Invert', zone: 5, target: 2350, timeLimit: 30, obstacles: 3, obstacleRate: 0.05, comboTarget: 5 },

  // ── Zone 6: RACE CONDITION (30s) ─────────────────────────────
  { id: 26, name: 'BUG #026', subtitle: 'Data Race',       zone: 6, target: 2550, timeLimit: 30, obstacles: 4, obstacleRate: 0.06, comboTarget: 5 },
  { id: 27, name: 'BUG #027', subtitle: 'Dirty Read',      zone: 6, target: 2750, timeLimit: 30, obstacles: 4, obstacleRate: 0.06, comboTarget: 5 },
  { id: 28, name: 'BUG #028', subtitle: 'Lost Update',     zone: 6, target: 2950, timeLimit: 30, obstacles: 5, obstacleRate: 0.07, comboTarget: 6 },
  { id: 29, name: 'BUG #029', subtitle: 'Phantom Read',    zone: 6, target: 3150, timeLimit: 30, obstacles: 5, obstacleRate: 0.07, comboTarget: 6 },
  { id: 30, name: 'BUG #030', subtitle: 'Fork Bomb',       zone: 6, target: 3380, timeLimit: 30, obstacles: 6, obstacleRate: 0.08, comboTarget: 6 },

  // ── Zone 7: KERNEL PANIC (30s) ───────────────────────────────
  { id: 31, name: 'BUG #031', subtitle: 'Kernel Panic',    zone: 7, target: 3650, timeLimit: 30, obstacles: 6, obstacleRate: 0.09, comboTarget: 6 },
  { id: 32, name: 'BUG #032', subtitle: 'System Failure',  zone: 7, target: 3950, timeLimit: 30, obstacles: 7, obstacleRate: 0.10, comboTarget: 6 },
  { id: 33, name: 'BUG #033', subtitle: 'Core Dump',       zone: 7, target: 4300, timeLimit: 30, obstacles: 7, obstacleRate: 0.10, comboTarget: 6 },
  { id: 34, name: 'BUG #034', subtitle: 'Watchdog Fail',   zone: 7, target: 4700, timeLimit: 30, obstacles: 8, obstacleRate: 0.11, comboTarget: 6 },
  { id: 35, name: 'BUG #035', subtitle: 'Fatal Exception', zone: 7, target: 5200, timeLimit: 30, obstacles: 8, obstacleRate: 0.12, comboTarget: 6 },

  // ── Zone 8: SYSTEM MELTDOWN (30s) ────────────────────────────
  { id: 36, name: 'BUG #036', subtitle: 'Thermal Runaway', zone: 8, target: 5500, timeLimit: 30, obstacles:  9, obstacleRate: 0.13, comboTarget: 6 },
  { id: 37, name: 'BUG #037', subtitle: 'Clock Skew',      zone: 8, target: 5900, timeLimit: 30, obstacles:  9, obstacleRate: 0.14, comboTarget: 6 },
  { id: 38, name: 'BUG #038', subtitle: 'Power Surge',     zone: 8, target: 6300, timeLimit: 30, obstacles: 10, obstacleRate: 0.15, comboTarget: 6 },
  { id: 39, name: 'BUG #039', subtitle: 'Bit Flip',        zone: 8, target: 6700, timeLimit: 30, obstacles: 10, obstacleRate: 0.16, comboTarget: 6 },
  { id: 40, name: 'BUG #040', subtitle: 'Total Collapse',  zone: 8, target: 7000, timeLimit: 30, obstacles: 10, obstacleRate: 0.18, comboTarget: 6 },
];

// ─── VS Battles (appear after each zone) ────────────────────────
export const VS_BATTLES = [
  { id: 'vs1', afterStage:  5, unlocksChar: 'p2',      charName: 'Core',    difficulty: 'easy'       },
  { id: 'vs2', afterStage: 10, unlocksChar: 'chip',    charName: 'Chip',    difficulty: 'easy'       },
  { id: 'vs3', afterStage: 15, unlocksChar: 'pink',    charName: 'Pink',    difficulty: 'normal'     },
  { id: 'vs4', afterStage: 20, unlocksChar: 'wing',    charName: 'Wing',    difficulty: 'normal'     },
  { id: 'vs5', afterStage: 25, unlocksChar: 'power',   charName: 'Power',   difficulty: 'hard'       },
  { id: 'vs6', afterStage: 30, unlocksChar: 'gentle',  charName: 'Gentle',  difficulty: 'hard'       },
  { id: 'vs7', afterStage: 35, unlocksChar: 'robot',   charName: 'Robot',   difficulty: 'superhard'  },
  { id: 'vs8', afterStage: 40, unlocksChar: 'pyramid', charName: 'Pyramid', difficulty: 'superhard'  },
];

export function getVsBattle(id) {
  return VS_BATTLES.find(v => v.id === id);
}

export function getVsAfterStage(stageId) {
  return VS_BATTLES.find(v => v.afterStage === stageId) ?? null;
}

export function getStage(id) {
  return STAGES.find(s => s.id === id) ?? STAGES[0];
}

export function getZone(stageId) {
  return ZONES.find(z => z.stages.includes(stageId)) ?? ZONES[0];
}

export const TOTAL_STAGES = STAGES.length; // 40

// Star rating:
//   ⭐1 = clear (score ≥ target)
//   ⭐2 = clear + achieve combo goal (maxCombo ≥ comboTarget)
//   ⭐3 = clear + score ≥ target × 1.3
export function calcStars(score, target, maxCombo = 0, comboTarget = 99) {
  if (score < target) return 0;
  const comboOk = maxCombo >= comboTarget;
  const scoreOk = score >= target * 1.3;
  return 1 + (comboOk ? 1 : 0) + (scoreOk ? 1 : 0);
}

// Life system
export const MAX_LIVES           = 5;
export const LIFE_REGEN_MINUTES  = 5;
export const LIFE_REGEN_MS       = LIFE_REGEN_MINUTES * 60 * 1000;
