/**
 * PuzzleGrid v7 — Candy Crush-style specials
 *
 * Changes from v6:
 *  - 4-match → Robot spawns at center (clears row or column on tap)
 *  - 5+-match → Pyramid spawns at center (clears cross on tap)
 *  - Special blocks don't participate in regular matching
 *  - Tap to activate (no swipe needed)
 *  - No random special spawning
 *
 * Animation pipeline (unchanged from v6):
 *  1. PRECOMPUTE entire cascade chain synchronously
 *  2. ONE setLiveIds to mount new blocks
 *  3. Animate: pop → special-appear → drop (per cascade level)
 *  4. ONE setLiveIds to unmount cleared blocks
 *  5. Cleanup + execute pending swap
 */

import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { View, StyleSheet, PanResponder, Animated, Easing } from 'react-native';
import BlockTile from './BlockTile';
import {
  GRID_COLS, GRID_ROWS, TILE_SIZE, TILE_GAP,
  BLOCKS,
  SCORE_MATCH3, SCORE_MATCH4, SCORE_MATCH5, SCORE_EXTRA, SCORE_PYRAMID,
  CASCADE_MULT,
} from '../constants/gameConfig';

// ─── Layout ──────────────────────────────────────────────────────
const CELL   = TILE_SIZE + TILE_GAP;
const GRID_W = GRID_COLS * CELL - TILE_GAP;
const GRID_H = GRID_ROWS * CELL - TILE_GAP;

// ─── Animation timing (ms) ───────────────────────────────────────
const POP_PUNCH_MS    = 48;
const POP_FADE_MS     = 80;
const DROP_MS         = 170;
const INVALID_FWD_MS  = 85;
const SPECIAL_APPEAR_MS = 180;

// ─── Unique block IDs ────────────────────────────────────────────
let _uid = 1000;
const uid = () => ++_uid;

// ─── Pure helpers ────────────────────────────────────────────────
const rndType    = () => Math.floor(Math.random() * BLOCKS.length);
const mkBlock    = () => ({ id: uid(), type: rndType(), special: null,      dir: null });
const mkObstacle = () => ({ id: uid(), type: 0,         special: 'obstacle', dir: null });

// ─── Match detection ─────────────────────────────────────────────
// Special blocks (robot/pyramid) don't participate in matching.
// They sit on the grid until the player taps them.

function blockType(id, bmap) {
  if (!id) return undefined;
  const b = bmap.get(id);
  if (!b || b.special) return undefined;
  return b.type;
}

function findMatchGroups(grid, bmap) {
  const groups = [];

  function scanLine(ids, toRC, direction) {
    let i = 0;
    while (i < ids.length) {
      const t = blockType(ids[i], bmap);
      if (t === undefined) { i++; continue; }
      let j = i + 1;
      while (j < ids.length && blockType(ids[j], bmap) === t) j++;
      if (j - i >= 3) {
        const cells = [];
        for (let k = i; k < j; k++) cells.push(toRC(k));
        groups.push({ cells, direction });
      }
      i = j;
    }
  }

  for (let r = 0; r < GRID_ROWS; r++)
    scanLine(grid[r], c => ({ r, c }), 'h');
  for (let c = 0; c < GRID_COLS; c++) {
    const col = Array.from({ length: GRID_ROWS }, (_, r) => grid[r][c]);
    scanLine(col, r => ({ r, c }), 'v');
  }
  return groups;
}

function buildCleanGrid() {
  let grid, bmap, tries = 0;
  do {
    bmap = new Map();
    grid = Array.from({ length: GRID_ROWS }, () => Array(GRID_COLS).fill(null));
    for (let r = 0; r < GRID_ROWS; r++)
      for (let c = 0; c < GRID_COLS; c++) {
        const b = mkBlock();
        bmap.set(b.id, b);
        grid[r][c] = b.id;
      }
    tries++;
  } while (findMatchGroups(grid, bmap).length > 0 && tries < 100);
  return { grid, bmap };
}

function scoreFor(n, cascade) {
  const base = n <= 3 ? SCORE_MATCH3
             : n === 4 ? SCORE_MATCH4
             : n === 5 ? SCORE_MATCH5
             : SCORE_MATCH5 + (n - 5) * SCORE_EXTRA;
  return Math.floor(base * Math.pow(CASCADE_MULT, cascade));
}

