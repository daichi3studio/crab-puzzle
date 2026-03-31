/**
 * PuzzleGrid v5 — Stable-ID animation system
 *
 * Design principles:
 *  1. Each block has a UUID. React key = block ID (never changes during play).
 *  2. Animated.Values are keyed by block ID → no unmount/remount mid-animation.
 *  3. React setState only for adding/removing blocks (match/gravity).
 *  4. All position changes go through Animated — React never causes re-renders during animation.
 *
 * Animation feel:
 *  - Drag: block follows finger; neighbor block pushes in opposite direction
 *  - Invalid swap: snaps to target, bounces back
 *  - Match pop: punch up (1.4×) → shrink+fade (0.18s total)
 *  - Gravity: parallel spring drop, tension=130 (natural, minimal vibration)
 *  - Idle breathe: gentle scale pulse on each block (ZooKeeper feel)
 *  - Selected: block lifts (scale 1.08, shadow-like)
 */
import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { View, StyleSheet, PanResponder, Animated } from 'react-native';
import BlockTile from './BlockTile';
import {
  GRID_COLS, GRID_ROWS, TILE_SIZE, TILE_GAP,
  BLOCKS,
  ROBOT_RATE_EASY, ROBOT_RATE_HARD,
  PYRAMID_RATE_EASY, PYRAMID_RATE_HARD,
  SCORE_MATCH3, SCORE_MATCH4, SCORE_MATCH5, SCORE_EXTRA, SCORE_PYRAMID,
  CASCADE_MULT,
} from '../constants/gameConfig';

const CELL   = TILE_SIZE + TILE_GAP;
const GRID_W = GRID_COLS * CELL - TILE_GAP;
const GRID_H = GRID_ROWS * CELL - TILE_GAP;

// ─── Unique block IDs ────────────────────────────────────────────
let _uid = 1000;
const uid = () => ++_uid;

// ─── Pure data helpers (no React) ────────────────────────────────
const rndType    = ()     => Math.floor(Math.random() * BLOCKS.length);
const rndSpecial = (hard) => {
  const v = Math.random();
  const py = hard ? PYRAMID_RATE_HARD : PYRAMID_RATE_EASY;
  const ro = hard ? ROBOT_RATE_HARD   : ROBOT_RATE_EASY;
  if (v < py)      return 'pyramid';
  if (v < py + ro) return 'robot';
  return null;
};
const mkBlock = (hard) => ({ id: uid(), type: rndType(), special: rndSpecial(hard) });

function matchIds(idA, idB, bmap) {
  const a = bmap.get(idA), b = bmap.get(idB);
  if (!a || !b) return false;
  if (a.special === 'robot' || b.special === 'robot') return true;
  return a.type === b.type;
}

function findMatches(grid, bmap) {
  const hits = new Set();
  // Horizontal
  for (let r = 0; r < GRID_ROWS; r++) {
    let s = 0;
    for (let c = 1; c <= GRID_COLS; c++) {
      const ok = c < GRID_COLS && grid[r][c] && grid[r][c-1] &&
                 matchIds(grid[r][c], grid[r][c-1], bmap);
      if (!ok) {
        if (c - s >= 3) for (let k = s; k < c; k++) hits.add(`${r},${k}`);
        s = c;
      }
    }
  }
  // Vertical
  for (let c = 0; c < GRID_COLS; c++) {
    let s = 0;
    for (let r = 1; r <= GRID_ROWS; r++) {
      const ok = r < GRID_ROWS && grid[r][c] && grid[r-1][c] &&
                 matchIds(grid[r][c], grid[r-1][c], bmap);
      if (!ok) {
        if (r - s >= 3) for (let k = s; k < r; k++) hits.add(`${k},${c}`);
        s = r;
      }
    }
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
        const b = mkBlock(hard); bmap.set(b.id, b); grid[r][c] = b.id;
      }
    tries++;
  } while (findMatches(grid, bmap).size > 0 && tries < 100);
  return { grid, bmap };
}

