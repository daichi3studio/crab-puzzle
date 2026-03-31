/**
 * PuzzleGrid — core match-3 engine
 *
 * Props:
 *   blockDefs   : array of block definitions (EASY_BLOCKS or HARD_BLOCKS)
 *   onScoreAdd  : (pts) => void
 *   onCombo     : (cascadeLevel) => void
 *   paused      : boolean
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import BlockTile from './BlockTile';
import {
  GRID_COLS, GRID_ROWS, TILE_SIZE, TILE_GAP,
  SHIELD_CHANCE, RANDOM_CHANCE, PYRAMID_CHANCE,
  BASE_SCORES, EXTRA_PER, CASCADE_MULT,
} from '../constants/gameConfig';

// ─── Grid helpers ────────────────────────────────────────────────

function randomType(blockDefs) {
  // Pyramid is last in HARD_BLOCKS and marked rare — pick with lower probability
  const lastIdx = blockDefs.length - 1;
  const lastDef = blockDefs[lastIdx];
  if (lastDef?.rare) {
    if (Math.random() < PYRAMID_CHANCE) return lastIdx;
    return Math.floor(Math.random() * lastIdx);
  }
  return Math.floor(Math.random() * blockDefs.length);
}

function randomSpecial() {
  const r = Math.random();
  if (r < SHIELD_CHANCE)  return 'shield';
  if (r < SHIELD_CHANCE + RANDOM_CHANCE) return 'random';
  return null;
}

function makeCell(blockDefs) {
  return { type: randomType(blockDefs), special: randomSpecial(), shieldHits: 0 };
}

function makeGrid(blockDefs) {
  let grid;
  // Re-generate until there are no initial matches
  do {
    grid = Array.from({ length: GRID_ROWS }, () =>
      Array.from({ length: GRID_COLS }, () => makeCell(blockDefs))
    );
  } while (findMatches(grid).size > 0);
  return grid;
}

function deepCopy(grid) {
  return grid.map(row => row.map(cell => ({ ...cell })));
}

// Returns Set of "r,c" strings that are part of a match
function findMatches(grid) {
  const hits = new Set();

  // Horizontal
  for (let r = 0; r < GRID_ROWS; r++) {
    let run = 1;
    for (let c = 1; c <= GRID_COLS; c++) {
      const same = c < GRID_COLS && grid[r][c].type === grid[r][c - 1].type &&
                   grid[r][c - 1].type !== -1 && grid[r][c].type !== -1;
      if (same) {
        run++;
      } else {
        if (run >= 3) for (let k = c - run; k < c; k++) hits.add(`${r},${k}`);
        run = 1;
      }
    }
  }

  // Vertical
  for (let c = 0; c < GRID_COLS; c++) {
    let run = 1;
    for (let r = 1; r <= GRID_ROWS; r++) {
      const same = r < GRID_ROWS && grid[r][c].type === grid[r - 1][c].type &&
                   grid[r - 1][c].type !== -1 && grid[r][c].type !== -1;
      if (same) {
        run++;
      } else {
        if (run >= 3) for (let k = r - run; k < r; k++) hits.add(`${k},${c}`);
        run = 1;
      }
    }
  }

  return hits;
}

// Score for a set of matched cells
function calcScore(matches, blockDefs, cascade) {
  // Count distinct groups (simplified: treat total cells)
  const n = matches.size;
  let base;
  if      (n <= 2) base = 0;
  else if (n <= 3) base = BASE_SCORES[3];
  else if (n <= 4) base = BASE_SCORES[4];
  else if (n <= 5) base = BASE_SCORES[5];
  else             base = BASE_SCORES[5] + (n - 5) * EXTRA_PER;

  // Pyramid bonus: 500 pts per pyramid matched
  let pyramidBonus = 0;
  // (We don't have easy access to which cells are pyramid here, so bonus added in GameScreen)

  return Math.floor(base * Math.pow(CASCADE_MULT, cascade));
}

// Apply gravity: shift non-empty cells down, nulls float up
function applyGravity(grid, blockDefs) {
  const newGrid = deepCopy(grid);
  for (let c = 0; c < GRID_COLS; c++) {
    const col = [];
    for (let r = 0; r < GRID_ROWS; r++) {
      if (newGrid[r][c].type !== -1) col.push({ ...newGrid[r][c] });
    }
    // Fill from bottom
    for (let r = GRID_ROWS - 1; r >= 0; r--) {
      if (col.length > 0) {
        newGrid[r][c] = col.pop();
      } else {
        newGrid[r][c] = makeCell(blockDefs);
      }
    }
  }
  return newGrid;
}

// ─── Component ───────────────────────────────────────────────────

export default function PuzzleGrid({ blockDefs, onScoreAdd, onCombo, paused }) {
  const [grid, setGrid]         = useState(() => makeGrid(blockDefs));
  const [selected, setSelected] = useState(null);
  const [locked, setLocked]     = useState(false); // block input during cascade

  const blockDefsRef = useRef(blockDefs);
  blockDefsRef.current = blockDefs;

  // ─── Random-block ticker (changes type every 4s) ─────────────
  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      setGrid(prev => {
        const next = deepCopy(prev);
        for (let r = 0; r < GRID_ROWS; r++) {
          for (let c = 0; c < GRID_COLS; c++) {
            if (next[r][c].special === 'random') {
              next[r][c].type = randomType(blockDefsRef.current);
            }
          }
        }
        return next;
      });
    }, 4000);
    return () => clearInterval(id);
  }, [paused]);

  // ─── Match processing chain ──────────────────────────────────
  const processMatches = useCallback((currentGrid, matches, cascade) => {
    if (matches.size === 0) {
      setLocked(false);
      return;
    }

    // Score
    const pts = calcScore(matches, blockDefsRef.current, cascade);

    // Count pyramid bonuses
    let pyramidBonus = 0;
    matches.forEach(key => {
      const [r, c] = key.split(',').map(Number);
      const def = blockDefsRef.current[currentGrid[r][c].type];
      if (def?.rare) pyramidBonus += def.scoreBonus ?? 500;
    });

    onScoreAdd(pts + pyramidBonus);
    if (cascade > 0) onCombo(cascade);

    // Mark matched cells as -1 (or handle shields)
    const next = deepCopy(currentGrid);
    matches.forEach(key => {
      const [r, c] = key.split(',').map(Number);
      const cell = next[r][c];
      if (cell.special === 'shield' && cell.shieldHits === 0) {
        // First hit: remove shield, keep block
        next[r][c] = { ...cell, special: null, shieldHits: 1 };
      } else {
        next[r][c] = { type: -1, special: null, shieldHits: 0 };
      }
    });

    setGrid(next);

    // Gravity + refill after short delay
    setTimeout(() => {
      const filled = applyGravity(next, blockDefsRef.current);
      setGrid(filled);

      // Check cascade
      setTimeout(() => {
        const newMatches = findMatches(filled);
        if (newMatches.size > 0) {
          processMatches(filled, newMatches, cascade + 1);
        } else {
          setLocked(false);
        }
      }, 250);
    }, 220);
  }, [onScoreAdd, onCombo]);

  // ─── Swap logic ──────────────────────────────────────────────
  const handlePress = useCallback((row, col) => {
    if (locked || paused) return;

    if (!selected) {
      setSelected({ row, col });
      return;
    }

    const dr = Math.abs(selected.row - row);
    const dc = Math.abs(selected.col - col);

    if (dr + dc === 1) {
      // Adjacent — attempt swap
      setSelected(null);
      setLocked(true);

      const next = deepCopy(grid);
      const tmp  = next[selected.row][selected.col];
      next[selected.row][selected.col] = next[row][col];
      next[row][col]                   = tmp;

      const matches = findMatches(next);
      if (matches.size > 0) {
        setGrid(next);
        setTimeout(() => processMatches(next, matches, 0), 80);
      } else {
        // Invalid swap — snap back
        setLocked(false);
      }
    } else {
      // Not adjacent — reselect
      setSelected({ row, col });
    }
  }, [selected, locked, paused, grid, processMatches]);

  // ─── Render ──────────────────────────────────────────────────
  return (
    <View style={styles.grid}>
      {grid.map((row, r) => (
        <View key={r} style={styles.row}>
          {row.map((cell, c) => {
            if (cell.type === -1) return <View key={c} style={styles.hole} />;
            const def = blockDefs[cell.type] ?? blockDefs[0];
            const isSel = selected?.row === r && selected?.col === c;
            return (
              <BlockTile
                key={c}
                block={cell}
                blockDef={def}
                selected={isSel}
                disabled={locked || paused}
                onPress={() => handlePress(r, c)}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: TILE_GAP,
  },
  row: {
    flexDirection: 'row',
    gap: TILE_GAP,
  },
  hole: {
    width:  TILE_SIZE,
    height: TILE_SIZE,
  },
});
