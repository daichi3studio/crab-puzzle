/**
 * PuzzleGrid v6 — Pre-computed cascade + timing-based gravity
 *
 * Root-cause fix for cascade freeze (v5 issue):
 *  - v5: processMatches recursed N times → N React re-renders, N double-rAF waits,
 *        N spring gravity waits (underdamped, 400-600ms each) = 2-3s freeze on 3-combo
 *
 * v6 solution:
 *  1. PRECOMPUTE: Entire cascade chain computed synchronously in a while-loop
 *     before any animation starts. Grid/bmap reach final state in microseconds.
 *  2. ONE setState: All matched IDs removed + ALL new block IDs added in a
 *     single setLiveIds call → one React re-render total per swap.
 *  3. ONE rAF wait: Single double-frame wait for React to mount all new blocks.
 *  4. TIMING gravity: Easing.out(Easing.quad) at 190ms replaces spring.
 *     Deterministic, fast, no oscillation. 3-combo = ~1s (was 2-3s frozen).
 *  5. REF callbacks: onScoreAdd/onCombo accessed via refs → no stale closures,
 *     processMatches has empty deps → stable reference, no recreations.
 *
 * Per-cascade timing budget:
 *   55ms punch + 90ms fade + 190ms drop = 335ms/level
 *   3-combo ≈ 1.0s  |  5-combo ≈ 1.7s  (fully animated, responsive)
 */

import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { View, StyleSheet, PanResponder, Animated, Easing } from 'react-native';
import BlockTile from './BlockTile';
import {
  GRID_COLS, GRID_ROWS, TILE_SIZE, TILE_GAP,
  BLOCKS,
  ROBOT_RATE_EASY, ROBOT_RATE_HARD,
  PYRAMID_RATE_EASY, PYRAMID_RATE_HARD,
  SCORE_MATCH3, SCORE_MATCH4, SCORE_MATCH5, SCORE_EXTRA, SCORE_PYRAMID,
  CASCADE_MULT,
} from '../constants/gameConfig';

// ─── Layout ──────────────────────────────────────────────────────
const CELL   = TILE_SIZE + TILE_GAP;
const GRID_W = GRID_COLS * CELL - TILE_GAP;
const GRID_H = GRID_ROWS * CELL - TILE_GAP;

// ─── Animation timing (ms) ───────────────────────────────────────
const POP_PUNCH_MS    = 48;   // Block punches out to 1.45×
const POP_FADE_MS     = 80;   // Block collapses + fades to 0
const DROP_MS         = 170;  // Gravity fall (timing, not spring)
const SNAP_BACK_MS    = 130;  // Invalid swap / drag cancel snap-back
const INVALID_FWD_MS  = 85;   // Invalid swap snap forward
const INVALID_BACK_MS = 150;  // Invalid swap bounce back

// ─── Unique block IDs ────────────────────────────────────────────
let _uid = 1000;
const uid = () => ++_uid;

// ─── Pure helpers ────────────────────────────────────────────────
const rndType    = ()     => Math.floor(Math.random() * BLOCKS.length);
const rndSpecial = (hard) => {
  const v  = Math.random();
  const py = hard ? PYRAMID_RATE_HARD : PYRAMID_RATE_EASY;
  const ro = hard ? ROBOT_RATE_HARD   : ROBOT_RATE_EASY;
  if (v < py)      return 'pyramid';
  if (v < py + ro) return 'robot';
  return null;
};
const mkBlock = (hard) => ({ id: uid(), type: rndType(), special: rndSpecial(hard) });

// ─── Match detection ─────────────────────────────────────────────
// Robot wildcard rule: Robot extends a run of one TYPE, but cannot
// bridge two DIFFERENT types into one run.
//   [A, Robot, A]       → match of 3  ✓ (Robot acts as A)
//   [A, Robot, B]       → no match    ✓ (Robot would bridge A↔B)
//   [A,A,A, Robot, B,B,B] → two separate matches: [A,A,A] and [Robot,B,B,B] ✓
//   [A,A, Robot, A,A]   → match of 5  ✓

function typeOf(id, bmap) {
  if (!id) return undefined;
  const b = bmap.get(id);
  if (!b) return undefined;
  return b.special === 'robot' ? null : b.type; // null = wildcard
}