function scoreFor(n, cascade) {
  const base = n <= 3 ? SCORE_MATCH3 : n <= 4 ? SCORE_MATCH4
             : n <= 5 ? SCORE_MATCH5 : SCORE_MATCH5 + (n-5)*SCORE_EXTRA;
  return Math.floor(base * Math.pow(CASCADE_MULT, cascade));
}

// ─── Per-block idle breathe animation ────────────────────────────
// Stagger phase by block ID so all blocks don't pulse together
function useIdleBreathe(anim, blockId, paused) {
  const loopRef = useRef(null);
  useEffect(() => {
    if (paused) { loopRef.current?.stop(); return; }
    const phase = (blockId * 137) % 3000; // golden-ratio stagger
    const timeout = setTimeout(() => {
      loopRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 1.03, duration: 900, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 1.00, duration: 900, useNativeDriver: true }),
        ])
      );
      loopRef.current.start();
    }, phase);
    return () => {
      clearTimeout(timeout);
      loopRef.current?.stop();
      anim.setValue(1);
    };
  }, [paused]);
}

// ─── Animated block component (stable key = id) ──────────────────
const BlockAnim = React.memo(({ id, blockData, ax, ay, ascale, aopacity, isDragging, paused }) => {
  const def      = BLOCKS[blockData.type] ?? BLOCKS[0];
  const breathe  = useRef(new Animated.Value(1)).current;
  useIdleBreathe(breathe, id, paused || isDragging);

  return (
    <Animated.View style={{
      position:  'absolute',
      width:     TILE_SIZE,
      height:    TILE_SIZE,
      zIndex:    isDragging ? 20 : 1,
      transform: [
        { translateX: ax },
        { translateY: ay },
        { scale: Animated.multiply(ascale, breathe) },
      ],
      opacity: aopacity,
    }}>
      <BlockTile block={blockData} blockDef={def} selected={isDragging} />
    </Animated.View>
  );
}, (prev, next) =>
  prev.isDragging === next.isDragging &&
  prev.paused     === next.paused     &&
  prev.blockData  === next.blockData
);

