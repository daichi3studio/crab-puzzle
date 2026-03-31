/**
 * PuzzleGrid v4 — Drag-to-move feel
 *
 * The block follows your finger during swipe.
 * When released: snaps into swap position (valid) or bounces back (invalid).
 * Match → pop + shrink animation
 * Gravity → blocks drop with spring bounce
 */
import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { View, StyleSheet, PanResponder, Animated } from 'react-native';
import BlockTile from './BlockTile';
import {
  GRID_COLS, GRID_ROWS, TILE_SIZE, TILE_GAP, SWIPE_THRESHOLD,
  BLOCKS, ROBOT_RATE_EASY, ROBOT_RATE_HARD, PYRAMID_RATE_EASY, PYRAMID_RATE_HARD,
  SCORE_MATCH3, SCORE_MATCH4, SCORE_MATCH5, SCORE_EXTRA, SCORE_PYRAMID,
  CASCADE_MULT,
} from '../constants/gameConfig';

const CELL = TILE_SIZE + TILE_GAP;

// ─── Data helpers ───────────────────────────────────────────────

function randomType() { return Math.floor(Math.random() * BLOCKS.length); }
function randomSpecial(hard) {
  const r = Math.random();
  const py = hard ? PYRAMID_RATE_HARD : PYRAMID_RATE_EASY;
  const ro = hard ? ROBOT_RATE_HARD   : ROBOT_RATE_EASY;
  if (r < py) return 'pyramid';
  if (r < py + ro) return 'robot';
  return null;
}
function makeCell(hard) { return { type: randomType(), special: randomSpecial(hard) }; }
function deepCopy(g) { return g.map(row => row.map(c => ({ ...c }))); }
function cellsMatch(a, b) {
  if (!a || !b || a.type === -1 || b.type === -1) return false;
  if (a.special === 'robot' || b.special === 'robot') return true;
  return a.type === b.type;
}
function findMatches(grid) {
  const hits = new Set();
  for (let r = 0; r < GRID_ROWS; r++) {
    let s = 0;
    for (let c = 1; c <= GRID_COLS; c++) {
      if (c < GRID_COLS && cellsMatch(grid[r][c], grid[r][c - 1])) continue;
      if (c - s >= 3) for (let k = s; k < c; k++) hits.add(`${r},${k}`);
      s = c;
    }
  }
  for (let c = 0; c < GRID_COLS; c++) {
    let s = 0;
    for (let r = 1; r <= GRID_ROWS; r++) {
      if (r < GRID_ROWS && cellsMatch(grid[r][c], grid[r - 1][c])) continue;
      if (r - s >= 3) for (let k = s; k < r; k++) hits.add(`${k},${c}`);
      s = r;
    }
  }
  return hits;
}
function makeCleanGrid(hard) {
  let grid, n = 0;
  do {
    grid = Array.from({ length: GRID_ROWS }, () =>
      Array.from({ length: GRID_COLS }, () => makeCell(hard)));
    n++;
  } while (findMatches(grid).size > 0 && n < 100);
  return grid;
}
function calcScore(count, cascade) {
  let base = count <= 3 ? SCORE_MATCH3 : count <= 4 ? SCORE_MATCH4
           : count <= 5 ? SCORE_MATCH5 : SCORE_MATCH5 + (count - 5) * SCORE_EXTRA;
  return Math.floor(base * Math.pow(CASCADE_MULT, cascade));
}

// ─── Component ──────────────────────────────────────────────────

