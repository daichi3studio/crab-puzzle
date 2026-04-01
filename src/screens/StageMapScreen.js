/**
 * StageMapScreen — Winding road map
 * Stage 1 at bottom, stage 40 at top. Scroll UP to progress.
 */
import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
  View, Text, SafeAreaView, ScrollView,
  TouchableOpacity, Animated, StatusBar, useWindowDimensions,
  StyleSheet, Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import CrabSprite from '../components/CrabSprite';
import { useGameStore, msUntilNextLife } from '../store/gameStore';
import { COLORS, ALL_CHARS } from '../constants/gameConfig';
import { STAGES, ZONES, VS_BATTLES, MAX_LIVES, getZone, getVsAfterStage } from '../constants/stages';

const gcd = k => ALL_CHARS.find(c => c.key === k) ?? ALL_CHARS[0];

const ND   = 54;   // stage node diameter
const VD   = 66;   // VS node diameter
const YS   = 100;  // vertical step between node centers
const PADV = 80;   // canvas top/bottom padding

// X positions (fraction of screen width) cycling per stage node
const XF = [0.18, 0.52, 0.82, 0.52];

// ── LivesBar ─────────────────────────────────────────────────────
function LivesBar({ lives, msNext }) {
  const [t, setT] = useState(0);
  useEffect(() => {
    if (lives >= MAX_LIVES) return;
    const id = setInterval(() => setT(v => v + 1), 1000);
    return () => clearInterval(id);
  }, [lives]);
  const secs = Math.max(0, Math.ceil((msNext - t * 1000) / 1000));
  return (
    <View style={S.livesBar}>
      <View style={S.hearts}>
        {Array.from({ length: MAX_LIVES }).map((_, i) => (
          <Text key={i} style={[S.heart, i < lives ? S.hFull : S.hEmpty]}>♥</Text>
        ))}
      </View>
      {lives < MAX_LIVES && (
        <Text style={S.lifeTimer}>{Math.floor(secs / 60)}:{String(secs % 60).padStart(2, '0')}</Text>
      )}
    </View>
  );
}

// ── Road path segment between two canvas points ───────────────────
const PathSeg = React.memo(({ x1, y1, x2, y2, color }) => {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  const ang = Math.atan2(dy, dx);
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  const tf = [{ rotate: `${ang}rad` }];
  return (
    <>
      <View style={[S.pBase, { width: len, height: 14, borderRadius: 7, left: mx - len / 2, top: my - 7, backgroundColor: 'rgba(0,0,0,0.55)', transform: tf }]} />
      <View style={[S.pBase, { width: len, height: 9,  borderRadius: 5, left: mx - len / 2, top: my - 4, backgroundColor: color, transform: tf }]} />
    </>
  );
});

// ── Stage node (absolute positioned on canvas) ────────────────────
function StageNode({ cx, cy, stage, status, zoneColor, onPress, charKey }) {
  const pulse = useRef(new Animated.Value(1)).current;
  const isCur = status === 'current';
  const charDef = isCur ? gcd(charKey) : null;
  useEffect(() => {
    if (!isCur) return;
    const lp = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1.22, duration: 580, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1.00, duration: 580, useNativeDriver: true }),
    ]));
    lp.start(); return () => lp.stop();
  }, [isCur]);

  const isLk = status === 'locked';
  const isCl = status === 'cleared';
  const bg = isLk ? '#0E1218' : isCl ? zoneColor + '90' : zoneColor;
  const bc = isCur ? '#FFFFFF' : isLk ? '#1E2430' : isCl ? zoneColor : '#FFFFFF55';
  const r  = ND / 2;

  return (
    <TouchableOpacity
      onPress={isLk ? null : onPress}
      activeOpacity={isLk ? 1 : 0.7}
      style={{ position: 'absolute', left: cx - r, top: cy - r }}
    >
      {/* Solid base masks the path line behind the node */}
      <View style={{ position: 'absolute', width: ND, height: ND, borderRadius: r, backgroundColor: COLORS.bg }} />
      <Animated.View style={[
        S.node,
        { backgroundColor: bg, borderColor: bc, borderWidth: isCur ? 3 : 2 },
        isCur && { transform: [{ scale: pulse }], shadowColor: '#FFFFFF', shadowOpacity: 0.7, shadowRadius: 12, elevation: 10 },
        !isCur && !isLk && { shadowColor: zoneColor, shadowOpacity: 0.4, shadowRadius: 5, elevation: 4 },
        isLk && { opacity: 0.38 },
      ]}>
        {isLk
          ? <Text style={S.nodeLk}>🔒</Text>
          : isCur && charDef
            ? <CrabSprite phase={charDef.phase} char={charDef.char} size={34} />
            : <>
                <Text style={S.nodeN}>{stage.id}</Text>
                {isCl && <Text style={S.nodeCk}>✓</Text>}
              </>
        }
      </Animated.View>
    </TouchableOpacity>
  );
}