// ─── Main grid component ─────────────────────────────────────────
export default function PuzzleGrid({ hard, onScoreAdd, onCombo, paused }) {
  const hardRef = useRef(hard);
  hardRef.current = hard;

  // Mutable game state (refs, not useState — prevents re-renders mid-animation)
  const gridRef  = useRef(null);  // grid[r][c] = block ID | null
  const bmapRef  = useRef(null);  // Map<id, {type, special}>
  const animsRef = useRef(new Map()); // Map<id, {x,y,scale,opacity}>
  const locked   = useRef(false);

  // React state: only liveIds drives render additions/removals
  const [liveIds, setLiveIds] = useState(() => {
    const { grid, bmap } = buildCleanGrid(hard);
    gridRef.current = grid;
    bmapRef.current = bmap;
    return new Set(bmap.keys());
  });

  // Drag state
  const drag = useRef(null); // {r,c,id,dir,nid}

  // ─── Anim accessors ──────────────────────────────────────────
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

  // ─── Spring move ─────────────────────────────────────────────
  const springTo = (id, r, c, friction = 7, tension = 180) =>
    Animated.parallel([
      Animated.spring(getAnim(id).x, { toValue: c*CELL, friction, tension, useNativeDriver: true }),
      Animated.spring(getAnim(id).y, { toValue: r*CELL, friction, tension, useNativeDriver: true }),
    ]);

  // ─── Pop animation: punch → collapse ─────────────────────────
  function doPop(ids) {
    return new Promise(res =>
      Animated.parallel(ids.map(id => {
        const a = getAnim(id);
        return Animated.sequence([
          // Punch outward
          Animated.timing(a.scale, { toValue: 1.45, duration: 65, useNativeDriver: true }),
          // Collapse + fade simultaneously
          Animated.parallel([
            Animated.timing(a.scale,   { toValue: 0, duration: 100, useNativeDriver: true }),
            Animated.timing(a.opacity, { toValue: 0, duration: 100, useNativeDriver: true }),
          ]),
        ]);
      })).start(res)
    );
  }

  // ─── Gravity + refill ─────────────────────────────────────────
  function applyGravity(matchedIds) {
    const grid = gridRef.current;
    const bmap = bmapRef.current;
    const drops = [];   // {id, toR, toC, fromAbove: bool}
    const newIds = [];

    for (let c = 0; c < GRID_COLS; c++) {
      // Collect surviving blocks top→bottom
      const surviving = [];
      for (let r = 0; r < GRID_ROWS; r++)
        if (grid[r][c] && !matchedIds.has(grid[r][c])) surviving.push(grid[r][c]);

      const needed = GRID_ROWS - surviving.length;

      // New blocks
      const fresh = Array.from({ length: needed }, () => {
        const b = mkBlock(hardRef.current);
        bmap.set(b.id, b);
        newIds.push(b.id);
        return b.id;
      });

      // Full column: fresh on top, surviving below
      const full = [...fresh, ...surviving];
      for (let r = 0; r < GRID_ROWS; r++) {
        grid[r][c] = full[r];
        drops.push({ id: full[r], toR: r, toC: c, isNew: r < needed });
      }
    }
    return { drops, newIds };
  }

  // ─── Match processing chain ───────────────────────────────────
  const processMatches = useCallback(async (matches, cascade) => {
    if (matches.size === 0) { locked.current = false; return; }

    const grid = gridRef.current;
    const bmap = bmapRef.current;

    // Score
    let pts = scoreFor(matches.size, cascade), bonus = 0;
    const matchedIds = new Set();
    matches.forEach(key => {
      const [r, c] = key.split(',').map(Number);
      const id = grid[r][c];
      matchedIds.add(id);
      if (bmap.get(id)?.special === 'pyramid') bonus += SCORE_PYRAMID;
    });
    onScoreAdd(pts + bonus);
    if (cascade > 0) onCombo(cascade);

    // Pop!
    await doPop([...matchedIds]);

    // Gravity
    const { drops, newIds } = applyGravity(matchedIds);

    // Add new blocks to React state (so they mount)
    setLiveIds(prev => {
      const next = new Set(prev);
      matchedIds.forEach(id => next.delete(id));
      newIds.forEach(id => next.add(id));
      return next;
    });

    // One frame for new blocks to mount
    await new Promise(res => requestAnimationFrame(() => requestAnimationFrame(res)));

    // Set new blocks' start position (above grid)
    drops.forEach(({ id, toC, isNew, toR }) => {
      if (isNew) {
        const a = getAnim(id, toC * CELL, -CELL * 2);
        a.x.setValue(toC * CELL);
        a.y.setValue(-CELL * 2);
        a.scale.setValue(1);
        a.opacity.setValue(1);
      }
    });

    // Animate all drops simultaneously
    await new Promise(res =>
      Animated.parallel(drops.map(({ id, toR, toC }) =>
        springTo(id, toR, toC, 7, 130)  // low tension = natural gravity, minimal vibration
      )).start(res)
    );

    // Clean up matched anims
    matchedIds.forEach(id => animsRef.current.delete(id));

    // Cascade
    const next = findMatches(grid, bmap);
    if (next.size > 0) processMatches(next, cascade + 1);
    else locked.current = false;
  }, [onScoreAdd, onCombo]);

  // ─── Swap logic ───────────────────────────────────────────────
  const doSwap = useCallback(async (r1, c1, r2, c2) => {
    const grid = gridRef.current;
    const bmap = bmapRef.current;
    const id1 = grid[r1][c1], id2 = grid[r2][c2];

    // Swap data
    grid[r1][c1] = id2;
    grid[r2][c2] = id1;
    const matches = findMatches(grid, bmap);

    if (matches.size > 0) {
      // Valid — snap into place, then pop
      await new Promise(res =>
        Animated.parallel([springTo(id1,r2,c2), springTo(id2,r1,c1)]).start(res)
      );
      processMatches(matches, 0);
    } else {
      // Invalid — snap forward, bounce back
      grid[r1][c1] = id1;
      grid[r2][c2] = id2;
      await new Promise(res =>
        Animated.parallel([springTo(id1,r2,c2,7,200), springTo(id2,r1,c1,7,200)]).start(res)
      );
      await new Promise(res =>
        Animated.parallel([springTo(id1,r1,c1,5,120), springTo(id2,r2,c2,5,120)]).start(res)
      );
      locked.current = false;
    }
  }, [processMatches]);

  // ─── PanResponder ─────────────────────────────────────────────
  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => !locked.current && !paused,
    onMoveShouldSetPanResponder:  (_, gs) =>
      !locked.current && !paused && (Math.abs(gs.dx) > 4 || Math.abs(gs.dy) > 4),

    onPanResponderGrant: (evt) => {
      const { locationX, locationY } = evt.nativeEvent;
      const c = Math.floor(locationX / CELL);
      const r = Math.floor(locationY / CELL);
      if (r >= 0 && r < GRID_ROWS && c >= 0 && c < GRID_COLS) {
        const id = gridRef.current[r][c];
        if (id) drag.current = { r, c, id, dir: null, nid: null };
      }
    },

    onPanResponderMove: (_, gs) => {
      if (!drag.current || locked.current || paused) return;
      const { r, c, id } = drag.current;
      const { dx, dy } = gs;

      // Lock swipe direction on first significant movement
      if (!drag.current.dir) {
        if (Math.abs(dx) > 6 || Math.abs(dy) > 6)
          drag.current.dir = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v';
        else return;
      }

      const max  = CELL;
      let cdx = 0, cdy = 0, nr = r, nc = c;

      if (drag.current.dir === 'h') {
        cdx = Math.max(-max, Math.min(max, dx));
        nc  = c + (cdx > 0 ? 1 : -1);
      } else {
        cdy = Math.max(-max, Math.min(max, dy));
        nr  = r + (cdy > 0 ? 1 : -1);
      }

      // Move dragged block with finger
      const a = getAnim(id);
      a.x.setValue(c * CELL + cdx);
      a.y.setValue(r * CELL + cdy);

      // Push neighbor
      if (nr >= 0 && nr < GRID_ROWS && nc >= 0 && nc < GRID_COLS) {
        const nid = gridRef.current[nr][nc];
        if (nid && nid !== drag.current.nid) drag.current.nid = nid;
        if (nid) {
          const an = getAnim(nid);
          an.x.setValue(nc * CELL - cdx);
          an.y.setValue(nr * CELL - cdy);
        }
      }
    },

    onPanResponderRelease: (_, gs) => {
      if (!drag.current) return;
      const { r, c, id, dir } = drag.current;
      const { dx, dy } = gs;
      const prev = drag.current;
      drag.current = null;

      const threshold = CELL * 0.28;
      let dr = 0, dc = 0;
      if (dir === 'h' && Math.abs(dx) > threshold) dc = dx > 0 ? 1 : -1;
      if (dir === 'v' && Math.abs(dy) > threshold) dr = dy > 0 ? 1 : -1;

      const tr = r + dr, tc = c + dc;
      if ((dr || dc) && tr >= 0 && tr < GRID_ROWS && tc >= 0 && tc < GRID_COLS) {
        locked.current = true;
        doSwap(r, c, tr, tc);
      } else {
        // Snap back to home position
        Animated.parallel([
          springTo(id, r, c, 6, 180),
          ...(prev.nid ? [springTo(prev.nid,
            Math.floor(getAnim(prev.nid).y.__getValue() / CELL + 0.5),
            Math.floor(getAnim(prev.nid).x.__getValue() / CELL + 0.5), 6, 180)] : []),
        ]).start();
      }
    },

    onPanResponderTerminate: () => {
      if (drag.current) {
        const { r, c, id, nid } = drag.current;
        drag.current = null;
        springTo(id, r, c, 5, 150).start();
        // nid will snap via its own spring if referenced
      }
    },
  }), [paused, doSwap]);

  // Init anims on first render
  initAnims();

  // Build id→{r,c} map for rendering
  const posMap = useMemo(() => {
    const m = new Map();
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
              paused={paused}
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
    overflow:        'hidden',
  },
  inner: { position: 'relative' },
});