export default function PuzzleGrid({ hard, onScoreAdd, onCombo, paused }) {
  const [grid, setGrid]         = useState(() => makeCleanGrid(hard));
  const [locked, setLocked]     = useState(false);
  const [renderKey, setRenderKey] = useState(0);

  const hardRef   = useRef(hard);
  hardRef.current = hard;

  // Per-cell animated offsets (relative to grid position)
  const offsetsRef = useRef({});
  function getOffset(r, c) {
    const key = `${r},${c}`;
    if (!offsetsRef.current[key]) {
      offsetsRef.current[key] = {
        dx:      new Animated.Value(0),
        dy:      new Animated.Value(0),
        scale:   new Animated.Value(1),
        opacity: new Animated.Value(1),
      };
    }
    return offsetsRef.current[key];
  }

  function resetAllOffsets() {
    Object.values(offsetsRef.current).forEach(o => {
      o.dx.setValue(0);
      o.dy.setValue(0);
      o.scale.setValue(1);
      o.opacity.setValue(1);
    });
  }

  // ─── Dragging state ──────────────────────────────────────────
  const dragCell  = useRef(null);   // { row, col }
  const dragDir   = useRef(null);   // 'h' | 'v' | null (direction locked)
  const neighborCell = useRef(null); // the cell being pushed

  // ─── Animate match pop ───────────────────────────────────────
  function animatePop(matches) {
    const anims = [];
    matches.forEach(key => {
      const [r, c] = key.split(',').map(Number);
      const o = getOffset(r, c);
      anims.push(Animated.parallel([
        Animated.timing(o.scale,   { toValue: 1.3, duration: 80, useNativeDriver: true }),
        Animated.timing(o.opacity, { toValue: 0,   duration: 150, useNativeDriver: true }),
      ]));
    });
    return new Promise(res => Animated.stagger(15, anims).start(res));
  }

  // ─── Animate gravity ────────────────────────────────────────
  function animateDrops(clearedGrid, newGrid) {
    const anims = [];
    for (let c = 0; c < GRID_COLS; c++) {
      // How many cells were cleared in this column?
      let emptyCount = 0;
      for (let r = GRID_ROWS - 1; r >= 0; r--) {
        if (clearedGrid[r][c].type === -1) emptyCount++;
      }
      if (emptyCount === 0) continue;

      // Animate each cell in this column
      for (let r = 0; r < GRID_ROWS; r++) {
        if (newGrid[r][c].type === -1) continue;
        const o = getOffset(r, c);
        // Cells that are "new" or moved start from above
        const wasEmpty = r < emptyCount; // new cells fill from top
        if (wasEmpty) {
          o.dy.setValue(-(emptyCount - r) * CELL - CELL);
        }
        o.scale.setValue(1);
        o.opacity.setValue(1);
        anims.push(
          Animated.spring(o.dy, {
            toValue:  0,
            friction: 5,
            tension:  90,
            useNativeDriver: true,
          })
        );
      }
    }
    if (anims.length === 0) return Promise.resolve();
    return new Promise(res => Animated.stagger(10, anims).start(res));
  }

  // ─── Process chain ──────────────────────────────────────────
  const processMatches = useCallback(async (currentGrid, matches, cascade) => {
    if (matches.size === 0) { setLocked(false); return; }

    let pts = calcScore(matches.size, cascade);
    let bonus = 0;
    matches.forEach(key => {
      const [r, c] = key.split(',').map(Number);
      if (currentGrid[r][c].special === 'pyramid') bonus += SCORE_PYRAMID;
    });
    onScoreAdd(pts + bonus);
    if (cascade > 0) onCombo(cascade);

    // Pop animation
    await animatePop(matches);

    // Clear cells
    const cleared = deepCopy(currentGrid);
    matches.forEach(key => {
      const [r, c] = key.split(',').map(Number);
      cleared[r][c] = { type: -1, special: null };
    });

    // Gravity
    const filled = deepCopy(cleared);
    for (let c = 0; c < GRID_COLS; c++) {
      const col = [];
      for (let r = 0; r < GRID_ROWS; r++) {
        if (filled[r][c].type !== -1) col.push({ ...filled[r][c] });
      }
      for (let r = GRID_ROWS - 1; r >= 0; r--) {
        filled[r][c] = col.length > 0 ? col.pop() : makeCell(hardRef.current);
      }
    }

    // Reset offsets, update grid, animate drops
    resetAllOffsets();
    setGrid(filled);
    setRenderKey(k => k + 1);
    await new Promise(r => setTimeout(r, 20));
    await animateDrops(cleared, filled);

    // Cascade check
    const next = findMatches(filled);
    if (next.size > 0) {
      await new Promise(r => setTimeout(r, 80));
      processMatches(filled, next, cascade + 1);
    } else {
      setLocked(false);
    }
  }, [onScoreAdd, onCombo]);

  // ─── Swap after drag release ─────────────────────────────────
  const doSwap = useCallback(async (fromR, fromC, toR, toC) => {
    const next = deepCopy(grid);
    const tmp = next[fromR][fromC];
    next[fromR][fromC] = next[toR][toC];
    next[toR][toC] = tmp;

    const matches = findMatches(next);
    if (matches.size > 0) {
      // Valid swap: snap both blocks to final positions
      const oFrom = getOffset(fromR, fromC);
      const oTo   = getOffset(toR, toC);

      await new Promise(res => {
        Animated.parallel([
          Animated.spring(oFrom.dx, { toValue: (toC - fromC) * CELL, friction: 6, tension: 140, useNativeDriver: true }),
          Animated.spring(oFrom.dy, { toValue: (toR - fromR) * CELL, friction: 6, tension: 140, useNativeDriver: true }),
          Animated.spring(oTo.dx,   { toValue: (fromC - toC) * CELL, friction: 6, tension: 140, useNativeDriver: true }),
          Animated.spring(oTo.dy,   { toValue: (fromR - toR) * CELL, friction: 6, tension: 140, useNativeDriver: true }),
        ]).start(res);
      });

      resetAllOffsets();
      setGrid(next);
      setRenderKey(k => k + 1);
      await new Promise(r => setTimeout(r, 30));
      processMatches(next, matches, 0);
    } else {
      // Invalid — bounce back
      const oFrom = getOffset(fromR, fromC);
      const oTo   = getOffset(toR, toC);
      await new Promise(res => {
        Animated.parallel([
          Animated.spring(oFrom.dx, { toValue: 0, friction: 5, tension: 120, useNativeDriver: true }),
          Animated.spring(oFrom.dy, { toValue: 0, friction: 5, tension: 120, useNativeDriver: true }),
          Animated.spring(oTo.dx,   { toValue: 0, friction: 5, tension: 120, useNativeDriver: true }),
          Animated.spring(oTo.dy,   { toValue: 0, friction: 5, tension: 120, useNativeDriver: true }),
        ]).start(res);
      });
      resetAllOffsets();
      setLocked(false);
    }
  }, [grid, processMatches]);

  // ─── PanResponder — drag block with finger ───────────────────
  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => !locked && !paused,
    onMoveShouldSetPanResponder: (_, gs) => {
      return !locked && !paused && (Math.abs(gs.dx) > 3 || Math.abs(gs.dy) > 3);
    },
    onPanResponderGrant: (evt) => {
      const { locationX, locationY } = evt.nativeEvent;
      const col = Math.floor(locationX / CELL);
      const row = Math.floor(locationY / CELL);
      if (row >= 0 && row < GRID_ROWS && col >= 0 && col < GRID_COLS) {
        dragCell.current = { row, col };
        dragDir.current  = null;
        neighborCell.current = null;
      }
    },
    onPanResponderMove: (_, gs) => {
      if (!dragCell.current || locked || paused) return;
      const { row, col } = dragCell.current;
      const { dx, dy } = gs;

      // Lock direction on first significant move
      if (!dragDir.current) {
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
          dragDir.current = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v';
        } else return;
      }

      // Clamp movement to one cell distance
      const maxD = CELL;
      let clampDx = 0, clampDy = 0;
      let nR = row, nC = col;

      if (dragDir.current === 'h') {
        clampDx = Math.max(-maxD, Math.min(maxD, dx));
        nC = col + (clampDx > 0 ? 1 : -1);
      } else {
        clampDy = Math.max(-maxD, Math.min(maxD, dy));
        nR = row + (clampDy > 0 ? 1 : -1);
      }

      if (nR < 0 || nR >= GRID_ROWS || nC < 0 || nC >= GRID_COLS) return;

      neighborCell.current = { row: nR, col: nC };

      // Move dragged block
      const oDrag = getOffset(row, col);
      oDrag.dx.setValue(clampDx);
      oDrag.dy.setValue(clampDy);

      // Push neighbor in opposite direction (proportional)
      const oNeighbor = getOffset(nR, nC);
      oNeighbor.dx.setValue(-clampDx);
      oNeighbor.dy.setValue(-clampDy);
    },
    onPanResponderRelease: (_, gs) => {
      if (!dragCell.current) return;
      const { row, col } = dragCell.current;
      const { dx, dy } = gs;

      const threshold = CELL * 0.35; // need to drag at least 35% of cell size
      let dr = 0, dc = 0;

      if (dragDir.current === 'h' && Math.abs(dx) > threshold) {
        dc = dx > 0 ? 1 : -1;
      } else if (dragDir.current === 'v' && Math.abs(dy) > threshold) {
        dr = dy > 0 ? 1 : -1;
      }

      const toR = row + dr;
      const toC = col + dc;

      dragCell.current     = null;
      dragDir.current      = null;
      neighborCell.current = null;

      if ((dr !== 0 || dc !== 0) && toR >= 0 && toR < GRID_ROWS && toC >= 0 && toC < GRID_COLS) {
        setLocked(true);
        doSwap(row, col, toR, toC);
      } else {
        // Snap back
        const oDrag = getOffset(row, col);
        Animated.spring(oDrag.dx, { toValue: 0, friction: 5, useNativeDriver: true }).start();
        Animated.spring(oDrag.dy, { toValue: 0, friction: 5, useNativeDriver: true }).start();

        if (neighborCell.current) {
          const oN = getOffset(neighborCell.current.row, neighborCell.current.col);
          Animated.spring(oN.dx, { toValue: 0, friction: 5, useNativeDriver: true }).start();
          Animated.spring(oN.dy, { toValue: 0, friction: 5, useNativeDriver: true }).start();
        }
      }
    },
    onPanResponderTerminate: () => {
      dragCell.current = null;
      dragDir.current  = null;
      neighborCell.current = null;
      resetAllOffsets();
    },
  }), [locked, paused, doSwap]);

  // ─── Render ───────────────────────────────────────────────────
  const gridW = GRID_COLS * CELL - TILE_GAP;
  const gridH = GRID_ROWS * CELL - TILE_GAP;

  return (
    <View
      style={[styles.gridOuter, { width: gridW + 8, height: gridH + 8 }]}
      {...panResponder.panHandlers}
    >
      <View style={[styles.gridInner, { width: gridW, height: gridH }]}>
        {grid.map((row, r) =>
          row.map((cell, c) => {
            if (cell.type === -1) return null;
            const o   = getOffset(r, c);
            const def = BLOCKS[cell.type] ?? BLOCKS[0];
            const isDragging = dragCell.current?.row === r && dragCell.current?.col === c;
            return (
              <Animated.View
                key={`${renderKey}-${r}-${c}`}
                style={{
                  position: 'absolute',
                  left:     c * CELL,
                  top:      r * CELL,
                  zIndex:   isDragging ? 20 : 1,
                  transform: [
                    { translateX: o.dx },
                    { translateY: o.dy },
                    { scale: o.scale },
                  ],
                  opacity: o.opacity,
                }}
              >
                <BlockTile block={cell} blockDef={def} selected={isDragging} />
              </Animated.View>
            );
          })
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  gridOuter: {
    borderRadius:    12,
    backgroundColor: 'rgba(10,20,35,0.6)',
    padding:         4,
    overflow:        'hidden',
  },
  gridInner: {
    position: 'relative',
  },
});
