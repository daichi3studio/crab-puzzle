/**
 * AdventureBossScreen — VS battle (3 rounds, best total score wins)
 *
 * Each round is ROUND_TIME seconds. Player and CPU accumulate scores over 3 rounds.
 * After all 3 rounds, whoever has the higher total wins.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, Animated, AppState,
  TouchableOpacity, Modal, StatusBar,
} from 'react-native';
import PuzzleGrid from '../components/PuzzleGrid';
import CrabSprite from '../components/CrabSprite';
import { useGameStore } from '../store/gameStore';
import { ROUND_TIME, OPP_EASY, OPP_HARD, COLORS, ALL_CHARS } from '../constants/gameConfig';
import { getVsBattle } from '../constants/stages';

const TOTAL_ROUNDS = 3;
const OPP_NORMAL    = { min: 10, max: 25 };
const OPP_SUPERHARD = { min: 30, max: 70 };
const DIFF_CFG = { easy: OPP_EASY, normal: OPP_NORMAL, hard: OPP_HARD, superhard: OPP_SUPERHARD };

function randBetween(a, b) { return a + Math.random() * (b - a); }
function getCharDef(key) { return ALL_CHARS.find(c => c.key === key) ?? ALL_CHARS[0]; }

const CPU_CHARS = {
  vs1: 'p2', vs2: 'chip', vs3: 'pink', vs4: 'wing',
  vs5: 'power', vs6: 'gentle', vs7: 'robot', vs8: 'pyramid',
};

// ─── Round end overlay ───────────────────────────────────────────
function RoundEndOverlay({ round, playerTotal, oppTotal, isLast }) {
  const op = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.timing(op, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  }, []);
  const ahead = playerTotal > oppTotal ? 'YOU LEAD' : playerTotal < oppTotal ? 'CPU LEADS' : 'TIED';
  const aheadColor = playerTotal >= oppTotal ? COLORS.accent : '#FF8888';
  return (
    <Animated.View style={[styles.roundOverlay, { opacity: op }]} pointerEvents="none">
      <View style={styles.roundBox}>
        <Text style={styles.roundEndTitle}>
          {isLast ? 'FINAL ROUND!' : `ROUND ${round} END`}
        </Text>
        <Text style={[styles.roundAhead, { color: aheadColor }]}>{ahead}</Text>
        <View style={styles.roundScoreRow}>
          <Text style={styles.roundScoreLbl}>YOU</Text>
          <Text style={[styles.roundScoreNum, { color: COLORS.accent }]}>{playerTotal.toLocaleString()}</Text>
          <Text style={styles.roundVs}>—</Text>
          <Text style={[styles.roundScoreNum, { color: '#FF8888' }]}>{oppTotal.toLocaleString()}</Text>
          <Text style={styles.roundScoreLbl}>CPU</Text>
        </View>
        {!isLast && <Text style={styles.roundNext}>NEXT ROUND →</Text>}
      </View>
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
export default function AdventureBossScreen({ route, navigation }) {
  const { vsId } = route.params;
  const vs = getVsBattle(vsId);
  const { selectedChar, clearVsBattle } = useGameStore();

  const playerChar = getCharDef(selectedChar);
  const cpuCharKey = CPU_CHARS[vsId] ?? 'p2';
  const cpuCharDef = getCharDef(cpuCharKey);
  const oppCfg     = DIFF_CFG[vs?.difficulty ?? 'easy'];

  // Per-round score (resets each round)
  const [roundPlayerScore, setRoundPlayerScore] = useState(0);
  const [roundOppScore,    setRoundOppScore]    = useState(0);
  // Accumulated totals
  const [playerTotal, setPlayerTotal] = useState(0);
  const [oppTotal,    setOppTotal]    = useState(0);

  const [timeLeft, setTimeLeft] = useState(ROUND_TIME);
  const [round,    setRound]    = useState(1);
  // phase: 'playing' | 'paused' | 'roundEnd' | 'done'
  const [phase,    setPhase]    = useState('playing');
  const [combo,    setCombo]    = useState(0);
  const [gridKey,  setGridKey]  = useState(0);

  const timerRef       = useRef(null);
  const oppRef         = useRef(null);
  const appStateRef    = useRef(AppState.currentState);
  const roundPlayerRef = useRef(0);
  const roundOppRef    = useRef(0);
  const playerTotalRef = useRef(0);
  const oppTotalRef    = useRef(0);
  // Timer pulse
  const timerPulse     = useRef(new Animated.Value(1)).current;
  const timerPulseLoop = useRef(null);

  const maxBar = Math.max(roundPlayerScore, roundOppScore, 200);

  // ─── Timer ───────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'playing') { clearInterval(timerRef.current); return; }
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timerRef.current); endRound(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase]);

  // ─── CPU opponent ────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'playing') { clearInterval(oppRef.current); return; }
    oppRef.current = setInterval(() => {
      const pts = Math.floor(randBetween(oppCfg.min, oppCfg.max));
      setRoundOppScore(prev => { const n = prev + pts; roundOppRef.current = n; return n; });
    }, 1000);
    return () => clearInterval(oppRef.current);
  }, [phase]);

  // ─── Timer pulse ─────────────────────────────────────────────
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

  // ─── Pause on app background ─────────────────────────────────
  useEffect(() => {
    const sub = AppState.addEventListener('change', next => {
      if (appStateRef.current === 'active' && next !== 'active')
        if (phase === 'playing') setPhase('paused');
      appStateRef.current = next;
    });
    return () => sub.remove();
  }, [phase]);

  // ─── End a round ─────────────────────────────────────────────
  const endRound = useCallback(() => {
    const rp = roundPlayerRef.current;
    const ro = roundOppRef.current;
    const newPlayerTotal = playerTotalRef.current + rp;
    const newOppTotal    = oppTotalRef.current + ro;
    playerTotalRef.current = newPlayerTotal;
    oppTotalRef.current    = newOppTotal;
    setPlayerTotal(newPlayerTotal);
    setOppTotal(newOppTotal);
    setPhase('roundEnd');
  }, []);

  // ─── Advance after round end ──────────────────────────────────
  useEffect(() => {
    if (phase !== 'roundEnd') return;
    const isLast = round >= TOTAL_ROUNDS;
    const delay = isLast ? 2200 : 1800;
    const t = setTimeout(() => {
      if (isLast) {
        setPhase('done');
      } else {
        // Reset for next round
        setRound(r => r + 1);
        setRoundPlayerScore(0);
        setRoundOppScore(0);
        roundPlayerRef.current = 0;
        roundOppRef.current    = 0;
        setTimeLeft(ROUND_TIME);
        setGridKey(k => k + 1);
        setPhase('playing');
      }
    }, delay);
    return () => clearTimeout(t);
  }, [phase, round]);

  // ─── Navigate to result ───────────────────────────────────────
  useEffect(() => {
    if (phase !== 'done') return;
    const pt = playerTotalRef.current;
    const ot = oppTotalRef.current;
    const won = pt > ot;
    if (won) clearVsBattle(vsId);
    setTimeout(() => {
      navigation.replace('AdventureBossResult', {
        vsId, won,
        playerScore: pt,
        oppScore:    ot,
        unlocksChar: vs?.unlocksChar,
        charName:    vs?.charName,
      });
    }, 300);
  }, [phase]);

  const handleScore = useCallback(pts => {
    setRoundPlayerScore(prev => { const n = prev + pts; roundPlayerRef.current = n; return n; });
  }, []);
  const handleCombo = useCallback(level => {
    setCombo(level); setTimeout(() => setCombo(0), 1000);
  }, []);

  const timerColor = timeLeft <= 10 ? COLORS.timerDanger : COLORS.text;

  // Combo toast
  const comboOpacity = useRef(new Animated.Value(0)).current;
  const comboScale   = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    if (combo === 0) return;
    comboOpacity.setValue(1); comboScale.setValue(0.5);
    Animated.spring(comboScale, { toValue: 1, friction: 4, useNativeDriver: true }).start();
    const t = setTimeout(() => Animated.timing(comboOpacity, { toValue: 0, duration: 400, useNativeDriver: true }).start(), 600);
    return () => clearTimeout(t);
  }, [combo]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      {/* ── Header ──────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setPhase('paused')} style={styles.pauseBtn2}>
          <Text style={styles.pauseIcon}>⏸</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.vsLabel}>VS BATTLE</Text>
          <Text style={styles.vsSub}>ROUND {round} / {TOTAL_ROUNDS}</Text>
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

      {/* ── HUD ─────────────────────────────────────────────── */}
      <View style={styles.hud}>
        <View style={styles.hudSide}>
          <CrabSprite phase={playerChar.phase} char={playerChar.char} size={28} />
          <View style={styles.hudMeta}>
            <Text style={styles.hudName}>YOU</Text>
            <Text style={styles.hudScore}>{roundPlayerScore.toLocaleString()}</Text>
            <Text style={styles.hudTotal}>TOTAL: {playerTotal.toLocaleString()}</Text>
          </View>
        </View>
        <Text style={styles.hudVs}>VS</Text>
        <View style={[styles.hudSide, { flexDirection: 'row-reverse' }]}>
          <CrabSprite phase={cpuCharDef.phase} char={cpuCharDef.char} size={28} facingLeft />
          <View style={[styles.hudMeta, { alignItems: 'flex-end' }]}>
            <Text style={styles.hudName}>CPU</Text>
            <Text style={[styles.hudScore, { color: '#FF8888' }]}>{roundOppScore.toLocaleString()}</Text>
            <Text style={[styles.hudTotal, { color: '#FF8888' }]}>TOTAL: {oppTotal.toLocaleString()}</Text>
          </View>
        </View>
      </View>

      {/* ── Score bars ──────────────────────────────────────── */}
      <View style={styles.barsRow}>
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${Math.min(roundPlayerScore / maxBar, 1) * 100}%`, backgroundColor: COLORS.accent }]} />
        </View>
        <View style={[styles.barTrack, { flexDirection: 'row-reverse' }]}>
          <View style={[styles.barFill, { width: `${Math.min(roundOppScore / maxBar, 1) * 100}%`, backgroundColor: '#FF6666' }]} />
        </View>
      </View>

      {/* ── Combo toast ─────────────────────────────────────── */}
      {combo > 0 && (
        <Animated.View style={[styles.combo, { opacity: comboOpacity, transform: [{ scale: comboScale }] }]}>
          <Text style={styles.comboText}>COMBO ×{combo + 1}</Text>
        </Animated.View>
      )}

      {/* ── Grid ────────────────────────────────────────────── */}
      <View style={styles.gridWrap}>
        <PuzzleGrid
          key={gridKey}
          hard={vs?.difficulty === 'hard' || vs?.difficulty === 'superhard'}
          onScoreAdd={handleScore}
          onCombo={handleCombo}
          paused={phase !== 'playing'}
        />
      </View>

      {/* ── Ad banner ───────────────────────────────────────── */}
      <View style={styles.adBanner}>
        <Text style={styles.adText}>AD 320×100</Text>
      </View>

      {/* ── Round end overlay ───────────────────────────────── */}
      {phase === 'roundEnd' && (
        <RoundEndOverlay
          round={round}
          playerTotal={playerTotalRef.current}
          oppTotal={oppTotalRef.current}
          isLast={round >= TOTAL_ROUNDS}
        />
      )}

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

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  headerCenter: { alignItems: 'center', flex: 1 },
  vsLabel: { fontSize: 10, fontWeight: '900', color: COLORS.gold, letterSpacing: 2 },
  vsSub:   { fontSize: 8,  fontWeight: '700', color: COLORS.textDim, marginTop: 1 },
  pauseBtn2:  { padding: 6 },
  pauseIcon:  { fontSize: 18, color: COLORS.textDim },

  timerNum: {
    fontSize:    38,
    fontWeight:  '900',
    fontVariant: ['tabular-nums'],
    color:       COLORS.text,
    marginTop:   2,
  },
  timerNumDanger: {
    textShadowColor:  COLORS.timerDanger,
    textShadowRadius: 10,
    textShadowOffset: { width: 0, height: 0 },
  },

  hud: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 6,
  },
  hudSide:  { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  hudMeta:  { gap: 1 },
  hudName:  { fontSize: 9,  fontWeight: '800', color: COLORS.textDim, letterSpacing: 1 },
  hudScore: { fontSize: 14, fontWeight: '900', color: COLORS.text, fontVariant: ['tabular-nums'] },
  hudTotal: { fontSize: 9,  fontWeight: '700', color: COLORS.textDim, fontVariant: ['tabular-nums'] },
  hudVs:    { fontSize: 11, fontWeight: '900', color: COLORS.textDim, paddingHorizontal: 8 },

  barsRow: {
    flexDirection: 'row', gap: 6,
    paddingHorizontal: 14, marginBottom: 4,
  },
  barTrack: { flex: 1, height: 6, backgroundColor: COLORS.panel, borderRadius: 3, overflow: 'hidden', flexDirection: 'row' },
  barFill:  { height: '100%', borderRadius: 3 },

  gridWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  adBanner: { height: 50, backgroundColor: COLORS.panel, borderTopWidth: 1, borderTopColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  adText:   { fontSize: 10, color: COLORS.textDim },

  combo: {
    position: 'absolute', top: 160, alignSelf: 'center', zIndex: 99,
    backgroundColor: COLORS.gold, borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 6,
    shadowColor: COLORS.gold, shadowRadius: 12, shadowOpacity: 0.5, elevation: 10,
  },
  comboText: { fontSize: 14, fontWeight: '900', color: '#000', letterSpacing: 1 },

  // Round end overlay
  roundOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.82)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
  },
  roundBox: {
    width: 280,
    backgroundColor: COLORS.panel,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.gold,
    padding: 28,
    alignItems: 'center',
    gap: 12,
  },
  roundEndTitle: { fontSize: 14, fontWeight: '900', color: COLORS.gold, letterSpacing: 2 },
  roundAhead:    { fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  roundScoreRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  roundScoreLbl: { fontSize: 9, fontWeight: '800', color: COLORS.textDim, letterSpacing: 1 },
  roundScoreNum: { fontSize: 18, fontWeight: '900', fontVariant: ['tabular-nums'] },
  roundVs:       { fontSize: 11, fontWeight: '700', color: COLORS.textDim },
  roundNext:     { fontSize: 9, fontWeight: '800', color: COLORS.textDim, letterSpacing: 2, marginTop: 4 },

  pauseOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', alignItems: 'center', justifyContent: 'center' },
  pauseBox:     { width: 260, backgroundColor: COLORS.panel, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, padding: 28, alignItems: 'center', gap: 16 },
  pauseTitle:   { fontSize: 18, fontWeight: '900', color: COLORS.text, letterSpacing: 4, marginBottom: 4 },
  pauseBtn:     { width: '100%', paddingVertical: 14, borderRadius: 10, backgroundColor: COLORS.accent, alignItems: 'center' },
  pauseBtnText: { fontSize: 14, fontWeight: '900', color: '#FFF', letterSpacing: 2 },
  pauseSecBtn:  { width: '100%', paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  pauseSecBtnText: { fontSize: 12, fontWeight: '700', color: COLORS.textMid },
});
