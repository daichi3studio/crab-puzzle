/**
 * StageMapScreen — Candy Crush-style stage map
 *
 * Layout:
 *   Top bar: Lives ♥♥♥♥♥  |  countdown
 *   ScrollView: zigzag stage nodes + VS battle nodes (after each zone)
 *   Bottom: ad banner
 *
 * VS battle node: appears after every 5 stages, shows the CPU character.
 * Winning the VS unlocks that character for use in CharSelect.
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Animated, StatusBar,
} from 'react-native';
import CrabSprite from '../components/CrabSprite';
import { useGameStore, msUntilNextLife } from '../store/gameStore';
import { COLORS, ALL_CHARS } from '../constants/gameConfig';
import {
  STAGES, ZONES, MAX_LIVES, LIFE_REGEN_MS, getZone,
  VS_BATTLES, getVsAfterStage,
} from '../constants/stages';

function getCharDef(key) { return ALL_CHARS.find(c => c.key === key) ?? ALL_CHARS[0]; }

// ─── Lives display ───────────────────────────────────────────────

function LivesBar({ lives, msNext }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (lives >= MAX_LIVES) return;
    const t = setInterval(() => setTick(v => v + 1), 1000);
    return () => clearInterval(t);
  }, [lives]);

  const remaining = msNext - tick * 1000;
  const secs = Math.max(0, Math.ceil(remaining / 1000));
  const mins = Math.floor(secs / 60);
  const s    = secs % 60;
  const countdown = `${mins}:${String(s).padStart(2, '0')}`;

  return (
    <View style={styles.livesBar}>
      <View style={styles.livesHearts}>
        {Array.from({ length: MAX_LIVES }).map((_, i) => (
          <Text key={i} style={[styles.heart, i < lives ? styles.heartFull : styles.heartEmpty]}>
            ♥
          </Text>
        ))}
      </View>
      {lives < MAX_LIVES && (
        <Text style={styles.lifeTimer}>{countdown}</Text>
      )}
    </View>
  );
}

// ─── Single stage node ──────────────────────────────────────────

function StageNode({ stage, status, onPress, zoneColor }) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (status !== 'current') return;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1.12, duration: 700, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1.00, duration: 700, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [status]);

  const isLocked  = status === 'locked';
  const isCleared = status === 'cleared';
  const isCurrent = status === 'current';

  const nodeBg    = isLocked ? COLORS.panel : isCleared ? zoneColor + 'CC' : zoneColor;
  const borderCol = isLocked ? COLORS.border : isCleared ? zoneColor : '#FFFFFF';

  return (
    <TouchableOpacity onPress={isLocked ? null : onPress} activeOpacity={isLocked ? 1 : 0.75} disabled={isLocked}>
      <Animated.View style={[
        styles.node,
        { backgroundColor: nodeBg, borderColor: borderCol },
        isCurrent && { transform: [{ scale: pulse }] },
      ]}>
        {isLocked ? (
          <Text style={styles.nodeLock}>🔒</Text>
        ) : (
          <>
            <Text style={styles.nodeNum}>{stage.id}</Text>
            {isCleared && <Text style={styles.nodeCheck}>✓</Text>}
          </>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

// ─── VS Battle node ─────────────────────────────────────────────
// Shows the CPU character standing on the node. Locked until the
// previous zone is fully cleared.

function VsNode({ vs, status, onPress }) {
  // status: 'locked' | 'available' | 'cleared'
  const charDef = getCharDef(vs.unlocksChar);
  const pulse   = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (status !== 'available') return;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1.10, duration: 800, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1.00, duration: 800, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [status]);

  const isLocked  = status === 'locked';
  const isCleared = status === 'cleared';

  const borderCol = isCleared ? COLORS.gold : status === 'available' ? '#FFFFFF' : COLORS.border;
  const bgColor   = isLocked  ? COLORS.panel : isCleared ? '#3A2800' : '#1A2840';

  return (
    <TouchableOpacity onPress={isLocked ? null : onPress} activeOpacity={isLocked ? 1 : 0.75} disabled={isLocked}>
      <Animated.View style={[
        styles.vsNode,
        { borderColor: borderCol, backgroundColor: bgColor },
        status === 'available' && { transform: [{ scale: pulse }] },
      ]}>
        {isLocked ? (
          <Text style={styles.nodeLock}>🔒</Text>
        ) : (
          <>
            <CrabSprite phase={charDef.phase} char={charDef.char} size={32} facingLeft />
            {isCleared && <Text style={styles.vsCleared}>✓</Text>}
          </>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

// ─── Zone label ─────────────────────────────────────────────────

function ZoneLabel({ zone }) {
  return (
    <View style={[styles.zoneLabel, { borderColor: zone.color }]}>
      <Text style={[styles.zoneLabelText, { color: zone.color }]}>{zone.name}</Text>
    </View>
  );
}

// ─── Path connector ─────────────────────────────────────────────

function PathDots({ color, count = 4 }) {
  return (
    <View style={styles.pathContainer}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={[styles.pathDot, { backgroundColor: color }]} />
      ))}
    </View>
  );
}

// ─── Main ───────────────────────────────────────────────────────

export default function StageMapScreen({ navigation }) {
  const store = useGameStore();
  const { hydrate, getLives, stageProgress, clearedStages, clearedVsBattles } = store;

  useEffect(() => { hydrate(); }, []);

  const lives  = getLives();
  const msNext = msUntilNextLife(store.lives, store.livesUpdatedAt);

  const scrollRef = useRef(null);
  const nodeYs    = useRef({});

  const scrollToStage = useCallback((stageId) => {
    const y = nodeYs.current[`stage_${stageId}`];
    if (y != null && scrollRef.current)
      scrollRef.current.scrollTo({ y: Math.max(0, y - 120), animated: true });
  }, []);

  useEffect(() => {
    const t = setTimeout(() => scrollToStage(stageProgress), 400);
    return () => clearTimeout(t);
  }, [stageProgress]);

  const handlePlayStage = (stage) => {
    if (lives <= 0) return;
    navigation.navigate('StageGame', { stageId: stage.id });
  };

  const handlePlayVs = (vs) => {
    navigation.navigate('AdventureBoss', { vsId: vs.id });
  };

  // Build interleaved list: stages + VS battles in order
  // After each block of 5 stages, insert the VS battle node
  const positions = ['left', 'center', 'right', 'center'];
  let posIdx = 0; // tracks zigzag position across stages+vs

  // Build items array: each item is { type: 'stage'|'vs', data }
  const items = [];
  for (const stage of STAGES) {
    items.push({ type: 'stage', data: stage });
    const vs = getVsAfterStage(stage.id);
    if (vs) items.push({ type: 'vs', data: vs });
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      {/* ── Header ─────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← BACK</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ADVENTURE</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* ── Lives ──────────────────────────────────────────────── */}
      <LivesBar lives={lives} msNext={msNext} />

      {/* ── Map ────────────────────────────────────────────────── */}
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.mapContent}
        showsVerticalScrollIndicator={false}
      >
        {items.map((item, idx) => {
          if (item.type === 'stage') {
            const stage     = item.data;
            const zone      = getZone(stage.id);
            const pos       = positions[posIdx % positions.length];
            posIdx++;
            const isFirst   = idx === 0;
            const isCleared = !!clearedStages[stage.id];
            const isCurrent = stage.id === stageProgress;
            const isLocked  = stage.id > stageProgress;
            const status    = isCleared ? 'cleared' : isCurrent ? 'current' : isLocked ? 'locked' : 'cleared';

            // Zone label before first stage of each zone
            const showZoneLabel = isFirst || (zone.stages[0] === stage.id && idx > 0);

            // Color for path coming out of this node
            const pathColor = (isCleared || isCurrent) ? zone.color : COLORS.border;

            return (
              <View key={`s_${stage.id}`} onLayout={e => { nodeYs.current[`stage_${stage.id}`] = e.nativeEvent.layout.y; }}>
                {showZoneLabel && <ZoneLabel zone={zone} />}
                <View style={[styles.nodeRow, styles[`nodeRow_${pos}`]]}>
                  <View style={styles.nodeWrap}>
                    <StageNode
                      stage={stage}
                      status={status}
                      zoneColor={zone.color}
                      onPress={() => handlePlayStage(stage)}
                    />
                    {!isLocked && (
                      <View style={styles.stageInfo}>
                        <Text style={styles.stageName} numberOfLines={1}>{stage.name}</Text>
                        <Text style={styles.stageSub}  numberOfLines={1}>{stage.subtitle}</Text>
                        {isCleared && (
                          <Text style={styles.stageStars}>
                            {'★'.repeat(clearedStages[stage.id]?.stars ?? 0)}
                            {'☆'.repeat(3 - (clearedStages[stage.id]?.stars ?? 0))}
                          </Text>
                        )}
                        <Text style={styles.stageTarget}>🎯 {stage.target.toLocaleString()}</Text>
                      </View>
                    )}
                  </View>
                  <PathDots color={pathColor} />
                </View>
              </View>
            );
          }

          // ── VS Battle node ──────────────────────────────────
          if (item.type === 'vs') {
            const vs        = item.data;
            const pos       = positions[posIdx % positions.length];
            posIdx++;
            const isCleared = !!clearedVsBattles[vs.id];
            // VS is available once all stages in the preceding zone are cleared
            // (stageProgress > vs.afterStage means at least one stage past the zone)
            const isAvailable = stageProgress > vs.afterStage || isCleared;
            const vsStatus  = isCleared ? 'cleared' : isAvailable ? 'available' : 'locked';
            const charDef   = getCharDef(vs.unlocksChar);
            const pathColor = isCleared ? COLORS.gold : isAvailable ? COLORS.textMid : COLORS.border;

            return (
              <View key={`vs_${vs.id}`} onLayout={e => { nodeYs.current[`vs_${vs.id}`] = e.nativeEvent.layout.y; }}>
                <View style={[styles.nodeRow, styles[`nodeRow_${pos}`]]}>
                  <View style={styles.vsWrap}>
                    <VsNode vs={vs} status={vsStatus} onPress={() => handlePlayVs(vs)} />
                    {/* Info bubble */}
                    {!isCleared && isAvailable && (
                      <View style={styles.vsInfo}>
                        <Text style={styles.vsInfoLabel}>VS BATTLE</Text>
                        <Text style={styles.vsInfoSub}>Win to unlock</Text>
                        <Text style={[styles.vsInfoChar, { color: COLORS.gold }]}>{vs.charName}</Text>
                      </View>
                    )}
                    {isCleared && (
                      <View style={styles.vsInfo}>
                        <Text style={styles.vsInfoLabel}>VS BATTLE</Text>
                        <Text style={[styles.vsInfoChar, { color: COLORS.gold }]}>{vs.charName} ✓</Text>
                      </View>
                    )}
                  </View>
                  <PathDots color={pathColor} />
                </View>
              </View>
            );
          }

          return null;
        })}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* ── Ad banner ──────────────────────────────────────────── */}
      <View style={styles.adBanner}>
        <Text style={styles.adText}>AD 320×100</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  headerTitle: { fontSize: 13, fontWeight: '900', color: COLORS.accent, letterSpacing: 3 },
  backBtn:     { paddingVertical: 4 },
  backBtnText: { fontSize: 10, fontWeight: '800', color: COLORS.textDim },

  livesBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  livesHearts: { flexDirection: 'row', gap: 3 },
  heart:       { fontSize: 20 },
  heartFull:   { color: '#FF4060' },
  heartEmpty:  { color: COLORS.border },
  lifeTimer:   { fontSize: 11, fontWeight: '800', color: COLORS.textDim },

  mapContent: { paddingHorizontal: 16, paddingTop: 20 },

  zoneLabel: {
    alignSelf: 'center', borderWidth: 1, borderRadius: 8,
    paddingHorizontal: 16, paddingVertical: 5, marginVertical: 16,
  },
  zoneLabelText: { fontSize: 9, fontWeight: '900', letterSpacing: 2 },

  // Stage rows
  nodeRow:        { flexDirection: 'column', alignItems: 'center', marginVertical: 2 },
  nodeRow_left:   { alignItems: 'flex-start', paddingLeft: 16 },
  nodeRow_center: { alignItems: 'center' },
  nodeRow_right:  { alignItems: 'flex-end', paddingRight: 16 },

  nodeWrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },

  // Stage node circle
  node: {
    width: 52, height: 52, borderRadius: 26, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
    shadowRadius: 8, shadowOpacity: 0.4, elevation: 4,
  },
  nodeNum:   { fontSize: 13, fontWeight: '900', color: '#FFFFFF' },
  nodeLock:  { fontSize: 18 },
  nodeCheck: { fontSize: 9, color: '#FFFFFF', marginTop: -4 },

  stageInfo:   { maxWidth: 130 },
  stageName:   { fontSize: 9,  fontWeight: '900', color: COLORS.text, letterSpacing: 1 },
  stageSub:    { fontSize: 8,  fontWeight: '600', color: COLORS.textMid, marginTop: 1 },
  stageStars:  { fontSize: 11, color: COLORS.gold, marginTop: 2 },
  stageTarget: { fontSize: 8,  fontWeight: '800', color: COLORS.textDim, marginTop: 2 },

  // VS node
  vsWrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  vsNode: {
    width: 64, height: 64, borderRadius: 32, borderWidth: 3,
    alignItems: 'center', justifyContent: 'center',
    shadowRadius: 10, shadowOpacity: 0.5, elevation: 6,
  },
  vsCleared: { position: 'absolute', top: 2, right: 6, fontSize: 10, color: COLORS.gold, fontWeight: '900' },
  vsInfo:    { maxWidth: 120 },
  vsInfoLabel: { fontSize: 8,  fontWeight: '900', color: COLORS.gold, letterSpacing: 2 },
  vsInfoSub:   { fontSize: 7,  fontWeight: '600', color: COLORS.textDim, marginTop: 1 },
  vsInfoChar:  { fontSize: 11, fontWeight: '900', color: COLORS.text, marginTop: 2, letterSpacing: 1 },

  // Path
  pathContainer: { flexDirection: 'column', alignItems: 'center', gap: 4, paddingVertical: 4 },
  pathDot:       { width: 4, height: 4, borderRadius: 2 },

  adBanner: {
    height: 50, backgroundColor: COLORS.panel,
    borderTopWidth: 1, borderTopColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center',
  },
  adText: { fontSize: 10, color: COLORS.textDim },
});
