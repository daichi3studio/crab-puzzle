/**
 * PuzzleGrid v2 — Swipe-based match-3 with smooth animations
 *
 * Key changes from v1:
 *  - Swipe (PanResponder) to swap, not tap-tap
 *  - Robot = wild card (matches any adjacent)
 *  - Pyramid = rare, huge bonus
 *  - Smoother cascade timing
 */
import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { View, StyleSheet, PanResponder, Animated } from 'react-native';
import BlockTile from './BlockTile';
import {
  GRID_COLS, GRID_ROWS, TILE_SIZE, TILE_GAP, SWIPE_THRESHOLD,
  BLOCKS, SPECIAL_ROBOT, SPECIAL_PYRAMID,
  ROBOT_RATE_EASY, ROBOT_RATE_HARD, PYRAMID_RATE_EASY, PYRAMID_RATE_HARD,
  SCORE_MATCH3, SCORE_MATCH4, SCORE_MATCH5, SCORE_EXTRA, SCORE_PYRAMID,
  CASCADE_MULT,
} from '../constants/gameConfig';

// ─── Helpers ────────────────────────────────────────────────────

function randomType() {
  return Math.floor(Math.random() * BLOCKS.length);
}

function randomSpecial(hard) {
  const r = Math.random();
  const pyramidRate = hard ? PYRAMID_RATE_HARD : PYRAMID_RATE_EASY;
  const robotRate   = hard ? ROBOT_RATE_HARD   : ROBOT_RATE_EASY;
  if (r < pyramidRate) return 'pyramid';
  if (r < pyramidRate + robotRate) return 'robot';
  return null;
}

function makeCell(hard) {
  return { type: randomType(), special: randomSpecial(hard) };
}

function deepCopy(grid) {
  return grid.map(row => row.map(cell => ({ ...cell })));
}

// Check if two cells match (robot = wild card matches anything)
function cellsMatch(a, b) {
  if (!a || !b) return false;
  if (a.type === -1 || b.type === -1) return false;
  if (a.special === 'robot' || b.special === 'robot') return true;
  return a.type === b.type;
}

function findMatches(grid) {
  const hits = new Set();

  // Horizontal runs
  for (let r = 0; r < GRID_ROWS; r++) {
    let start = 0;
    for (let c = 1; c <= GRID_COLS; c++) {
      const same = c < GRID_COLS && cellsMatch(grid[r][c], grid[r][c - 1]);
      if (!same) {
        if (c - start >= 3) {
          for (let k = start; k < c; k++) hits.add(`${r},${k}`);
        }
        start = c;
      }
    }
  }

  // Vertical runs
  for (let c = 0; c < GRID_COLS; c++) {
    let start = 0;
    for (let r = 1; r <= GRID_ROWS; r++) {
      const same = r < GRID_ROWS && cellsMatch(grid[r][c], grid[r - 1][c]);
      if (!same) {
        if (r - start >= 3) {
          for (let k = start; k < r; k++) hits.add(`${k},${c}`);
        }
        start = r;
      }
    }
  }

  return hits;
}

function makeCleanGrid(hard) {
  let grid;
  let attempts = 0;
  do {
    grid = Array.from({ length: GRID_ROWS }, () =>
      Array.from({ length: GRID_COLS }, () => makeCell(hard))
    );
    attempts++;
  } while (findMatches(grid).size > 0 && attempts < 100);
  return grid;
}

function calcScore(matchCount, cascade) {
  let base;
  if      (matchCount <= 3) base = SCORE_MATCH3;
  else if (matchCount <= 4) base = SCORE_MATCH4;
  else if (matchCount <= 5) base = SCORE_MATCH5;
  else                      base = SCORE_MATCH5 + (matchCount - 5) * SCORE_EXTRA;
  return Math.floor(base * Math.pow(CASCADE_MULT, cascade));
}

function applyGravity(grid, hard) {
  const next = deepCopy(grid);
  for (let c = 0; c < GRID_COLS; c++) {
    const col = [];
    for (let r = 0; r < GRID_ROWS; r++) {
      if (next[r][c].type !== -1) col.push({ ...next[r][c] });
    }
    for (let r = GRID_ROWS - 1; r >= 0; r--) {
      next[r][c] = col.length > 0 ? col.pop() : makeCell(hard);
    }
  }
  return next;
}

// ─── Component ───────────────────────────────────────────────────

