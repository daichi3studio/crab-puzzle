import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MAX_LIVES, LIFE_REGEN_MS } from '../constants/stages';

const STORAGE_KEY = '@crab_puzzle_save_v2';

const DEFAULT_STATE = {
  // Character & battle
  selectedChar:  'p1',
  difficulty:    'easy',
  totalWins:     0,
  hardWins:      0,
  bestScore:     0,

  // Stage progress
  stageProgress: 1,            // highest unlocked stage ID
  clearedStages: {},           // { [stageId]: { stars, score } }

  // Lives
  lives:          MAX_LIVES,
  livesUpdatedAt: null,        // ISO timestamp — when lives were last modified
};

// ─── Compute current lives including time-based recovery ─────────
function computeCurrentLives(storedLives, livesUpdatedAt) {
  if (storedLives >= MAX_LIVES || !livesUpdatedAt) return storedLives;
  const elapsed = Date.now() - new Date(livesUpdatedAt).getTime();
  const recovered = Math.floor(elapsed / LIFE_REGEN_MS);
  return Math.min(MAX_LIVES, storedLives + recovered);
}

// ─── Time until next life recovery (ms) ─────────────────────────
export function msUntilNextLife(storedLives, livesUpdatedAt) {
  if (storedLives >= MAX_LIVES || !livesUpdatedAt) return 0;
  const elapsed = Date.now() - new Date(livesUpdatedAt).getTime();
  const nextAt = LIFE_REGEN_MS - (elapsed % LIFE_REGEN_MS);
  return nextAt;
}

export const useGameStore = create((set, get) => ({
  ...DEFAULT_STATE,

  // ─── Lives ──────────────────────────────────────────────────────

  getLives: () => {
    const { lives, livesUpdatedAt } = get();
    return computeCurrentLives(lives, livesUpdatedAt);
  },

  spendLife: () => {
    const { lives, livesUpdatedAt } = get();
    const current = computeCurrentLives(lives, livesUpdatedAt);
    if (current <= 0) return false;
    const newLives = current - 1;
    const now = new Date().toISOString();
    set({ lives: newLives, livesUpdatedAt: now });
    get()._save();
    return true;
  },

  // ─── Stage progress ─────────────────────────────────────────────

  clearStage: ({ stageId, score, stars }) => {
    const { clearedStages, stageProgress } = get();
    const prev = clearedStages[stageId] ?? { stars: 0, score: 0 };
    const updated = {
      ...clearedStages,
      [stageId]: {
        stars: Math.max(prev.stars, stars),
        score: Math.max(prev.score, score),
      },
    };
    const newProgress = Math.max(stageProgress, stageId + 1);
    set({ clearedStages: updated, stageProgress: newProgress });
    get()._save();
  },

  // ─── Battle / character ─────────────────────────────────────────

  setDifficulty: (difficulty) => {
    set({ difficulty });
    get()._save();
  },

  setSelectedChar: (key) => {
    set({ selectedChar: key });
    get()._save();
  },

  recordResult: ({ won, hard, score }) => {
    const prev = get();
    const totalWins = prev.totalWins + (won ? 1 : 0);
    const hardWins  = prev.hardWins  + (won && hard ? 1 : 0);
    const bestScore = Math.max(prev.bestScore, score);
    set({ totalWins, hardWins, bestScore });
    get()._save();
  },

  // ─── Persistence ────────────────────────────────────────────────

  _save: async () => {
    const s = get();
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
        selectedChar:  s.selectedChar,
        difficulty:    s.difficulty,
        totalWins:     s.totalWins,
        hardWins:      s.hardWins,
        bestScore:     s.bestScore,
        stageProgress: s.stageProgress,
        clearedStages: s.clearedStages,
        lives:         s.lives,
        livesUpdatedAt: s.livesUpdatedAt,
      }));
    } catch (_) {}
  },

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        // Compute recovered lives on hydrate
        const lives = computeCurrentLives(
          data.lives ?? MAX_LIVES,
          data.livesUpdatedAt ?? null,
        );
        // If lives recovered fully, reset livesUpdatedAt
        const livesUpdatedAt = lives >= MAX_LIVES ? null : data.livesUpdatedAt;
        set({ ...DEFAULT_STATE, ...data, lives, livesUpdatedAt });
      }
    } catch (_) {}
  },
}));
