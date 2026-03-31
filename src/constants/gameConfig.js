// ─── Grid ────────────────────────────────────────────────────────
export const GRID_COLS = 7;
export const GRID_ROWS = 8;
export const TILE_SIZE = 44;
export const TILE_GAP  = 2;

// ─── Match / Round ────────────────────────────────────────────────
export const ROUND_TIME   = 60;   // seconds
export const TOTAL_ROUNDS = 3;

// ─── Special block spawn rates (0–1) ─────────────────────────────
export const SHIELD_CHANCE  = 0.06;  // 6% of new tiles are shields
export const RANDOM_CHANCE  = 0.04;  // 4% are random-change tiles
export const PYRAMID_CHANCE = 0.025; // 2.5% in hard mode

// ─── Block definitions ────────────────────────────────────────────
// Easy: 5 types — P1 (3 tints) + P2 (2 tints)
export const EASY_BLOCKS = [
  { id: 0, phase: 1, char: null, bg: '#B03030', border: '#7A1010', label: 'Bit·R' },
  { id: 1, phase: 1, char: null, bg: '#2255CC', border: '#0A2A88', label: 'Bit·B' },
  { id: 2, phase: 1, char: null, bg: '#228833', border: '#0A5510', label: 'Bit·G' },
  { id: 3, phase: 2, char: null, bg: '#BB5511', border: '#883300', label: 'Core'  },
  { id: 4, phase: 2, char: null, bg: '#883399', border: '#551166', label: 'Core·P'},
];

// Hard: 6 regular P3 + Pyramid (ultra-rare)
export const HARD_BLOCKS = [
  { id: 0, phase: 3, char: 'chip',    bg: '#1A5A90', border: '#0A3060', label: 'Chip'   },
  { id: 1, phase: 3, char: 'wing',    bg: '#3A7820', border: '#1A5008', label: 'Wing'   },
  { id: 2, phase: 3, char: 'gentle',  bg: '#383838', border: '#1A1A1A', label: 'Gentle' },
  { id: 3, phase: 3, char: 'power',   bg: '#990808', border: '#660000', label: 'Power'  },
  { id: 4, phase: 3, char: 'pink',    bg: '#CC3080', border: '#991050', label: 'Pink'   },
  { id: 5, phase: 3, char: 'robot',   bg: '#606060', border: '#303030', label: 'Robot'  },
  { id: 6, phase: 3, char: 'pyramid', bg: '#2A0850', border: '#C09010', label: 'Pyramid',
    rare: true, scoreBonus: 500 },
];

// ─── Scoring ──────────────────────────────────────────────────────
// match3=30, match4=100, match5=200, match6+=200+50*(n-5)
export const BASE_SCORES  = [0, 0, 0, 30, 100, 200];
export const EXTRA_PER    = 50;   // per block above 5
export const CASCADE_MULT = 1.25; // cascade multiplier per level

// ─── Opponent AI (score per tick, tick = 1s) ──────────────────────
export const OPP_EASY = { min: 6,  max: 18 };
export const OPP_HARD = { min: 18, max: 55 };

// ─── Character unlock thresholds ─────────────────────────────────
export const UNLOCK_P2_AT       = 3;   // total wins
export const UNLOCK_P3_AT       = 5;   // total wins
export const UNLOCK_PYRAMID_AT  = 5;   // hard wins required

// ─── Player avatar roster (in unlock order) ──────────────────────
export const ALL_CHARS = [
  { key: 'p1',      phase: 1, char: null,      name: 'Bit',     requireWins: 0,                requireHard: 0  },
  { key: 'p2',      phase: 2, char: null,      name: 'Core',    requireWins: UNLOCK_P2_AT,     requireHard: 0  },
  { key: 'chip',    phase: 3, char: 'chip',    name: 'Chip',    requireWins: UNLOCK_P3_AT,     requireHard: 0  },
  { key: 'wing',    phase: 3, char: 'wing',    name: 'Wing',    requireWins: UNLOCK_P3_AT,     requireHard: 0  },
  { key: 'gentle',  phase: 3, char: 'gentle',  name: 'Gentle',  requireWins: UNLOCK_P3_AT,     requireHard: 0  },
  { key: 'power',   phase: 3, char: 'power',   name: 'Power',   requireWins: UNLOCK_P3_AT,     requireHard: 0  },
  { key: 'pink',    phase: 3, char: 'pink',    name: 'Pink',    requireWins: UNLOCK_P3_AT,     requireHard: 0  },
  { key: 'robot',   phase: 3, char: 'robot',   name: 'Robot',   requireWins: UNLOCK_P3_AT,     requireHard: 0  },
  { key: 'pyramid', phase: 3, char: 'pyramid', name: 'Pyramid', requireWins: 0,                requireHard: UNLOCK_PYRAMID_AT },
];

// ─── Colors / theme ──────────────────────────────────────────────
export const COLORS = {
  bg:        '#0A0A1A',
  panel:     '#12122A',
  border:    '#334466',
  accent:    '#00CCFF',
  gold:      '#D4A820',
  text:      '#EEEEFF',
  textDim:   '#667799',
  win:       '#00FF88',
  lose:      '#FF4444',
  selected:  '#FFFF00',
  shield:    '#88AAFF',
  random:    '#FF88FF',
};
