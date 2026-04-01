/**
 * StageGameScreen — Single-player stage game
 *
 * Layout:
 *  ┌───────────────────────────────────────┐
 *  │  ← STAGE 1  BUG #001   ⏸  [timer]  │
 *  │  ████████████████░░░░░░░  TARGET     │
 *  │         [score] / [target]           │
 *  │                                      │
 *  │          ┌──────────┐               │
 *  │          │ 7×8 GRID │               │
 *  │          └──────────┘               │
 *  │                                      │
 *  │         COMBO x3!                   │
 *  ├──────────────────────────────────────┤
 *  │           AD 320×100                │
 *  └───────────────────────────────────────┘
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  TouchableOpacity, Animated, AppState, Modal, StatusBar,
} from 'react-native';
import PuzzleGrid from '../components/PuzzleGrid';
import { useGameStore } from '../store/gameStore';
import { COLORS } from '../constants/gameConfig';
import { getStage, calcStars } from '../constants/stages';

// ─── Target progress bar ─────────────────────────────────────────

function TargetBar({ score, target }) {
  const pct = Math.min(score / Math.max(target, 1), 1);
  const reached = score >= target;
  return (
    <View style={styles.barTrack}>
      <View style={[
        styles.barFill,
        { width: `${pct * 100}%` },
        reached && styles.barFillReached,
      ]} />
    </View>
  );
}

// ─── Combo toast ─────────────────────────────────────────────────

function ComboToast({ combo }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale   = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    if (combo === 0) return;
    opacity.setValue(1);
    scale.setValue(0.5);
    Animated.parallel([
      Animated.spring(scale,   { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
    const t = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 400, useNativeDriver: true }).start();
    }, 600);
    return () => clearTimeout(t);
  }, [combo]);

  if (combo === 0) return null;
  return (
    <Animated.View style={[styles.combo, { opacity, transform: [{ scale }] }]}>
      <Text style={styles.comboText}>COMBO ×{combo + 1}</Text>
    </Animated.View>
  );
}

// ─── Pause modal ─────────────────────────────────────────────────

function PauseModal({ visible, onResume, onQuit }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.pauseOverlay}>
        <View style={styles.pauseBox}>
          <Text style={styles.pauseTitle}>PAUSED</Text>
          <TouchableOpacity style={styles.pauseBtn} onPress={onResume}>
            <Text style={styles.pauseBtnText}>▶  RESUME</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.pauseSecBtn} onPress={onQuit}>
            <Text style={styles.pauseSecBtnText}>QUIT TO MAP</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Main ────────────────────────────────────────────────────────

export default function StageGameScreen({ route, navigation }) {
  const { stageId } = route.params;
  const stage = getStage(stageId);
  const { spendLife, clearStage } = useGameStore();

  const [score,     setScore]     = useState(0);
  const [timeLeft,  setTimeLeft]  = useState(stage.timeLimit);
  const [phase,     setPhase]     = useState('playing'); // 'playing' | 'paused' | 'done'
  const [combo,     setCombo]     = useState(0);
  const [gridKey,   setGridKey]   = useState(0);

  const timerRef    = useRef(null);
  const appStateRef = useRef(AppState.currentState);
  const scoreRef    = useRef(0); // sync ref for callbacks

  // Spend a life when stage starts
  useEffect(() => {
    spendLife();
  }, []);

  // ─── Timer ───────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'playing') {
      clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setPhase('done');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase]);

  // ─── Pause on app background ─────────────────────────────────
  useEffect(() => {
    const sub = AppState.addEventListener('change', nextState => {
      if (appStateRef.current === 'active' && nextState !== 'active') {
        if (phase === 'playing') setPhase('paused');
      }
      appStateRef.current = nextState;
    });
    return () => sub.remove();
  }, [phase]);

  // ─── Navigate to result when done ────────────────────────────
  useEffect(() => {
    if (phase !== 'done') return;
    const finalScore = scoreRef.current;
    const stars = calcStars(finalScore, stage.target);
    const cleared = finalScore >= stage.target;

    if (cleared) {
      clearStage({ stageId: stage.id, score: finalScore, stars });
    }

    setTimeout(() => {
      navigation.replace('StageResult', {
        stageId:  stage.id,
        score:    finalScore,
        target:   stage.target,
        stars,
        cleared,
      });
    }, 300);
  }, [phase]);

  // ─── Score callbacks ─────────────────────────────────────────
  const handleScore = useCallback(pts => {
    setScore(prev => {
      const next = prev + pts;
      scoreRef.current = next;
      return next;
    });
  }, []);

  const handleCombo = useCallback(level => {
    setCombo(level);
    setTimeout(() => setCombo(0), 1000);
  }, []);

  // ─── Timer color ─────────────────────────────────────────────
  const timerColor = timeLeft <= 5  ? COLORS.timerDanger
                   : timeLeft <= 10 ? COLORS.timerWarn
                   : COLORS.text;

  const reached = score >= stage.target;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      {/* ── Header ──────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setPhase('paused')} style={styles.pauseIconBtn}>
          <Text style={styles.pauseIcon}>⏸</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.stageName}>{stage.name}</Text>
          <Text style={styles.stageSub}>{stage.subtitle}</Text>
        </View>

        <View style={[styles.timerBox, timeLeft <= 10 && styles.timerBoxWarn]}>
          <Text style={[styles.timerNum, { color: timerColor }]}>{timeLeft}</Text>
        </View>
      </View>

      {/* ── Progress bar ─────────────────────────────────────── */}
      <View style={styles.progressRow}>
        <TargetBar score={score} target={stage.target} />
        <View style={styles.progressLabels}>
          <Text style={[styles.scoreVal, reached && styles.scoreReached]}>
            {score.toLocaleString()}
          </Text>
          <Text style={styles.targetLabel}>/ {stage.target.toLocaleString()}</Text>
          {reached && <Text style={styles.clearedTag}>CLEAR!</Text>}
        </View>
      </View>

      {/* ── Combo toast ─────────────────────────────────────── */}
      <ComboToast key={combo} combo={combo} />

      {/* ── Grid ────────────────────────────────────────────── */}
      <View style={styles.gridWrap}>
        <PuzzleGrid
          key={gridKey}
          hard={false}
          onScoreAdd={handleScore}
          onCombo={handleCombo}
          paused={phase !== 'playing'}
          obstacles={stage.obstacles}
          obstacleRate={stage.obstacleRate}
        />
      </View>

      {/* ── Ad banner ───────────────────────────────────────── */}
      <View style={styles.adBanner}>
        <Text style={styles.adText}>AD 320×100</Text>
      </View>

      {/* ── Pause modal ─────────────────────────────────────── */}
      <PauseModal
        visible={phase === 'paused'}
        onResume={() => setPhase('playing')}
        onQuit={() => navigation.goBack()}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },

  // Header
  header: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: 14,
    paddingVertical:   10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerCenter: { alignItems: 'center', flex: 1 },
  stageName: {
    fontSize:      11,
    fontWeight:    '900',
    color:         COLORS.accent,
    letterSpacing: 1,
  },
  stageSub: {
    fontSize:   9,
    fontWeight: '600',
    color:      COLORS.textDim,
    marginTop:  2,
  },
  pauseIconBtn: { padding: 6 },
  pauseIcon:    { fontSize: 18, color: COLORS.textDim },

  timerBox: {
    minWidth:      44,
    alignItems:    'center',
    justifyContent:'center',
    paddingHorizontal: 8,
    paddingVertical:   4,
    borderRadius:  8,
    borderWidth:   1,
    borderColor:   COLORS.border,
  },
  timerBoxWarn: { borderColor: COLORS.timerWarn },
  timerNum: {
    fontSize:    22,
    fontWeight:  '900',
    fontVariant: ['tabular-nums'],
  },

  // Progress
  progressRow: {
    paddingHorizontal: 16,
    paddingVertical:   10,
    gap:               6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  barTrack: {
    height:          10,
    backgroundColor: COLORS.panel,
    borderRadius:    5,
    overflow:        'hidden',
  },
  barFill: {
    height:          '100%',
    backgroundColor: COLORS.accent,
    borderRadius:    5,
  },
  barFillReached: { backgroundColor: COLORS.win },

  progressLabels: {
    flexDirection:  'row',
    alignItems:     'baseline',
    gap:            6,
  },
  scoreVal: {
    fontSize:    18,
    fontWeight:  '900',
    color:       COLORS.text,
    fontVariant: ['tabular-nums'],
  },
  scoreReached: { color: COLORS.win },
  targetLabel: {
    fontSize:   12,
    fontWeight: '700',
    color:      COLORS.textDim,
  },
  clearedTag: {
    fontSize:        10,
    fontWeight:      '900',
    color:           COLORS.win,
    letterSpacing:   1,
    marginLeft:      4,
  },

  // Grid
  gridWrap: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
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

  // Combo
  combo: {
    position:          'absolute',
    top:               160,
    alignSelf:         'center',
    zIndex:            99,
    backgroundColor:   COLORS.gold,
    borderRadius:      20,
    paddingHorizontal: 16,
    paddingVertical:   6,
    shadowColor:       COLORS.gold,
    shadowRadius:      12,
    shadowOpacity:     0.5,
    elevation:         10,
  },
  comboText: { fontSize: 14, fontWeight: '900', color: '#000', letterSpacing: 1 },

  // Pause modal
  pauseOverlay: {
    flex:            1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems:      'center',
    justifyContent:  'center',
  },
  pauseBox: {
    width:             260,
    backgroundColor:   COLORS.panel,
    borderRadius:      16,
    borderWidth:       1,
    borderColor:       COLORS.border,
    padding:           28,
    alignItems:        'center',
    gap:               16,
  },
  pauseTitle: {
    fontSize:      18,
    fontWeight:    '900',
    color:         COLORS.text,
    letterSpacing: 4,
    marginBottom:  4,
  },
  pauseBtn: {
    width:           '100%',
    paddingVertical: 14,
    borderRadius:    10,
    backgroundColor: COLORS.accent,
    alignItems:      'center',
  },
  pauseBtnText: { fontSize: 14, fontWeight: '900', color: '#FFF', letterSpacing: 2 },
  pauseSecBtn: {
    width:           '100%',
    paddingVertical: 12,
    borderRadius:    10,
    borderWidth:     1,
    borderColor:     COLORS.border,
    alignItems:      'center',
  },
  pauseSecBtnText: { fontSize: 12, fontWeight: '700', color: COLORS.textMid },
});