// Determine which specials to create from match groups
// - L/T shape (two groups intersecting) → Pyramid at intersection
// - Straight 5+ → Pyramid at center
// - Straight 4  → Robot at center
function planSpecials(groups) {
  const specials = [];
  const claimed   = new Set(); // "r,c" keys
  const usedGroup = new Set(); // group indices already consumed

  // Phase 1: Detect L/T intersections → Pyramid
  for (let i = 0; i < groups.length; i++) {
    if (usedGroup.has(i)) continue;
    const setA = new Set(groups[i].cells.map(c => `${c.r},${c.c}`));

    for (let j = i + 1; j < groups.length; j++) {
      if (usedGroup.has(j)) continue;
      // Must be different directions (h+v) to form L/T
      if (groups[i].direction === groups[j].direction) continue;

      for (const cell of groups[j].cells) {
        const key = `${cell.r},${cell.c}`;
        if (setA.has(key) && !claimed.has(key)) {
          // Intersection found → Pyramid
          claimed.add(key);
          specials.push({ r: cell.r, c: cell.c, special: 'pyramid', dir: null });
          usedGroup.add(i);
          usedGroup.add(j);
          break;
        }
      }
      if (usedGroup.has(i)) break;
    }
  }

  // Phase 2: Remaining straight-line groups
  const remaining = groups
    .map((g, idx) => ({ ...g, idx }))
    .filter(g => !usedGroup.has(g.idx))
    .sort((a, b) => b.cells.length - a.cells.length);

  for (const group of remaining) {
    const center = group.cells[Math.floor(group.cells.length / 2)];
    const key = `${center.r},${center.c}`;
    if (claimed.has(key)) continue;

    if (group.cells.length >= 5) {
      claimed.add(key);
      specials.push({ r: center.r, c: center.c, special: 'pyramid', dir: null });
    } else if (group.cells.length === 4) {
      claimed.add(key);
      specials.push({
        r: center.r, c: center.c,
        special: 'robot',
        dir: group.direction === 'h' ? 'v' : 'h',
      });
    }
  }
  return specials;
}

// Find a hint swap: the first adjacent swap that would create a match
function findHintSwap(grid, bmap) {
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS - 1; c++) {
      const id1 = grid[r][c]; const id2 = grid[r][c + 1];
      if (!id1 || !id2) continue;
      if (bmap.get(id1)?.special || bmap.get(id2)?.special) continue;
      grid[r][c] = id2; grid[r][c + 1] = id1;
      const ok = findMatchGroups(grid, bmap).length > 0;
      grid[r][c] = id1; grid[r][c + 1] = id2;
      if (ok) return { r1: r, c1: c, r2: r, c2: c + 1 };
    }
  }
  for (let r = 0; r < GRID_ROWS - 1; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      const id1 = grid[r][c]; const id2 = grid[r + 1][c];
      if (!id1 || !id2) continue;
      if (bmap.get(id1)?.special || bmap.get(id2)?.special) continue;
      grid[r][c] = id2; grid[r + 1][c] = id1;
      const ok = findMatchGroups(grid, bmap).length > 0;
      grid[r][c] = id1; grid[r + 1][c] = id2;
      if (ok) return { r1: r, c1: c, r2: r + 1, c2: c };
    }
  }
  return null;
}

// Collect all matched block IDs from groups
function collectMatchedIds(groups, grid) {
  const ids = new Set();
  groups.forEach(g => g.cells.forEach(({ r, c }) => {
    const id = grid[r][c];
    if (id) ids.add(id);
  }));
  return ids;
}

// ─── Block component (stable key = UUID) ─────────────────────────
const blockBaseStyle = {
  position: 'absolute',
  width:    TILE_SIZE,
  height:   TILE_SIZE,
};