// ── VS node (absolute positioned on canvas) ───────────────────────
function VsNode({ cx, cy, vs, status, onPress }) {
  const cd = gcd(vs.unlocksChar);
  const pulse = useRef(new Animated.Value(1)).current;
  const isAv = status === 'available';
  const isCl = status === 'cleared';
  const isLk = status === 'locked';

  useEffect(() => {
    if (!isAv) return;
    const lp = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1.10, duration: 800, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1.00, duration: 800, useNativeDriver: true }),
    ]));
    lp.start(); return () => lp.stop();
  }, [isAv]);

  const bg = isLk ? '#0E1218' : isCl ? '#251800' : '#0A1525';
  const bc = isCl ? COLORS.gold : isAv ? '#FFFFFF' : '#1E2430';
  const r  = VD / 2;
  // Wrapper: label (18px) + gap (3) + circle (VD) + gap (3) + name (18px) = VD+42
  const wH = VD + 42;
  const wW = VD + 44;

  return (
    <View style={{ position: 'absolute', left: cx - wW / 2, top: cy - r - 21, width: wW, height: wH, alignItems: 'center' }}>
      <Text style={[S.vsLbl, { color: isCl ? COLORS.gold : isAv ? COLORS.accent : COLORS.textDim }]}>
        VS BATTLE
      </Text>
      <TouchableOpacity onPress={isLk ? null : onPress} activeOpacity={isLk ? 1 : 0.8}>
        {/* Solid base masks the path line behind the VS node */}
        <View style={{ position: 'absolute', width: VD, height: VD, borderRadius: VD / 2, backgroundColor: COLORS.bg }} />
        <Animated.View style={[
          S.vsNode,
          { backgroundColor: bg, borderColor: bc, borderWidth: isAv || isCl ? 3 : 2 },
          isAv && { transform: [{ scale: pulse }], shadowColor: COLORS.accent, shadowOpacity: 0.6, shadowRadius: 12, elevation: 8 },
          isCl && { shadowColor: COLORS.gold, shadowOpacity: 0.5, shadowRadius: 8, elevation: 5 },
          isLk && { opacity: 0.35 },
        ]}>
          <CrabSprite phase={cd.phase} char={cd.char} size={36} facingLeft />
          {isLk && <Text style={S.vsLkIco}>🔒</Text>}
          {isCl && <Text style={S.vsOk}>✓</Text>}
        </Animated.View>
      </TouchableOpacity>
      <Text style={[S.vsName, { color: isCl ? COLORS.gold : COLORS.textMid }]} numberOfLines={1}>
        {vs.charName}{isCl ? ' ✓' : isAv ? ' !' : ''}
      </Text>
    </View>
  );
}

