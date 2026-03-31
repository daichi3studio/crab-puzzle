import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@crab_puzzle_save';

const DEFAULT_STATE = {
  totalWins:   0,
  hardWins:    0,
  selectedChar: 'p1',   // key from ALL_CHARS
  difficulty:   'easy', // 'easy' | 'hard'
  bestScore:    0,
};

export const useGameStore = create((set, get) => ({
  ...DEFAULT_STATE,

  // ─── Actions ────────────────────────────────────────────────────

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
    const { totalWins, hardWins, selectedChar, difficulty, bestScore } = get();
    try {
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ totalWins, hardWins, selectedChar, difficulty, bestScore })
      );
    } catch (_) {}
  },

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        set({ ...DEFAULT_STATE, ...data });
      }
    } catch (_) {}
  },
}));
