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
import TutorialOverlay from '../components/TutorialOverlay';
import { useGameStore } from '../store/gameStore';
import { useSoundEffects } from '../hooks/useSoundEffects';
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

const COMBO_LEVELS = [
  { minCombo: 0, color: COLORS.gold,    textColor: '#000', size: 14, glow: false },
  { minCombo: 2, color: '#FF8820',      textColor: '#FFF', size: 16, glow: false },
  { minCombo: 3, color: '#FF3040',      textColor: '#FFF', size: 18, glow: true  },
  { minCombo: 5, color: '#FF00CC',      textColor: '#FFF', size: 20, glow: true  },
];

function getComboStyle(combo) {
  let style = COMBO_LEVELS[0];
  for (const lvl of COMBO_LEVELS) {
    if (combo >= lvl.minCombo) style = lvl;
  }
  return style;
}

function ComboToast({ combo, onFlash }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale   = useRef(new Animated.Value(0.5)).current;
  const lvl = getComboStyle(combo);

  useEffect(() => {
    if (combo === 0) return;
    opacity.setValue(1);
    scale.setValue(0.5);
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
    if (lvl.glow && onFlash) onFlash(lvl.color);
    const t = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 400, useNativeDriver: true }).start();
    }, 700);
    return () => clearTimeout(t);
  }, [combo]);

  if (combo === 0) return null;
  return (
    <Animated.View style={[
      styles.combo,
      { opacity, transform: [{ scale }], backgroundColor: lvl.color },
      lvl.glow && { shadowColor: lvl.color, shadowRadius: 20, shadowOpacity: 0.8, elevation: 16 },
    ]}>
      <Text style={[styles.comboText, { color: lvl.textColor, fontSize: lvl.size }]}>
        COMBO ×{combo + 1}
      </Text>
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
  const { spendLife, clearStage, recordCombo, recordStagePlayed, tutorialSeen, markTutorialSeen } = useGameStore();
  const { play } = useSoundEffects();

  const [score,     setScore]     = useState(0);
  const [timeLeft,  setTimeLeft]  = useState(stage.timeLimit);
  const [phase,     setPhase]     = useState('playing'); // 'playing' | 'paused' | 'done'
  const [combo,     setCombo]     = useState(0);
  const [gridKey,   setGridKey]   = useState(0);
  const [showTutorial, setShowTutorial] = useState(!tutorialSeen);

  const flashAnim      = useRef(new Animated.Value(0)).current;
  const [flashColor, setFlashColor] = useState('#FF3040');
  const timerPulse     = useRef(new Animated.Value(1)).current;
  const timerPulseLoop = useRef(null);

  const timerRef    = useRef(null);
  const appStateRef = useRef(AppState.currentState);
  const scoreRef    = useRef(0);    // sync ref for callbacks
  const maxComboRef = useRef(0);    // sync ref for max combo this session

  // Spend a life and record play when stage starts
  useEffect(() => {
    spendLife();
    recordStagePlayed();
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
    const maxCombo   = maxComboRef.current;
    const stars = calcStars(finalScore, stage.target, maxCombo, stage.comboTarget);
    const cleared = finalScore >= stage.target;

    if (cleared) {
      clearStage({ stageId: stage.id, score: finalScore, stars });
      play('clear');
    } else {
      play('fail');
    }

    setTimeout(() => {
      navigation.replace('StageResult', {
        stageId:     stage.id,
        score:       finalScore,
        target:      stage.target,
        stars,
        cleared,
        maxCombo,
        comboTarget: stage.comboTarget,
      });
    }, 300);
  }, [phase]);

  // ─── Score callbacks ─────────────────────────────────────────
  const handleScore = useCallback(pts => {
    play('match');
    setScore(prev => {
      const next = prev + pts;
      scoreRef.current = next;
      return next;
    });
  }, [play]);

  const handleCombo = useCallback(level => {
    play('combo');
    setCombo(level);
    recordCombo(level);
    if (level > maxComboRef.current) maxComboRef.current = level;
    setTimeout(() => setCombo(0), 1000);
  }, [play, recordCombo]);

  const handleFlash = useCallback(color => {
    setFlashColor(color);
    flashAnim.setValue(0.35);
    Animated.timing(flashAnim, { toValue: 0, duration: 350, useNativeDriver: true }).start();
  }, [flashAnim]);

  // ─── Timer pulse at ≤10s ─────────────────────────────────────
  useEffect(() => {
    if (timeLeft === 10 && phase === 'playing') {
      timerPulseLoop.current = Animated.loop(
        Animated.sequence([
          Animated.timing(timerPulse, { toValue: 1.18, duration: 280, useNativeDriver: true }),
          Animated.timing(timerPulse, { toValue: 1.00, duration: 280, useNativeDriver: true }),
        ])
      );
      timerPulseLoop.current.start();
    }
    if (timeLeft === 0 || phase !== 'playing') {
      timerPulseLoop.current?.stop();
      timerPulse.setValue(1);
    }
  }, [timeLeft, phase]);

  // ─── Timer color ─────────────────────────────────────────────
  const timerColor = timeLeft <= 10 ? COLORS.timerDanger : COLORS.text;

  const reached = score >= stage.target;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      {/* ── Header ──────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setPhase('paused')} style={styles.pauseIconBtn}>
          <Text style={styles.pauseIcon}>⏸</Text>
        </TouchableOpacity>

        {/* Center: stage info + big timer */}
        <View style={styles.headerCenter}>
          <Text style={styles.stageName}>{stage.name}</Text>
          <Text style={styles.stageSub}>{stage.subtitle}</Text>
          <Animated.Text style={[
            styles.timerNum,
            { color: timerColor, transform: [{ scale: timerPulse }] },
            timeLeft <= 10 && styles.timerNumDanger,
          ]}>
            {timeLeft}
          </Animated.Text>
        </View>

        <View style={{ width: 36 }} />
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

      {/* ── Combo flash overlay ─────────────────────────────── */}
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { opacity: flashAnim, backgroundColor: flashColor, zIndex: 90 }]}
      />

      {/* ── Combo toast ─────────────────────────────────────── */}
      <ComboToast key={combo} combo={combo} onFlash={handleFlash} />

      {/* ── Grid ────────────────────────────────────────────── */}
      <View style={styles.gridWrap}>
        <PuzzleGrid
          key={gridKey}
          hard={false}
          onScoreAdd={handleScore}
          onCombo={handleCombo}
          paused={phase !== 'playing' || showTutorial}
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

      {/* ── Tutorial overlay (first launch) ─────────────────── */}
      <TutorialOverlay
        visible={showTutorial}
        onDone={() => {
          setShowTutorial(false);
          markTutorialSeen();
        }}
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

  timerNum: {
    fontSize:    44,
    fontWeight:  '900',
    fontVariant: ['tabular-nums'],
    color:       COLORS.text,
    marginTop:   4,
  },
  timerNumDanger: {
    textShadowColor:  COLORS.timerDanger,
    textShadowRadius: 12,
    textShadowOffset: { width: 0, height: 0 },
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