function findMatches(grid, bmap) {
  const hits = new Set();

  function scanLine(ids, keyFn) {
    let i = 0;
    while (i < ids.length) {
      if (!ids[i]) { i++; continue; }

      let dominant = -1; // established type for this run (-1 = unknown)
      let j = i;

      while (j < ids.length) {
        const t = typeOf(ids[j], bmap);
        if (t === undefined) break; // empty cell ends run

        if (t === null) {
          // Robot: look one step ahead to prevent cross-type bridging
          const nextT = j + 1 < ids.length ? typeOf(ids[j + 1], bmap) : undefined;
          if (nextT !== undefined && nextT !== null &&
              dominant !== -1 && nextT !== dominant) {
            break; // robot would bridge two different types — end run here
          }
          j++;
        } else if (dominant === -1) {
          dominant = t; j++;       // first typed block sets the run color
        } else if (t === dominant) {
          j++;                     // same color — continue run
        } else {
          break;                   // different color, no robot bridge — end run
        }
      }

      if (j - i >= 3 && dominant !== -1) {
        for (let k = i; k < j; k++) hits.add(keyFn(k));
      }
      i = j > i ? j : i + 1;
    }
  }

  for (let r = 0; r < GRID_ROWS; r++) {
    scanLine(grid[r], c => `${r},${c}`);
  }
  for (let c = 0; c < GRID_COLS; c++) {
    const col = Array.from({ length: GRID_ROWS }, (_, r) => grid[r][c]);
    scanLine(col, r => `${r},${c}`);
  }
  return hits;
}

function buildCleanGrid(hard) {
  let grid, bmap, tries = 0;
  do {
    bmap = new Map();
    grid = Array.from({ length: GRID_ROWS }, () => Array(GRID_COLS).fill(null));
    for (let r = 0; r < GRID_ROWS; r++)
      for (let c = 0; c < GRID_COLS; c++) {
        const b = mkBlock(hard);
        bmap.set(b.id, b);
        grid[r][c] = b.id;
      }
    tries++;
  } while (findMatches(grid, bmap).size > 0 && tries < 100);
  return { grid, bmap };
}

function scoreFor(n, cascade) {
  const base = n <= 3 ? SCORE_MATCH3
             : n === 4 ? SCORE_MATCH4
             : n === 5 ? SCORE_MATCH5
             : SCORE_MATCH5 + (n - 5) * SCORE_EXTRA;
  return Math.floor(base * Math.pow(CASCADE_MULT, cascade));
}

// ─── Block component (stable key = UUID) ─────────────────────────
// No per-block breathe loop — eliminates 56 concurrent JS-thread animations.
// A single shared breathe is driven from the parent (see useEffect in PuzzleGrid).
const BlockAnim = React.memo(
  ({ id, blockData, ax, ay, ascale, aopacity, isDragging }) => {
    const def = BLOCKS[blockData.type] ?? BLOCKS[0];

    return (
      <Animated.View style={{
        position: 'absolute',
        width:    TILE_SIZE,
        height:   TILE_SIZE,
        zIndex:   isDragging ? 20 : 1,
        transform: [
          { translateX: ax },
          { translateY: ay },
          { scale: ascale },
        ],
        opacity: aopacity,
      }}>
        <BlockTile block={blockData} blockDef={def} selected={isDragging} />
      </Animated.View>
    );
  },
  (prev, next) =>
    prev.isDragging === next.isDragging &&
    prev.blockData  === next.blockData,
);

