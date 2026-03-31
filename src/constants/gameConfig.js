// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Crab Puzzle — Game Configuration v2
//  ZooKeeper meets Candy Crush, MOC edition
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ─── Grid ────────────────────────────────────────────────────────
export const GRID_COLS  = 7;
export const GRID_ROWS  = 8;
export const TILE_SIZE  = 44;
export const TILE_GAP   = 3;
export const SWIPE_THRESHOLD = 12; // px to register a swipe

// ─── Round ───────────────────────────────────────────────────────
export const ROUND_TIME   = 30;  // seconds per round
export const TOTAL_ROUNDS = 3;

// ─── Block types (same for Easy & Hard) ─────────────────────────
// 5 regular types, always present
export const BLOCKS = [
  { id: 0, phase: 1, char: null,   color: '#7888A0', accent: '#556880', name: 'Bit'  },
  { id: 1, phase: 2, char: null,   color: '#E07830', accent: '#B85818', name: 'Core' },
  { id: 2, phase: 3, char: 'chip', color: '#3090D0', accent: '#1868A0', name: 'Chip' },
  { id: 3, phase: 3, char: 'wing', color: '#48B040', accent: '#288818', name: 'Wing' },
  { id: 4, phase: 3, char: 'pink', color: '#E868A8', accent: '#C04888', name: 'Pink' },
];

// Special blocks (Robot = wild card, Pyramid = ultra rare powerup)
export const SPECIAL_ROBOT = {
  id: 'robot', phase: 3, char: 'robot',
  color: '#909098', accent: '#606068', name: 'Robot',
};
export const SPECIAL_PYRAMID = {
  id: 'pyramid', phase: 3, char: 'pyramid',
  color: '#5020A0', accent: '#D4A820', name: 'Pyramid',
};

// Spawn rates for specials (per new block spawned)
export const ROBOT_RATE_EASY    = 0.04;
export const ROBOT_RATE_HARD    = 0.07;
export const PYRAMID_RATE_EASY  = 0;      // never in easy
export const PYRAMID_RATE_HARD  = 0.015;  // 1.5% in hard

// ─── Scoring ─────────────────────────────────────────────────────
export const SCORE_MATCH3       = 30;
export const SCORE_MATCH4       = 80;
export const SCORE_MATCH5       = 150;
export const SCORE_EXTRA        = 60;     // per block above 5
export const SCORE_PYRAMID      = 500;    // bonus for clearing pyramid
export const CASCADE_MULT       = 1.3;    // per cascade level

// ─── Opponent AI (points per second range) ───────────────────────
export const OPP_EASY = { min: 5,  max: 15 };
export const OPP_HARD = { min: 15, max: 45 };

// ─── Character unlock thresholds ─────────────────────────────────
export const UNLOCK_P2_AT       = 3;
export const UNLOCK_P3_AT       = 5;
export const UNLOCK_PYRAMID_AT  = 5;  // hard wins

export const ALL_CHARS = [
  { key: 'p1',      phase: 1, char: null,      name: 'Bit',     requireWins: 0,  requireHard: 0 },
  { key: 'p2',      phase: 2, char: null,      name: 'Core',    requireWins: 3,  requireHard: 0 },
  { key: 'chip',    phase: 3, char: 'chip',    name: 'Chip',    requireWins: 5,  requireHard: 0 },
  { key: 'wing',    phase: 3, char: 'wing',    name: 'Wing',    requireWins: 5,  requireHard: 0 },
  { key: 'gentle',  phase: 3, char: 'gentle',  name: 'Gentle',  requireWins: 5,  requireHard: 0 },
  { key: 'power',   phase: 3, char: 'power',   name: 'Power',   requireWins: 5,  requireHard: 0 },
  { key: 'pink',    phase: 3, char: 'pink',    name: 'Pink',    requireWins: 5,  requireHard: 0 },
  { key: 'robot',   phase: 3, char: 'robot',   name: 'Robot',   requireWins: 5,  requireHard: 0 },
  { key: 'pyramid', phase: 3, char: 'pyramid', name: 'Pyramid', requireWins: 0,  requireHard: 5 },
];

// ─── Theme colors (cleaner, less retro) ──────────────────────────
export const COLORS = {
  bg:         '#0C1624',
  panel:      '#142030',
  panelLight: '#1A2840',
  border:     '#2A3A50',
  accent:     '#00BBEE',
  accentDark: '#0088AA',
  gold:       '#E8B830',
  text:       '#F0F4FF',
  textDim:    '#6080A0',
  textMid:    '#90A8C0',
  win:        '#30E888',
  lose:       '#FF4060',
  timerWarn:  '#FF8830',
  timerDanger:'#FF3040',
};
