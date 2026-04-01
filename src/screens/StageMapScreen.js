/**
 * StageMapScreen — Candy Crush-style stage map
 *
 * Layout:
 *   Top bar: Lives ♥♥♥♥♥  |  best score
 *   ScrollView: zigzag stage nodes + zone labels
 *   Bottom: ad banner placeholder
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Animated, StatusBar, AppState,
} from 'react-native';
import { useGameStore, msUntilNextLife } from '../store/gameStore';
import { COLORS }        from '../constants/gameConfig';
import { STAGES, ZONES, MAX_LIVES, LIFE_REGEN_MS, getZone } from '../constants/stages';

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
  // status: 'locked' | 'current' | 'cleared'
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

  const nodeBg = isLocked  ? COLORS.panel
               : isCleared ? zoneColor + 'CC'
               : zoneColor;

  const borderColor = isLocked  ? COLORS.border
                    : isCleared ? zoneColor
                    : '#FFFFFF';

  return (
    <TouchableOpacity
      onPress={isLocked ? null : onPress}
      activeOpacity={isLocked ? 1 : 0.75}
      disabled={isLocked}
    >
      <Animated.View style={[
        styles.node,
        { backgroundColor: nodeBg, borderColor },
        isCurrent && { transform: [{ scale: pulse }] },
      ]}>
        {isLocked ? (
          <Text style={styles.nodeLock}>🔒</Text>
        ) : (
          <>
            <Text style={[styles.nodeNum, isLocked && styles.nodeNumLocked]}>
              {stage.id}
            </Text>
            {isCleared && <Text style={styles.nodeCheck}>✓</Text>}
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
      <Text style={[styles.zoneLabelText, { color: zone.color }]}>
        {zone.name}
      </Text>
    </View>
  );
}

// ─── Map path line ───────────────────────────────────────────────

function PathLine({ color }) {
  return (
    <View style={styles.pathContainer}>
      {Array.from({ length: 5 }).map((_, i) => (
        <View key={i} style={[styles.pathDot, { backgroundColor: color }]} />
      ))}
    </View>
  );
}

// ─── Main ───────────────────────────────────────────────────────

export default function StageMapScreen({ navigation }) {
  const store = useGameStore();
  const { hydrate, getLives, stageProgress, clearedStages, spendLife } = store;

  useEffect(() => { hydrate(); }, []);

  const lives      = getLives();
  const msNext     = msUntilNextLife(store.lives, store.livesUpdatedAt);

  // Scroll to current stage on mount
  const scrollRef  = useRef(null);
  const nodeYs     = useRef({});

  const scrollToStage = useCallback((stageId) => {
    const y = nodeYs.current[stageId];
    if (y != null && scrollRef.current) {
      scrollRef.current.scrollTo({ y: Math.max(0, y - 120), animated: true });
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => scrollToStage(stageProgress), 400);
    return () => clearTimeout(t);
  }, [stageProgress]);

  const handlePlay = (stage) => {
    if (lives <= 0) return;
    navigation.navigate('StageGame', { stageId: stage.id });
  };

  // Build zigzag layout
  // Positions: left (col 0), center (col 1), right (col 2) cycling
  const positions = ['left', 'center', 'right', 'center'];

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
        {STAGES.map((stage, idx) => {
          const zone      = getZone(stage.id);
          const pos       = positions[idx % positions.length];
          const isFirst   = idx === 0;
          const isCleared = !!clearedStages[stage.id];
          const isCurrent = stage.id === stageProgress;
          const isLocked  = stage.id > stageProgress;
          const status    = isCleared ? 'cleared' : isCurrent ? 'current' : isLocked ? 'locked' : 'cleared';

          // Zone label before first stage of each zone
          const showZoneLabel = isFirst || (zone.stages[0] === stage.id && idx > 0);

          return (
            <View key={stage.id} onLayout={e => { nodeYs.current[stage.id] = e.nativeEvent.layout.y; }}>
              {showZoneLabel && <ZoneLabel zone={zone} />}

              <View style={[styles.nodeRow, styles[`nodeRow_${pos}`]]}>
                {/* Node */}
                <View style={styles.nodeWrap}>
                  <StageNode
                    stage={stage}
                    status={status}
                    zoneColor={zone.color}
                    onPress={() => handlePlay(stage)}
                  />
                  {/* Stage info bubble */}
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
                      {!isLocked && (
                        <Text style={styles.stageTarget}>🎯 {stage.target.toLocaleString()}</Text>
                      )}
                    </View>
                  )}
                </View>

                {/* Path line to next stage */}
                {idx < STAGES.length - 1 && (
                  <PathLine color={isCleared || isCurrent ? zone.color : COLORS.border} />
                )}
              </View>
            </View>
          );
        })}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* ── Ad banner placeholder ──────────────────────────────── */}
      <View style={styles.adBanner}>
        <Text style={styles.adText}>AD 320×100</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flex: 1 },

  // Header
  header: {
    flexDirection:    'row',
    alignItems:       'center',
    justifyContent:   'space-between',
    paddingHorizontal: 16,
    paddingVertical:   10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize:      13,
    fontWeight:    '900',
    color:         COLORS.accent,
    letterSpacing: 3,
  },
  backBtn:     { paddingVertical: 4 },
  backBtnText: { fontSize: 10, fontWeight: '800', color: COLORS.textDim },

  // Lives bar
  livesBar: {
    flexDirection:    'row',
    alignItems:       'center',
    justifyContent:   'center',
    gap:              10,
    paddingVertical:  8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  livesHearts: { flexDirection: 'row', gap: 3 },
  heart:       { fontSize: 20 },
  heartFull:   { color: '#FF4060' },
  heartEmpty:  { color: COLORS.border },
  lifeTimer:   { fontSize: 11, fontWeight: '800', color: COLORS.textDim },

  // Map content
  mapContent: { paddingHorizontal: 16, paddingTop: 20 },

  // Zone label
  zoneLabel: {
    alignSelf:     'center',
    borderWidth:   1,
    borderRadius:  8,
    paddingHorizontal: 16,
    paddingVertical:    5,
    marginVertical:    16,
  },
  zoneLabelText: { fontSize: 9, fontWeight: '900', letterSpacing: 2 },

  // Node rows — zigzag
  nodeRow:        { flexDirection: 'column', alignItems: 'center', marginVertical: 4 },
  nodeRow_left:   { alignItems: 'flex-start', paddingLeft: 16 },
  nodeRow_center: { alignItems: 'center' },
  nodeRow_right:  { alignItems: 'flex-end', paddingRight: 16 },

  nodeWrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },

  // Stage node circle
  node: {
    width:        56,
    height:       56,
    borderRadius: 28,
    borderWidth:  2,
    alignItems:   'center',
    justifyContent: 'center',
    shadowRadius: 8,
    shadowOpacity: 0.4,
    elevation:    4,
  },
  nodeNum:       { fontSize: 14, fontWeight: '900', color: '#FFFFFF' },
  nodeNumLocked: { color: COLORS.textDim },
  nodeLock:      { fontSize: 20 },
  nodeCheck:     { fontSize: 10, color: '#FFFFFF', marginTop: -4 },

  // Stage info
  stageInfo: { maxWidth: 140 },
  stageName:  { fontSize: 9,  fontWeight: '900', color: COLORS.text,    letterSpacing: 1 },
  stageSub:   { fontSize: 8,  fontWeight: '600', color: COLORS.textMid, marginTop: 1 },
  stageStars: { fontSize: 11, color: COLORS.gold, marginTop: 2 },
  stageTarget: { fontSize: 8, fontWeight: '800', color: COLORS.textDim, marginTop: 2 },

  // Path dots
  pathContainer: {
    flexDirection: 'column',
    alignItems:    'center',
    gap:           4,
    paddingVertical: 4,
  },
  pathDot: {
    width: 4, height: 4, borderRadius: 2,
  },

  // Ad banner
  adBanner: {
    height:          50,
    backgroundColor: COLORS.panel,
    borderTopWidth:  1,
    borderTopColor:  COLORS.border,
    alignItems:      'center',
    justifyContent:  'center',
  },
  adText: { fontSize: 10, color: COLORS.textDim },
});