// ─── Main component ───────────────────────────────────────────────
export default function PuzzleGrid({ hard, onScoreAdd, onCombo, paused }) {
  const hardRef = useRef(hard);
  hardRef.current = hard;

  // Keep latest callbacks in refs → processMatches has [] deps (stable ref)
  const onScoreAddRef = useRef(onScoreAdd);
  const onComboRef    = useRef(onCombo);
  onScoreAddRef.current = onScoreAdd;
  onComboRef.current    = onCombo;

  // Mutable game state (refs prevent re-renders mid-animation)
  const gridRef  = useRef(null);   // grid[r][c] = blockId | null
  const bmapRef  = useRef(null);   // Map<id, {type, special}>
  const animsRef = useRef(new Map()); // Map<id, {x, y, scale, opacity}>
  const locked      = useRef(false);
  const drag        = useRef(null);    // {r, c, id, dir, nid, nr, nc}
  const pendingSwap = useRef(null);    // {id1, id2} — queued during cascade

  // Single piece of React state — only drives mount/unmount of block nodes
  const [liveIds, setLiveIds] = useState(() => {
    const { grid, bmap } = buildCleanGrid(hard);
    gridRef.current = grid;
    bmapRef.current = bmap;
    return new Set(bmap.keys());
  });

  // ─── Animated.Value accessor ─────────────────────────────────
  function getAnim(id, initX, initY) {
    if (!animsRef.current.has(id)) {
      animsRef.current.set(id, {
        x:       new Animated.Value(initX ?? 0),
        y:       new Animated.Value(initY ?? 0),
        scale:   new Animated.Value(1),
        opacity: new Animated.Value(1),
      });
    }
    return animsRef.current.get(id);
  }

  // Initialise anims for all existing blocks (called on every render — cheap)
  function initAnims() {
    const grid = gridRef.current;
    for (let r = 0; r < GRID_ROWS; r++)
      for (let c = 0; c < GRID_COLS; c++)
        if (grid[r][c]) getAnim(grid[r][c], c * CELL, r * CELL);
  }

  // ─── Animation helpers ───────────────────────────────────────

  // Snappy spring — for direct user-interaction swaps (feels responsive)
  const snapSpring = (id, r, c, friction = 10, tension = 240) =>
    Animated.parallel([
      Animated.spring(getAnim(id).x, { toValue: c * CELL, friction, tension, useNativeDriver: true }),
      Animated.spring(getAnim(id).y, { toValue: r * CELL, friction, tension, useNativeDriver: true }),
    ]);

  // Easing timing — for gravity drops (deterministic, no oscillation)
  const dropTiming = (id, r, c) =>
    Animated.parallel([
      Animated.timing(getAnim(id).x, {
        toValue:  c * CELL,
        duration: DROP_MS,
        easing:   Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(getAnim(id).y, {
        toValue:  r * CELL,
        duration: DROP_MS,
        easing:   Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]);

  // ─── Gravity: pure data mutation (no animation) ───────────────
  function applyGravity(matchedIds) {
    const grid = gridRef.current;
    const bmap = bmapRef.current;
    const drops  = [];
    const newIds = [];

    for (let c = 0; c < GRID_COLS; c++) {
      // Keep surviving blocks (top→bottom order)
      const surviving = [];
      for (let r = 0; r < GRID_ROWS; r++)
        if (grid[r][c] && !matchedIds.has(grid[r][c]))
          surviving.push(grid[r][c]);

      const needed = GRID_ROWS - surviving.length;
      const fresh  = Array.from({ length: needed }, () => {
        const b = mkBlock(hardRef.current);
        bmap.set(b.id, b);
        newIds.push(b.id);
        return b.id;
      });

      // fresh blocks on top, survivors fall below
      const full = [...fresh, ...surviving];
      for (let r = 0; r < GRID_ROWS; r++) {
        const prevId = grid[r][c];
        grid[r][c] = full[r];
        // Only animate blocks that actually moved or are new
        if (full[r] !== prevId) {
          drops.push({ id: full[r], toR: r, toC: c, isNew: r < needed });
        }
      }
    }
    return { drops, newIds };
  }

  // ─── Core cascade processor (v6.1)
  //
  // v6 had a critical bug: matched blocks were removed from liveIds BEFORE
  // the pop animation → blocks were unmounted → pop was invisible.
  //
  // v6.1 fix:
  //  Phase 1: Pre-compute chain + PRE-INIT new block positions (no flash)
  //  Phase 2: ONE setLiveIds to ADD new blocks (matched blocks stay in DOM)
  //  Phase 3: Animate — pop (blocks in DOM ✓) → remove matched → drop
  //  Phase 4: Final cleanup + execute any pending swap queued during cascade
  const processMatches = useCallback(async (initialMatches) => {
    const grid = gridRef.current;
    const bmap = bmapRef.current;

    // ── Phase 1: Pre-compute entire cascade chain synchronously ──────────
    const steps = [];
    let curMatches = initialMatches;
    let cascade    = 0;

    while (curMatches.size > 0 && cascade < 10) {
      const matchedIds = new Set();
      let pts = 0;

      curMatches.forEach(key => {
        const [r, c] = key.split(',').map(Number);
        const id = grid[r][c];
        matchedIds.add(id);
        if (bmap.get(id)?.special === 'pyramid') pts += SCORE_PYRAMID;
      });
      pts += scoreFor(curMatches.size, cascade);

      const { drops, newIds } = applyGravity(matchedIds);

      // Pre-init new block Animated.Values ABOVE the grid before they mount.
      // This prevents the 1-frame flash at their final positions.
      drops.forEach(({ id, toC, isNew }) => {
        if (isNew) {
          const a = getAnim(id, toC * CELL, -CELL * 2);
          a.x.setValue(toC * CELL);
          a.y.setValue(-CELL * 2);
          a.scale.setValue(1);
          a.opacity.setValue(1);
        }
      });

      steps.push({ matchedIds, drops, newIds, pts, cascade });
      curMatches = findMatches(grid, bmap);
      cascade++;
    }

    if (steps.length === 0) { locked.current = false; return; }

    const allMatchedIds = new Set(steps.flatMap(s => [...s.matchedIds]));
    const allNewIds     = steps.flatMap(s => s.newIds);

    // ── Phase 2: Add ALL new blocks (do NOT remove matched yet) ──────────
    // Matched blocks stay in liveIds so they're in the DOM for pop animation.
    if (allNewIds.length > 0) {
      setLiveIds(prev => {
        const next = new Set(prev);
        allNewIds.forEach(id => next.add(id));
        return next;
      });
      // Wait for new blocks to mount (already pre-positioned above grid)
      await new Promise(res => requestAnimationFrame(() => requestAnimationFrame(res)));
    }

    // ── Phase 3: Animate each cascade level ──────────────────────────────
    for (const { matchedIds, drops, pts, cascade } of steps) {
      onScoreAddRef.current(pts);
      if (cascade > 0) onComboRef.current(cascade);

      // Pop: punch up then collapse. Flatten to 2 parallel batches (no nested sequence per block).
      const matchArr = [...matchedIds];

      // Punch up (all at once)
      await new Promise(res =>
        Animated.parallel(matchArr.map(id =>
          Animated.timing(getAnim(id).scale, {
            toValue: 1.45, duration: POP_PUNCH_MS, useNativeDriver: true,
          })
        )).start(res)
      );

      // Collapse + fade (all at once — flat array, no nested parallel per block)
      const collapseAnims = [];
      for (const id of matchArr) {
        const a = getAnim(id);
        collapseAnims.push(
          Animated.timing(a.scale,   { toValue: 0, duration: POP_FADE_MS, useNativeDriver: true }),
          Animated.timing(a.opacity, { toValue: 0, duration: POP_FADE_MS, useNativeDriver: true }),
        );
      }
      await new Promise(res => Animated.parallel(collapseAnims).start(res));

      // Drop only blocks that actually moved (filtered in applyGravity)
      if (drops.length > 0) {
        await new Promise(res =>
          Animated.parallel(drops.map(({ id, toR, toC }) => dropTiming(id, toR, toC)))
            .start(res)
        );
      }
    }

    // ── Phase 4: ONE setLiveIds to remove ALL matched blocks after animation ──
    // All animations complete → single React re-render to clean up invisible blocks.
    // This is zero re-renders during animation (was N re-renders in previous version).
    setLiveIds(prev => {
      const next = new Set(prev);
      allMatchedIds.forEach(id => next.delete(id));
      return next;
    });

    // ── Phase 5: Cleanup + execute any swap queued during cascade ─────────
    allMatchedIds.forEach(id => animsRef.current.delete(id));

    const pending = pendingSwap.current;
    pendingSwap.current = null;
    locked.current = false;

    if (pending) {
      // Find current positions of queued blocks (they may have moved due to gravity)
      let r1 = -1, c1 = -1, r2 = -1, c2 = -1;
      for (let r = 0; r < GRID_ROWS; r++)
        for (let c = 0; c < GRID_COLS; c++) {
          if (grid[r][c] === pending.id1) { r1 = r; c1 = c; }
          if (grid[r][c] === pending.id2) { r2 = r; c2 = c; }
        }
      // Only execute if both blocks still exist AND are still adjacent
      if (r1 >= 0 && r2 >= 0 && Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1) {
        locked.current = true;
        doSwap(r1, c1, r2, c2);
      }
    }
  }, []); // Empty deps — all mutable state accessed via refs

  // ─── Swap handler ────────────────────────────────────────────
  const doSwap = useCallback(async (r1, c1, r2, c2) => {
    const grid = gridRef.current;
    const bmap = bmapRef.current;
    const id1  = grid[r1][c1];
    const id2  = grid[r2][c2];

    // Swap data first
    grid[r1][c1] = id2;
    grid[r2][c2] = id1;
    const matches = findMatches(grid, bmap);

    if (matches.size > 0) {
      // Valid: snap blocks to swapped positions (spring for tactile feel)
      await new Promise(res =>
        Animated.parallel([
          snapSpring(id1, r2, c2, 10, 240),
          snapSpring(id2, r1, c1, 10, 240),
        ]).start(res)
      );
      processMatches(matches); // fire-and-forget; locked until cascade ends

    } else {
      // Invalid: snap forward briefly then bounce back
      grid[r1][c1] = id1;
      grid[r2][c2] = id2;

      // Snap toward target (gives feedback)
      await new Promise(res =>
        Animated.parallel([
          Animated.timing(getAnim(id1).x, { toValue: c2 * CELL, duration: INVALID_FWD_MS, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(getAnim(id1).y, { toValue: r2 * CELL, duration: INVALID_FWD_MS, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(getAnim(id2).x, { toValue: c1 * CELL, duration: INVALID_FWD_MS, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(getAnim(id2).y, { toValue: r1 * CELL, duration: INVALID_FWD_MS, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        ]).start(res)
      );
      // Bounce back with spring (satisfying elastic rebound)
      await new Promise(res =>
        Animated.parallel([
          snapSpring(id1, r1, c1, 7, 160),
          snapSpring(id2, r2, c2, 7, 160),
        ]).start(res)
      );
      locked.current = false;
    }
  }, [processMatches]);

  // ─── PanResponder ─────────────────────────────────────────────
  const panResponder = useMemo(() => PanResponder.create({
    // Allow touch even during cascade — gesture is tracked and queued
    onStartShouldSetPanResponder: () => !paused,
    onMoveShouldSetPanResponder:  (_, gs) =>
      !paused && (Math.abs(gs.dx) > 2 || Math.abs(gs.dy) > 2),

    onPanResponderGrant: (evt) => {
      const { locationX, locationY } = evt.nativeEvent;
      const c = Math.floor(locationX / CELL);
      const r = Math.floor(locationY / CELL);
      if (r >= 0 && r < GRID_ROWS && c >= 0 && c < GRID_COLS) {
        const id = gridRef.current[r][c];
        if (id) drag.current = { r, c, id, dir: null, nid: null, nr: null, nc: null };
      }
    },

    onPanResponderMove: (_, gs) => {
      if (!drag.current || paused) return;
      const { dx, dy } = gs;

      // Track direction regardless of lock state
      if (!drag.current.dir) {
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3)
          drag.current.dir = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v';
        else return;
      }

      // During cascade: only track direction, don't move blocks visually
      // (prevents fighting cascade drop animations)
      if (locked.current) return;

      const { r, c, id } = drag.current;
      const max = CELL;
      let cdx = 0, cdy = 0, nr = r, nc = c;

      if (drag.current.dir === 'h') {
        cdx = Math.max(-max, Math.min(max, dx));
        nc  = c + (cdx > 0 ? 1 : -1);
      } else {
        cdy = Math.max(-max, Math.min(max, dy));
        nr  = r + (cdy > 0 ? 1 : -1);
      }

      const a = getAnim(id);
      a.x.setValue(c * CELL + cdx);
      a.y.setValue(r * CELL + cdy);

      if (nr >= 0 && nr < GRID_ROWS && nc >= 0 && nc < GRID_COLS) {
        const nid = gridRef.current[nr][nc];
        if (nid) {
          if (nid !== drag.current.nid) {
            drag.current.nid = nid;
            drag.current.nr  = nr;
            drag.current.nc  = nc;
          }
          getAnim(nid).x.setValue(nc * CELL - cdx);
          getAnim(nid).y.setValue(nr * CELL - cdy);
        }
      }
    },

    onPanResponderRelease: (_, gs) => {
      if (!drag.current) return;
      const { r, c, id, dir, nid, nr: nRow, nc: nCol } = drag.current;
      const { dx, dy } = gs;
      drag.current = null;

      const threshold = CELL * 0.20;
      let dr = 0, dc = 0;
      if (dir === 'h' && Math.abs(dx) > threshold) dc = dx > 0 ? 1 : -1;
      if (dir === 'v' && Math.abs(dy) > threshold) dr = dy > 0 ? 1 : -1;

      const tr = r + dr, tc = c + dc;
      const isValidTarget =
        (dr || dc) && tr >= 0 && tr < GRID_ROWS && tc >= 0 && tc < GRID_COLS;

      if (locked.current) {
        // ── Cascade running: queue the swap ─────────────────────────────
        if (isValidTarget) {
          const id2 = gridRef.current[tr][tc];
          if (id2 && id2 !== id) {
            pendingSwap.current = { id1: id, id2 };
            // Scale pulse on the source block = visual confirmation of queue
            Animated.sequence([
              Animated.timing(getAnim(id).scale, { toValue: 1.18, duration: 70, useNativeDriver: true }),
              Animated.timing(getAnim(id).scale, { toValue: 1.00, duration: 70, useNativeDriver: true }),
            ]).start();
          }
        }
        // Block didn't visually move (we skipped setValue), nothing to snap
        return;
      }

      // ── Normal: execute immediately ──────────────────────────────────
      if (isValidTarget) {
        locked.current = true;
        doSwap(r, c, tr, tc);
      } else {
        const snaps = [snapSpring(id, r, c, 8, 200)];
        if (nid && nRow != null) snaps.push(snapSpring(nid, nRow, nCol, 8, 200));
        Animated.parallel(snaps).start();
      }
    },

    onPanResponderTerminate: () => {
      if (!drag.current) return;
      const { r, c, id, nid, nr: nRow, nc: nCol } = drag.current;
      drag.current = null;
      if (locked.current) return; // block didn't move visually, nothing to restore
      const snaps = [snapSpring(id, r, c, 6, 160)];
      if (nid && nRow != null) snaps.push(snapSpring(nid, nRow, nCol, 6, 160));
      Animated.parallel(snaps).start();
    },
  }), [paused, doSwap]);

  // Run on every render (cheap — only creates Values for blocks not yet tracked)
  initAnims();

  // Map id → {r, c} for rendering; recomputes only when liveIds changes
  const posMap = useMemo(() => {
    const m    = new Map();
    const grid = gridRef.current;
    if (!grid) return m;
    for (let r = 0; r < GRID_ROWS; r++)
      for (let c = 0; c < GRID_COLS; c++)
        if (grid[r][c]) m.set(grid[r][c], { r, c });
    return m;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveIds]);

  const bmap = bmapRef.current;

  return (
    <View
      style={[styles.outer, { width: GRID_W + 8, height: GRID_H + 8 }]}
      {...panResponder.panHandlers}
    >
      <View style={[styles.inner, { width: GRID_W, height: GRID_H }]}>
        {Array.from(liveIds).map(id => {
          const blockData = bmap.get(id);
          if (!blockData) return null;
          const pos = posMap.get(id);
          const a   = getAnim(id, pos ? pos.c * CELL : 0, pos ? pos.r * CELL : 0);
          return (
            <BlockAnim
              key={id}
              id={id}
              blockData={blockData}
              ax={a.x}
              ay={a.y}
              ascale={a.scale}
              aopacity={a.opacity}
              isDragging={drag.current?.id === id}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    borderRadius:    12,
    backgroundColor: 'rgba(10,20,35,0.6)',
    padding:         4,
    overflow:        'hidden', // clips new blocks initialized above grid
  },
  inner: { position: 'relative' },
});