// ── Zone banner ───────────────────────────────────────────────────
function ZoneBanner({ canvasCy, zone }) {
  return (
    <View style={[S.zb, { top: canvasCy - 14 }]}>
      <View style={[S.zbLine, { backgroundColor: zone.color + '55' }]} />
      <View style={[S.zbTag, { borderColor: zone.color + '88' }]}>
        <Text style={[S.zbTxt, { color: zone.color }]}>{zone.name}</Text>
      </View>
      <View style={[S.zbLine, { backgroundColor: zone.color + '55' }]} />
    </View>
  );
}

// ── Main ──────────────────────────────────────────────────────────
export default function StageMapScreen({ navigation }) {
  const { width: SW, height: SH } = useWindowDimensions();
  const store = useGameStore();
  const { hydrate, getLives, stageProgress, clearedStages, clearedVsBattles, selectedChar } = store;

  // Re-hydrate every time this screen comes into focus (fixes post-background selection bug)
  useFocusEffect(useCallback(() => { hydrate(); }, []));

  const lives  = getLives();
  const msNext = msUntilNextLife(store.lives, store.livesUpdatedAt);
  const [menuVisible, setMenuVisible] = useState(false);
  const scrollRef = useRef(null);

  // Build flat items list: idx 0 = bottom (stage 1), last idx = top (stage 40)
  const items = useMemo(() => {
    const arr = [];
    for (const stage of STAGES) {
      arr.push({ type: 'stage', data: stage });
      const vs = getVsAfterStage(stage.id);
      if (vs) arr.push({ type: 'vs', data: vs });
    }
    return arr;
  }, []);

  const canvasH = PADV + items.length * YS + PADV;

  // Absolute canvas positions for each item
  const positions = useMemo(() => {
    let xi = 0;
    return items.map((item, idx) => {
      const cy = canvasH - PADV - idx * YS;
      const cx = item.type === 'vs' ? SW * 0.50 : SW * XF[xi++ % XF.length];
      return { cx, cy };
    });
  }, [items, SW, canvasH]);

  // Zone background stripes (faint color band per zone)
  const zoneStripes = useMemo(() => {
    return ZONES.map(zone => {
      const stageIdxs = items
        .map((it, i) => (it.type === 'stage' && zone.stages.includes(it.data.id)) ? i : -1)
        .filter(i => i >= 0);
      if (stageIdxs.length === 0) return null;
      const topCy    = positions[stageIdxs[stageIdxs.length - 1]].cy; // topmost stage (smallest cy)
      const bottomCy = positions[stageIdxs[0]].cy;                    // bottommost stage (largest cy)
      return { zone, top: topCy - ND / 2 - 24, bottom: bottomCy + ND / 2 + 24 };
    }).filter(Boolean);
  }, [items, positions]);

  // Zone banner positions: between VS node and next zone's first stage
  const zoneBanners = useMemo(() => {
    return ZONES.map((zone, zi) => {
      const firstIdx = items.findIndex(it => it.type === 'stage' && it.data.id === zone.stages[0]);
      if (firstIdx < 0) return null;
      const firstCy = positions[firstIdx].cy;
      if (zi === 0) {
        // Zone 1: banner just below stage 1
        return { zone, cy: firstCy + YS * 0.6 };
      }
      const prevCy = positions[firstIdx - 1].cy;
      return { zone, cy: (firstCy + prevCy) / 2 };
    }).filter(Boolean);
  }, [items, positions]);

  // Scroll to current stage on mount
  useEffect(() => {
    const curIdx = items.findIndex(it => it.type === 'stage' && it.data.id === stageProgress);
    const { cy } = curIdx >= 0 ? positions[curIdx] : { cy: canvasH - PADV };
    const t = setTimeout(() => {
      scrollRef.current?.scrollTo({ y: Math.max(0, cy - SH * 0.5), animated: false });
    }, 350);
    return () => clearTimeout(t);
  }, []);

  const handlePlayStage = stage => navigation.navigate('StageGame', { stageId: stage.id });
  const handlePlayVs    = vs    => navigation.navigate('BossIntro', { vsId: vs.id });

  const pathColor = idx => {
    if (idx === 0) return '#1A2030';
    const item = items[idx - 1];
    if (item.type === 'stage') {
      return clearedStages[item.data.id] ? getZone(item.data.id).color : '#1A2030';
    }
    return clearedVsBattles[item.data.id] ? COLORS.gold : '#1A2030';
  };

  return (
    <SafeAreaView style={S.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      <View style={S.hdr}>
        <TouchableOpacity onPress={() => navigation.navigate('Title')} style={S.back}>
          <Text style={S.backTxt}>HOME</Text>
        </TouchableOpacity>
        <Text style={S.title}>ADVENTURE</Text>
        <TouchableOpacity onPress={() => setMenuVisible(true)} style={S.menuBtn}>
          <Text style={S.menuBtnTxt}>☰</Text>
        </TouchableOpacity>
      </View>

      {/* ── Hamburger menu modal ─────────────────────────────── */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity
          style={S.modalBackdrop}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View style={S.menuSheet}>
            <Text style={S.menuTitle}>MENU</Text>
            <TouchableOpacity
              style={S.menuItem}
              onPress={() => { setMenuVisible(false); navigation.navigate('CharSelect'); }}
            >
              <Text style={S.menuItemTxt}>SELECT CRAB</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={S.menuItem}
              onPress={() => { setMenuVisible(false); navigation.navigate('Settings'); }}
            >
              <Text style={S.menuItemTxt}>SETTINGS</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[S.menuItem, S.menuClose]}
              onPress={() => setMenuVisible(false)}
            >
              <Text style={S.menuCloseTxt}>✕  CLOSE</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <LivesBar lives={lives} msNext={msNext} />

      <ScrollView
        ref={scrollRef}
        style={S.scroll}
        contentContainerStyle={{ width: SW, height: canvasH }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ position: 'absolute', width: SW, height: canvasH }}>

          {/* ── Zone background stripes ── */}
          {zoneStripes.map(({ zone, top, bottom }) => (
            <View
              key={`zs${zone.id}`}
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: 0, right: 0,
                top,
                height: bottom - top,
                backgroundColor: zone.color + '0D',
                borderTopWidth: 1,
                borderBottomWidth: 1,
                borderColor: zone.color + '22',
              }}
            />
          ))}

          {/* ── Path segments ── */}
          {items.map((_, idx) => {
            if (idx === 0) return null;
            const p0 = positions[idx - 1], p1 = positions[idx];
            return (
              <PathSeg key={`p${idx}`}
                x1={p0.cx} y1={p0.cy}
                x2={p1.cx} y2={p1.cy}
                color={pathColor(idx)}
              />
            );
          })}

          {/* ── Zone banners ── */}
          {zoneBanners.map(({ zone, cy }) => (
            <ZoneBanner key={`z${zone.id}`} canvasCy={cy} zone={zone} />
          ))}

          {/* ── Nodes (rendered on top of paths) ── */}
          {items.map((item, idx) => {
            const { cx, cy } = positions[idx];

            if (item.type === 'stage') {
              const st   = item.data;
              const zone = getZone(st.id);
              const isCl = !!clearedStages[st.id];
              const hasVsGate = !isCl && VS_BATTLES.some(v => v.afterStage < st.id && !clearedVsBattles[v.id]);
              const isLk = st.id > stageProgress || hasVsGate;
              const isCu = !isCl && !isLk && st.id === stageProgress;
              return (
                <StageNode key={`s${st.id}`}
                  cx={cx} cy={cy} stage={st}
                  status={isCl ? 'cleared' : isCu ? 'current' : isLk ? 'locked' : 'cleared'}
                  zoneColor={zone.color}
                  onPress={() => handlePlayStage(st)}
                  charKey={selectedChar}
                />
              );
            }

            if (item.type === 'vs') {
              const vs = item.data;
              const isCl = !!clearedVsBattles[vs.id];
              const isAv = stageProgress > vs.afterStage || isCl;
              return (
                <VsNode key={`v${vs.id}`}
                  cx={cx} cy={cy} vs={vs}
                  status={isCl ? 'cleared' : isAv ? 'available' : 'locked'}
                  onPress={() => handlePlayVs(vs)}
                />
              );
            }
            return null;
          })}

        </View>
      </ScrollView>

      <View style={S.adBanner}>
        <Text style={S.adTxt}>AD 320×100</Text>
      </View>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe:  { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flex: 1 },

  hdr: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  title:   { fontSize: 13, fontWeight: '900', color: COLORS.accent, letterSpacing: 3 },
  back:    { paddingVertical: 4 },
  backTxt: { fontSize: 10, fontWeight: '800', color: COLORS.textDim },

  livesBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  hearts:    { flexDirection: 'row', gap: 3 },
  heart:     { fontSize: 20 },
  hFull:     { color: '#FF4060' },
  hEmpty:    { color: COLORS.border },
  lifeTimer: { fontSize: 11, fontWeight: '800', color: COLORS.textDim },

  // Path
  pBase: { position: 'absolute' },

  // Zone banner
  zb:    { position: 'absolute', left: 0, right: 0, height: 28, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 8 },
  zbLine: { flex: 1, height: 1 },
  zbTag:  { borderWidth: 1, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 3 },
  zbTxt:  { fontSize: 7, fontWeight: '900', letterSpacing: 2 },

  // Stage node
  node: {
    width: ND, height: ND, borderRadius: ND / 2,
    alignItems: 'center', justifyContent: 'center',
  },
  nodeN:  { fontSize: 12, fontWeight: '900', color: '#FFFFFF' },
  nodeLk: { fontSize: 16 },
  nodeCk: { fontSize: 8, color: 'rgba(255,255,255,0.8)', marginTop: -3 },

  // VS node
  vsNode: {
    width: VD, height: VD, borderRadius: VD / 2,
    alignItems: 'center', justifyContent: 'center',
  },
  vsLbl:   { fontSize: 7, fontWeight: '900', letterSpacing: 2, marginBottom: 3 },
  vsName:  { fontSize: 9, fontWeight: '800', letterSpacing: 1, marginTop: 4 },
  vsLkIco: { position: 'absolute', bottom: 4, right: 5, fontSize: 10 },
  vsOk:    { position: 'absolute', top: 2, right: 6, fontSize: 10, color: COLORS.gold, fontWeight: '900' },

  adBanner: {
    height: 50, backgroundColor: COLORS.panel,
    borderTopWidth: 1, borderTopColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center',
  },
  adTxt: { fontSize: 10, color: COLORS.textDim },

  // Header extras
  menuBtn:    { width: 60, alignItems: 'flex-end', paddingRight: 4, paddingVertical: 4 },
  menuBtnTxt: { fontSize: 22, color: COLORS.textMid },

  // Hamburger modal
  modalBackdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-start', alignItems: 'flex-end',
    paddingTop: 56, paddingRight: 12,
  },
  menuSheet: {
    backgroundColor: COLORS.panel,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    minWidth: 180,
    overflow: 'hidden',
  },
  menuTitle: {
    fontSize: 9, fontWeight: '900', color: COLORS.textDim, letterSpacing: 2,
    paddingHorizontal: 20, paddingTop: 14, paddingBottom: 8,
  },
  menuItem: {
    paddingVertical: 14, paddingHorizontal: 20,
    borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  menuItemTxt: { fontSize: 12, fontWeight: '800', color: COLORS.text, letterSpacing: 1 },
  menuClose:   { },
  menuCloseTxt:{ fontSize: 11, fontWeight: '800', color: COLORS.textDim, letterSpacing: 1 },
});