const BlockAnim = React.memo(
  ({ id, blockData, ax, ay, ascale, aopacity, isDragging }) => {
    const def = BLOCKS[blockData.type] ?? BLOCKS[0];

    // transform array refs are stable (Animated.Value identity never changes)
    // useMemo deps won't change after mount → allocated once per block
    const animStyle = React.useMemo(() => ({
      ...blockBaseStyle,
      zIndex:    isDragging ? 20 : 1,
      transform: [{ translateX: ax }, { translateY: ay }, { scale: ascale }],
      opacity:   aopacity,
    }), [isDragging, ax, ay, ascale, aopacity]);

    return (
      <Animated.View style={animStyle}>
        <BlockTile block={blockData} blockDef={def} selected={isDragging} />
      </Animated.View>
    );
  },
  (prev, next) =>
    prev.isDragging === next.isDragging &&
    prev.blockData  === next.blockData,
);

// ─── Main component ───────────────────────────────────────────────
const PuzzleGrid = React.memo(function PuzzleGrid({ hard, onScoreAdd, onCombo, paused, obstacles = 0, obstacleRate = 0 }) {
  const onScoreAddRef = useRef(onScoreAdd);
  const onComboRef    = useRef(onCombo);
  onScoreAddRef.current = onScoreAdd;
  onComboRef.current    = onCombo;

  const gridRef      = useRef(null);
  const bmapRef      = useRef(null);
  const animsRef     = useRef(new Map());
  const locked       = useRef(false);
  const drag         = useRef(null);
  const pendingSwap  = useRef(null);


  // Beam effect state
  const beamOpacity  = useRef(new Animated.Value(0)).current;
  const [beamEffect, setBeamEffect] = useState(null);

  // Hint system
  const [hintPair, setHintPair] = useState(null);
  const hintAnim        = useRef(new Animated.Value(0)).current;
  const hintAnimLoopRef = useRef(null);
  const idleTimerRef    = useRef(null);

  const clearHint = useCallback(() => {
    if (idleTimerRef.current)    { clearTimeout(idleTimerRef.current); idleTimerRef.current = null; }
    if (hintAnimLoopRef.current) { hintAnimLoopRef.current.stop();     hintAnimLoopRef.current = null; }
    hintAnim.setValue(0);
    setHintPair(null);
  }, [hintAnim]);

  const startHint = useCallback(() => {
    if (locked.current || paused) return;
    const pair = findHintSwap(gridRef.current, bmapRef.current);
    if (!pair) return;
    setHintPair(pair);
    hintAnim.setValue(0);
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(hintAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(hintAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]));
    hintAnimLoopRef.current = loop;
    loop.start();
  }, [hintAnim, paused]);

  const resetHintTimer = useCallback(() => {
    clearHint();
    if (!paused) idleTimerRef.current = setTimeout(startHint, 3000);
  }, [clearHint, startHint, paused]);
  const resetHintTimerRef = useRef(resetHintTimer);
  resetHintTimerRef.current = resetHintTimer;
  // beamEffect = { r, c, dir: 'h'|'v'|'cross', color }

  const [liveIds, setLiveIds] = useState(() => {
    const { grid, bmap } = buildCleanGrid();
    // Place initial obstacles scattered on bottom rows
    if (obstacles > 0) {
      const positions = [];
      for (let r = GRID_ROWS - 1; r >= 0; r--)
        for (let c = 0; c < GRID_COLS; c++)
          positions.push({ r, c });
      // Shuffle
      for (let i = positions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [positions[i], positions[j]] = [positions[j], positions[i]];
      }
      const count = Math.min(obstacles, positions.length);
      for (let i = 0; i < count; i++) {
        const { r, c } = positions[i];
        const oldId = grid[r][c];
        bmap.delete(oldId);
        const ob = mkObstacle();
        bmap.set(ob.id, ob);
        grid[r][c] = ob.id;
      }
    }
    gridRef.current = grid;
    bmapRef.current = bmap;
    return new Set(bmap.keys());
  });

  // Obstacle spawn timer — ticks every second, spawns with probability obstacleRate
  const obstacleRateRef = useRef(obstacleRate);
  obstacleRateRef.current = obstacleRate;
  const MAX_OBSTACLES = 30;
  const spawnObstacle = useCallback(() => {
    if (obstacleRateRef.current <= 0 || locked.current) return;
    if (Math.random() > obstacleRateRef.current) return;
    const grid = gridRef.current;
    const bmap = bmapRef.current;
    // Enforce max 30 obstacles on board
    let obstacleCount = 0;
    for (const b of bmap.values()) { if (b.special === 'obstacle') obstacleCount++; }
    if (obstacleCount >= MAX_OBSTACLES) return;
    // Pick a random top-row cell that has a regular block
    const candidates = [];
    for (let c = 0; c < GRID_COLS; c++) {
      const id = grid[0][c];
      const b  = bmap.get(id);
      if (b && !b.special) candidates.push({ r: 0, c, id });
    }
    if (candidates.length === 0) return;
    const { r, c, id } = candidates[Math.floor(Math.random() * candidates.length)];
    bmap.delete(id);
    const ob = mkObstacle();
    bmap.set(ob.id, ob);
    grid[r][c] = ob.id;
    setLiveIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      next.add(ob.id);
      return next;
    });
  }, []);

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

  function initAnims() {
    const grid = gridRef.current;
    for (let r = 0; r < GRID_ROWS; r++)
      for (let c = 0; c < GRID_COLS; c++)
        if (grid[r][c]) getAnim(grid[r][c], c * CELL, r * CELL);
  }

  // ─── Animation helpers ───────────────────────────────────────
  const snapSpring = (id, r, c, friction = 10, tension = 240) =>
    Animated.parallel([
      Animated.spring(getAnim(id).x, { toValue: c * CELL, friction, tension, useNativeDriver: true }),
      Animated.spring(getAnim(id).y, { toValue: r * CELL, friction, tension, useNativeDriver: true }),
    ]);

  const dropTiming = (id, r, c) =>
    Animated.parallel([
      Animated.timing(getAnim(id).x, {
        toValue: c * CELL, duration: DROP_MS,
        easing: Easing.out(Easing.quad), useNativeDriver: true,
      }),
      Animated.timing(getAnim(id).y, {
        toValue: r * CELL, duration: DROP_MS,
        easing: Easing.out(Easing.quad), useNativeDriver: true,
      }),
    ]);

  // ─── Gravity ─────────────────────────────────────────────────
  function applyGravity(matchedIds) {
    const grid = gridRef.current;
    const bmap = bmapRef.current;
    const drops  = [];
    const newIds = [];

    for (let c = 0; c < GRID_COLS; c++) {
      const surviving = [];
      for (let r = 0; r < GRID_ROWS; r++)
        if (grid[r][c] && !matchedIds.has(grid[r][c]))
          surviving.push(grid[r][c]);

      const needed = GRID_ROWS - surviving.length;
      const fresh = Array.from({ length: needed }, () => {
        const b = mkBlock();
        bmap.set(b.id, b);
        newIds.push(b.id);
        return b.id;
      });

      const full = [...fresh, ...surviving];
      for (let r = 0; r < GRID_ROWS; r++) {
        const prevId = grid[r][c];
        grid[r][c] = full[r];
        if (full[r] !== prevId) {
          drops.push({ id: full[r], toR: r, toC: c, isNew: r < needed });
        }
      }
    }
    return { drops, newIds };
  }

  // ─── Find block position in grid ─────────────────────────────
  function findBlock(blockId) {
    const grid = gridRef.current;
    for (let r = 0; r < GRID_ROWS; r++)
      for (let c = 0; c < GRID_COLS; c++)
        if (grid[r][c] === blockId) return { r, c };
    return null;
  }

  // ─── Core cascade engine ─────────────────────────────────────
  // Accepts initial matchedIds + specials to create, then cascades.
  const runCascade = useCallback(async (initialMatchedIds, initialSpecials) => {
    const grid = gridRef.current;
    const bmap = bmapRef.current;

    // ── Phase 1: Pre-compute entire cascade chain ────────────────
    const steps = [];
    let curMatchedIds = initialMatchedIds;
    let curSpecials   = initialSpecials;
    let cascade       = 0;

    while (curMatchedIds.size > 0 && cascade < 10) {
      let pts = 0;
      curMatchedIds.forEach(id => {
        if (bmap.get(id)?.special === 'pyramid') pts += SCORE_PYRAMID;
      });
      pts += scoreFor(curMatchedIds.size, cascade);

      // Create special blocks at claimed positions
      const newSpecialIds = [];
      for (const sp of curSpecials) {
        const oldId = grid[sp.r][sp.c];
        const oldBlock = bmap.get(oldId);
        const newBlock = {
          id: uid(),
          type: oldBlock ? oldBlock.type : 0,
          special: sp.special,
          dir: sp.dir,
        };
        bmap.set(newBlock.id, newBlock);
        grid[sp.r][sp.c] = newBlock.id;
        newSpecialIds.push(newBlock.id);
      }

      const { drops, newIds } = applyGravity(curMatchedIds);

      // Pre-init new regular blocks above grid
      drops.forEach(({ id, toC, isNew }) => {
        if (isNew) {
          const a = getAnim(id, toC * CELL, -CELL * 2);
          a.x.setValue(toC * CELL);
          a.y.setValue(-CELL * 2);
          a.scale.setValue(1);
          a.opacity.setValue(1);
        }
      });

      // Pre-init specials at their POST-GRAVITY position, hidden (scale=0)
      const specialPositions = [];
      for (const spId of newSpecialIds) {
        const pos = findBlock(spId);
        if (pos) {
          const a = getAnim(spId, pos.c * CELL, pos.r * CELL);
          a.x.setValue(pos.c * CELL);
          a.y.setValue(pos.r * CELL);
          a.scale.setValue(0);
          a.opacity.setValue(1);
          specialPositions.push({ id: spId, r: pos.r, c: pos.c });
        }
      }

      steps.push({
        matchedIds: curMatchedIds,
        drops,
        newIds: [...newIds, ...newSpecialIds],
        pts,
        cascade,
        specialPositions,
      });

      // Check for cascade matches
      const nextGroups = findMatchGroups(grid, bmap);
      if (nextGroups.length === 0) break;

      curSpecials   = planSpecials(nextGroups);
      curMatchedIds = collectMatchedIds(nextGroups, grid);
      cascade++;
    }

    if (steps.length === 0) { locked.current = false; return; }

    const allMatchedIds = new Set(steps.flatMap(s => [...s.matchedIds]));
    const allNewIds     = steps.flatMap(s => s.newIds);

    // ── Phase 2: Mount all new blocks ────────────────────────────
    if (allNewIds.length > 0) {
      setLiveIds(prev => {
        const next = new Set(prev);
        allNewIds.forEach(id => next.add(id));
        return next;
      });
      await new Promise(res => requestAnimationFrame(res));
    }

    // ── Phase 3: Animate each cascade level ──────────────────────
    for (const { matchedIds, drops, pts, cascade, specialPositions } of steps) {
      onScoreAddRef.current(pts);
      if (cascade > 0) onComboRef.current(cascade);

      // Pop: punch → collapse+fade in one await (saves one async boundary per level)
      const matchArr = [...matchedIds];
      await new Promise(res =>
        Animated.parallel(matchArr.flatMap(id => {
          const a = getAnim(id);
          return [
            Animated.sequence([
              Animated.timing(a.scale,   { toValue: 1.45, duration: POP_PUNCH_MS, useNativeDriver: true }),
              Animated.timing(a.scale,   { toValue: 0,    duration: POP_FADE_MS,  useNativeDriver: true }),
            ]),
            Animated.sequence([
              Animated.delay(POP_PUNCH_MS),
              Animated.timing(a.opacity, { toValue: 0, duration: POP_FADE_MS, useNativeDriver: true }),
            ]),
          ];
        })).start(res)
      );

      // Drop
      if (drops.length > 0) {
        await new Promise(res =>
          Animated.parallel(drops.map(({ id, toR, toC }) => dropTiming(id, toR, toC)))
            .start(res)
        );
      }

      // Special appear (scale-up after drop, at final position)
      if (specialPositions.length > 0) {
        await new Promise(res =>
          Animated.parallel(specialPositions.map(sp =>
            Animated.spring(getAnim(sp.id).scale, {
              toValue: 1, friction: 6, tension: 200, useNativeDriver: true,
            })
          )).start(res)
        );
      }
    }

    // ── Phase 4: Remove matched blocks ───────────────────────────
    setLiveIds(prev => {
      const next = new Set(prev);
      allMatchedIds.forEach(id => next.delete(id));
      return next;
    });

    // ── Phase 5: Cleanup + pending swap ──────────────────────────
    allMatchedIds.forEach(id => animsRef.current.delete(id));

    const pending = pendingSwap.current;
    pendingSwap.current = null;
    locked.current = false;
    if (!pending) resetHintTimerRef.current();

    if (pending) {
      let r1 = -1, c1 = -1, r2 = -1, c2 = -1;
      for (let r = 0; r < GRID_ROWS; r++)
        for (let c = 0; c < GRID_COLS; c++) {
          if (grid[r][c] === pending.id1) { r1 = r; c1 = c; }
          if (grid[r][c] === pending.id2) { r2 = r; c2 = c; }
        }
      if (r1 >= 0 && r2 >= 0 && Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1) {
        locked.current = true;
        doSwap(r1, c1, r2, c2);
      }
    }
  }, []);

  // ─── Special activation (tap) ────────────────────────────────
  const activateSpecial = useCallback(async (r, c) => {
    const grid = gridRef.current;
    const bmap = bmapRef.current;
    const id = grid[r][c];
    const block = bmap.get(id);
    if (!block?.special) return;
    if (block.special === 'obstacle') return; // obstacles are NOT tappable

    locked.current = true;

    // ── BFS chain: collect all cells including chained specials ──
    // Queue: { r, c } of specials to fire
    const matchedIds  = new Set();
    const firedSpecials = new Set(); // track which specials already fired
    const beamQueue   = [{ r, c }];

    while (beamQueue.length > 0) {
      const { r: br, c: bc } = beamQueue.shift();
      const bid   = grid[br][bc];
      if (!bid) continue;
      const blk = bmap.get(bid);
      if (!blk?.special) continue;
      if (firedSpecials.has(bid)) continue;
      firedSpecials.add(bid);
      matchedIds.add(bid);

      const dir = blk.special === 'pyramid' ? 'cross' : blk.dir;
      if (dir === 'h' || dir === 'cross') {
        for (let cc = 0; cc < GRID_COLS; cc++) {
          const tid = grid[br][cc];
          if (tid) {
            matchedIds.add(tid);
            const tb = bmap.get(tid);
            if (tb?.special && tb.special !== 'obstacle' && !firedSpecials.has(tid)) {
              beamQueue.push({ r: br, c: cc });
            }
          }
        }
      }
      if (dir === 'v' || dir === 'cross') {
        for (let rr = 0; rr < GRID_ROWS; rr++) {
          const tid = grid[rr][bc];
          if (tid) {
            matchedIds.add(tid);
            const tb = bmap.get(tid);
            if (tb?.special && tb.special !== 'obstacle' && !firedSpecials.has(tid)) {
              beamQueue.push({ r: rr, c: bc });
            }
          }
        }
      }
    }

    // ── Beam effects: fire sequentially for each chained special ─
    for (const { r: br, c: bc } of [...firedSpecials].map(fid => {
      // Reverse-lookup row/col for this special id
      for (let rr = 0; rr < GRID_ROWS; rr++)
        for (let cc = 0; cc < GRID_COLS; cc++)
          if (grid[rr][cc] === fid) return { r: rr, c: cc };
      return null;
    }).filter(Boolean)) {
      const fid = grid[br][bc];
      const fblk = bmap.get(fid);
      const fdir = fblk?.special === 'pyramid' ? 'cross' : fblk?.dir;
      const beamColor = fblk?.special === 'pyramid' ? '#E8B830' : '#00EEFF';
      setBeamEffect({ r: br, c: bc, dir: fdir, color: beamColor });
      const fa = getAnim(fid);
      await new Promise(res =>
        Animated.parallel([
          Animated.timing(fa.y,     { toValue: br * CELL - 12, duration: 80,  useNativeDriver: true }),
          Animated.timing(fa.scale, { toValue: 1.35,           duration: 80,  useNativeDriver: true }),
          Animated.sequence([
            Animated.timing(beamOpacity, { toValue: 0.85, duration: 50,  useNativeDriver: true }),
            Animated.delay(60),
            Animated.timing(beamOpacity, { toValue: 0,    duration: 80,  useNativeDriver: true }),
          ]),
        ]).start(res)
      );
      setBeamEffect(null);
    }

    // Now run cascade with all collected ids
    runCascade(matchedIds, []);
  }, [runCascade, beamOpacity]);

  // ─── Swap handler ────────────────────────────────────────────
  const doSwap = useCallback(async (r1, c1, r2, c2) => {
    const grid = gridRef.current;
    const bmap = bmapRef.current;
    const id1  = grid[r1][c1];
    const id2  = grid[r2][c2];

    grid[r1][c1] = id2;
    grid[r2][c2] = id1;
    const groups = findMatchGroups(grid, bmap);

    if (groups.length > 0) {
      await new Promise(res =>
        Animated.parallel([
          snapSpring(id1, r2, c2, 10, 240),
          snapSpring(id2, r1, c1, 10, 240),
        ]).start(res)
      );

      const specials   = planSpecials(groups);
      const matchedIds = collectMatchedIds(groups, grid);
      runCascade(matchedIds, specials);

    } else {
      grid[r1][c1] = id1;
      grid[r2][c2] = id2;

      await new Promise(res =>
        Animated.parallel([
          Animated.timing(getAnim(id1).x, { toValue: c2 * CELL, duration: INVALID_FWD_MS, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(getAnim(id1).y, { toValue: r2 * CELL, duration: INVALID_FWD_MS, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(getAnim(id2).x, { toValue: c1 * CELL, duration: INVALID_FWD_MS, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(getAnim(id2).y, { toValue: r1 * CELL, duration: INVALID_FWD_MS, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        ]).start(res)
      );
      await new Promise(res =>
        Animated.parallel([
          snapSpring(id1, r1, c1, 7, 160),
          snapSpring(id2, r2, c2, 7, 160),
        ]).start(res)
      );
      locked.current = false;
    }
  }, [runCascade]);

  // ─── PanResponder ─────────────────────────────────────────────
  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => !paused,
    onMoveShouldSetPanResponder:  (_, gs) =>
      !paused && (Math.abs(gs.dx) > 2 || Math.abs(gs.dy) > 2),

    onPanResponderGrant: (evt) => {
      resetHintTimerRef.current();
      // locationX/locationY are relative to the outer View because the inner View
      // has pointerEvents="none", so no child can intercept the touch.
      const { locationX, locationY } = evt.nativeEvent;
      const PADDING = 4; // outer view's padding offset
      const c = Math.floor((locationX - PADDING) / CELL);
      const r = Math.floor((locationY - PADDING) / CELL);
      if (r >= 0 && r < GRID_ROWS && c >= 0 && c < GRID_COLS) {
        const id = gridRef.current[r][c];
        if (id) drag.current = { r, c, id, dir: null, nid: null, nr: null, nc: null };
      }
    },

    onPanResponderMove: (_, gs) => {
      if (!drag.current || paused) return;
      const { dx, dy } = gs;

      if (!drag.current.dir) {
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3)
          drag.current.dir = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v';
        else return;
      }

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

      // ── TAP: no direction established → check for special ─────
      if (!dir) {
        if (!locked.current) {
          const block = bmapRef.current.get(id);
          if (block?.special) {
            activateSpecial(r, c);
          }
        }
        return;
      }

      const threshold = CELL * 0.20;
      let dr = 0, dc = 0;
      if (dir === 'h' && Math.abs(dx) > threshold) dc = dx > 0 ? 1 : -1;
      if (dir === 'v' && Math.abs(dy) > threshold) dr = dy > 0 ? 1 : -1;

      const tr = r + dr, tc = c + dc;
      const isValidTarget =
        (dr || dc) && tr >= 0 && tr < GRID_ROWS && tc >= 0 && tc < GRID_COLS;

      if (locked.current) {
        if (isValidTarget) {
          const id2 = gridRef.current[tr][tc];
          if (id2 && id2 !== id) {
            pendingSwap.current = { id1: id, id2 };
            Animated.sequence([
              Animated.timing(getAnim(id).scale, { toValue: 1.18, duration: 70, useNativeDriver: true }),
              Animated.timing(getAnim(id).scale, { toValue: 1.00, duration: 70, useNativeDriver: true }),
            ]).start();
          }
        }
        return;
      }

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
      if (locked.current) return;
      const snaps = [snapSpring(id, r, c, 6, 160)];
      if (nid && nRow != null) snaps.push(snapSpring(nid, nRow, nCol, 6, 160));
      Animated.parallel(snaps).start();
    },
  }), [paused, doSwap, activateSpecial]);

  // ─── Hint: clear on pause, start timer on mount ───────────────
  useEffect(() => {
    if (paused) { clearHint(); } else { resetHintTimerRef.current(); }
  }, [paused, clearHint]);

  // ─── Obstacle spawn timer ─────────────────────────────────────
  useEffect(() => {
    if (obstacleRate <= 0 || paused) return;
    const t = setInterval(spawnObstacle, 1000);
    return () => clearInterval(t);
  }, [obstacleRate, paused, spawnObstacle]);

  // ─── Ensure anim entries exist for all current blocks ─────────
  // Only runs when the set of live blocks changes, not on every render
  useEffect(() => { initAnims(); }, [liveIds]);

  const liveIdsArr = useMemo(() => Array.from(liveIds), [liveIds]);

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
      <View style={[styles.inner, { width: GRID_W, height: GRID_H }]} pointerEvents="none">
        {liveIdsArr.map(id => {
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

        {/* ── Hint overlay ─────────────────────────────────── */}
        {hintPair && [
          { r: hintPair.r1, c: hintPair.c1 },
          { r: hintPair.r2, c: hintPair.c2 },
        ].map((pos, i) => (
          <Animated.View
            key={`hint-${i}`}
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: pos.c * CELL,
              top:  pos.r * CELL,
              width: TILE_SIZE,
              height: TILE_SIZE,
              borderRadius: 8,
              borderWidth: 2,
              borderColor: '#FFE040',
              zIndex: 30,
              opacity: hintAnim,
            }}
          />
        ))}

        {/* ── Beam effect overlay ────────────────────────────── */}
        {beamEffect && (beamEffect.dir === 'h' || beamEffect.dir === 'cross') && (
          <Animated.View pointerEvents="none" style={{
            position: 'absolute',
            top:  beamEffect.r * CELL + TILE_SIZE / 2 - 4,
            left: 0, right: 0, height: 8,
            borderRadius: 4,
            backgroundColor: beamEffect.color,
            opacity: beamOpacity,
            shadowColor: beamEffect.color,
            shadowRadius: 16,
            shadowOpacity: 1,
            elevation: 12,
            zIndex: 50,
          }} />
        )}
        {beamEffect && (beamEffect.dir === 'v' || beamEffect.dir === 'cross') && (
          <Animated.View pointerEvents="none" style={{
            position: 'absolute',
            left: beamEffect.c * CELL + TILE_SIZE / 2 - 4,
            top: 0, bottom: 0, width: 8,
            borderRadius: 4,
            backgroundColor: beamEffect.color,
            opacity: beamOpacity,
            shadowColor: beamEffect.color,
            shadowRadius: 16,
            shadowOpacity: 1,
            elevation: 12,
            zIndex: 50,
          }} />
        )}
      </View>
    </View>
  );
}, (prev, next) =>
  prev.hard         === next.hard         &&
  prev.paused       === next.paused       &&
  prev.obstacles    === next.obstacles    &&
  prev.obstacleRate === next.obstacleRate &&
  prev.onScoreAdd   === next.onScoreAdd   &&
  prev.onCombo      === next.onCombo,
);

export default PuzzleGrid;

const styles = StyleSheet.create({
  outer: {
    borderRadius:    12,
    backgroundColor: 'rgba(6,14,28,0.92)',
    padding:         4,
    overflow:        'hidden',
    borderWidth:     2,
    borderColor:     'rgba(70,140,220,0.65)',
    // Glow on iOS
    shadowColor:     '#4090E0',
    shadowOpacity:   0.55,
    shadowRadius:    16,
    shadowOffset:    { width: 0, height: 0 },
    // Elevation on Android
    elevation:       12,
  },
  inner: { position: 'relative' },
});