export default function PuzzleGrid({ hard, onScoreAdd, onCombo, paused }) {
  const [grid, setGrid]         = useState(() => makeCleanGrid(hard));
  const [selected, setSelected] = useState(null);
  const [locked, setLocked]     = useState(false);

  const hardRef = useRef(hard);
  hardRef.current = hard;

  // ─── Swipe state ──────────────────────────────────────────────
  const touchStart = useRef(null);

  const getCellAt = useCallback((x, y) => {
    const cellW = TILE_SIZE + TILE_GAP;
    const col = Math.floor(x / cellW);
    const row = Math.floor(y / cellW);
    if (row < 0 || row >= GRID_ROWS || col < 0 || col >= GRID_COLS) return null;
    return { row, col };
  }, []);

  // ─── Match processing ────────────────────────────────────────
  const processMatches = useCallback((currentGrid, matches, cascade) => {
    if (matches.size === 0) {
      setLocked(false);
      return;
    }

    // Score
    let pts = calcScore(matches.size, cascade);
    let pyramidBonus = 0;
    matches.forEach(key => {
      const [r, c] = key.split(',').map(Number);
      if (currentGrid[r][c].special === 'pyramid') pyramidBonus += SCORE_PYRAMID;
    });
    onScoreAdd(pts + pyramidBonus);
    if (cascade > 0) onCombo(cascade);

    // Remove matched cells
    const next = deepCopy(currentGrid);
    matches.forEach(key => {
      const [r, c] = key.split(',').map(Number);
      next[r][c] = { type: -1, special: null };
    });
    setGrid(next);

    // Gravity + cascade
    setTimeout(() => {
      const filled = applyGravity(next, hardRef.current);
      setGrid(filled);
      setTimeout(() => {
        const newMatches = findMatches(filled);
        if (newMatches.size > 0) {
          processMatches(filled, newMatches, cascade + 1);
        } else {
          setLocked(false);
        }
      }, 200);
    }, 180);
  }, [onScoreAdd, onCombo]);

  // ─── Swap logic ───────────────────────────────────────────────
  const attemptSwap = useCallback((fromR, fromC, toR, toC) => {
    if (locked || paused) return;
    if (toR < 0 || toR >= GRID_ROWS || toC < 0 || toC >= GRID_COLS) return;

    setLocked(true);
    const next = deepCopy(grid);
    const tmp = next[fromR][fromC];
    next[fromR][fromC] = next[toR][toC];
    next[toR][toC] = tmp;

    const matches = findMatches(next);
    if (matches.size > 0) {
      setGrid(next);
      setTimeout(() => processMatches(next, matches, 0), 100);
    } else {
      setLocked(false);
    }
  }, [grid, locked, paused, processMatches]);

  // ─── PanResponder (swipe on grid) ────────────────────────────
  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => !locked && !paused,
    onMoveShouldSetPanResponder:  () => !locked && !paused,
    onPanResponderGrant: (evt) => {
      const { locationX, locationY } = evt.nativeEvent;
      touchStart.current = { x: locationX, y: locationY };
      const cell = getCellAt(locationX, locationY);
      setSelected(cell);
    },
    onPanResponderRelease: (evt, gs) => {
      if (!touchStart.current) return;
      const { dx, dy } = gs;
      const cell = getCellAt(touchStart.current.x, touchStart.current.y);
      setSelected(null);
      touchStart.current = null;
      if (!cell) return;

      let dr = 0, dc = 0;
      if (Math.abs(dx) > Math.abs(dy)) {
        if (Math.abs(dx) > SWIPE_THRESHOLD) dc = dx > 0 ? 1 : -1;
      } else {
        if (Math.abs(dy) > SWIPE_THRESHOLD) dr = dy > 0 ? 1 : -1;
      }
      if (dr !== 0 || dc !== 0) {
        attemptSwap(cell.row, cell.col, cell.row + dr, cell.col + dc);
      }
    },
    onPanResponderTerminate: () => {
      setSelected(null);
      touchStart.current = null;
    },
  }), [locked, paused, getCellAt, attemptSwap]);

  // ─── Render ───────────────────────────────────────────────────
  const gridWidth  = GRID_COLS * (TILE_SIZE + TILE_GAP) - TILE_GAP;
  const gridHeight = GRID_ROWS * (TILE_SIZE + TILE_GAP) - TILE_GAP;

  return (
    <View
      style={[styles.grid, { width: gridWidth, height: gridHeight }]}
      {...panResponder.panHandlers}
    >
      {grid.map((row, r) => (
        <View key={r} style={styles.row}>
          {row.map((cell, c) => {
            if (cell.type === -1) return <View key={c} style={styles.hole} />;
            const def = BLOCKS[cell.type] ?? BLOCKS[0];
            const isSel = selected?.row === r && selected?.col === c;
            return (
              <BlockTile
                key={`${r}-${c}-${cell.type}-${cell.special}`}
                block={cell}
                blockDef={def}
                selected={isSel}
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
    borderRadius: 8,
    overflow:     'hidden',
    padding:      2,
  },
  row: {
    flexDirection: 'row',
    gap:           TILE_GAP,
    marginBottom:  TILE_GAP,
  },
  hole: {
    width:  TILE_SIZE,
    height: TILE_SIZE,
  },
});
