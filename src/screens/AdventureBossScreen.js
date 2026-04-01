/**
 * AdventureBossScreen — VS battle at the end of each Adventure zone
 *
 * Single round, 30 seconds. Player must outscore CPU to win.
 * Winning unlocks a new character.
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

const OPP_NORMAL = { min: 10, max: 25 };
const DIFF_CFG = { easy: OPP_EASY, normal: OPP_NORMAL, hard: OPP_HARD };

function randBetween(a, b) { return a + Math.random() * (b - a); }
function getCharDef(key) { return ALL_CHARS.find(c => c.key === key) ?? ALL_CHARS[0]; }

// Fixed CPU characters per VS battle
const CPU_CHARS = { vs1: 'p2', vs2: 'chip', vs3: 'wing', vs4: 'gentle', vs5: 'power', vs6: 'pink', vs7: 'pyramid' };

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

  const [playerScore, setPlayerScore] = useState(0);
  const [oppScore,    setOppScore]    = useState(0);
  const [timeLeft,    setTimeLeft]    = useState(ROUND_TIME);
  const [phase,       setPhase]       = useState('playing'); // 'playing'|'paused'|'done'
  const [combo,       setCombo]       = useState(0);

  const timerRef    = useRef(null);
  const oppRef      = useRef(null);
  const appStateRef = useRef(AppState.currentState);
  const playerRef   = useRef(0);

  const maxBar = Math.max(playerScore, oppScore, 200);

  // ─── Timer ───────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'playing') { clearInterval(timerRef.current); return; }
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timerRef.current); setPhase('done'); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase]);

  // ─── CPU opponent ────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'playing') { clearInterval(oppRef.current); return; }
    oppRef.current = setInterval(() => {
      setOppScore(prev => prev + Math.floor(randBetween(oppCfg.min, oppCfg.max)));
    }, 1000);
    return () => clearInterval(oppRef.current);
  }, [phase]);

  // ─── Pause on app background ─────────────────────────────────
  useEffect(() => {
    const sub = AppState.addEventListener('change', next => {
      if (appStateRef.current === 'active' && next !== 'active')
        if (phase === 'playing') setPhase('paused');
      appStateRef.current = next;
    });
    return () => sub.remove();
  }, [phase]);

  // ─── Navigate to result when done ────────────────────────────
  useEffect(() => {
    if (phase !== 'done') return;
    const fp = playerRef.current;
    const won = fp > oppScore;
    if (won) clearVsBattle(vsId);
    setTimeout(() => {
      navigation.replace('AdventureBossResult', {
        vsId, won,
        playerScore: fp,
        oppScore,
        unlocksChar:  vs?.unlocksChar,
        charName:     vs?.charName,
      });
    }, 300);
  }, [phase]);

  const handleScore = useCallback(pts => {
    setPlayerScore(prev => { const n = prev + pts; playerRef.current = n; return n; });
  }, []);
  const handleCombo = useCallback(level => {
    setCombo(level); setTimeout(() => setCombo(0), 1000);
  }, []);

  const timerColor = timeLeft <= 5  ? COLORS.timerDanger
                   : timeLeft <= 10 ? COLORS.timerWarn
                   : COLORS.text;

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
          <Text style={styles.vsSub}>Beat the CPU to unlock {vs?.charName}!</Text>
        </View>
        <View style={[styles.timerBox, timeLeft <= 10 && styles.timerBoxWarn]}>
          <Text style={[styles.timerNum, { color: timerColor }]}>{timeLeft}</Text>
        </View>
      </View>

      {/* ── HUD ─────────────────────────────────────────────── */}
      <View style={styles.hud}>
        <View style={styles.hudSide}>
          <CrabSprite phase={playerChar.phase} char={playerChar.char} size={28} />
          <View style={styles.hudMeta}>
            <Text style={styles.hudName}>YOU</Text>
            <Text style={styles.hudScore}>{playerScore.toLocaleString()}</Text>
          </View>
        </View>
        <Text style={styles.hudVs}>VS</Text>
        <View style={[styles.hudSide, { flexDirection: 'row-reverse' }]}>
          <CrabSprite phase={cpuCharDef.phase} char={cpuCharDef.char} size={28} facingLeft />
          <View style={[styles.hudMeta, { alignItems: 'flex-end' }]}>
            <Text style={styles.hudName}>CPU</Text>
            <Text style={[styles.hudScore, { color: '#FF8888' }]}>{oppScore.toLocaleString()}</Text>
          </View>
        </View>
      </View>

      {/* ── Score bars ──────────────────────────────────────── */}
      <View style={styles.barsRow}>
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${Math.min(playerScore / maxBar, 1) * 100}%`, backgroundColor: COLORS.accent }]} />
        </View>
        <View style={[styles.barTrack, { flexDirection: 'row-reverse' }]}>
          <View style={[styles.barFill, { width: `${Math.min(oppScore / maxBar, 1) * 100}%`, backgroundColor: '#FF6666' }]} />
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
          hard={vs?.difficulty === 'hard'}
          onScoreAdd={handleScore}
          onCombo={handleCombo}
          paused={phase !== 'playing'}
        />
      </View>

      {/* ── Ad banner ───────────────────────────────────────── */}
      <View style={styles.adBanner}>
        <Text style={styles.adText}>AD 320×100</Text>
      </View>

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
    paddingHorizontal: 14, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  headerCenter: { alignItems: 'center', flex: 1 },
  vsLabel: { fontSize: 13, fontWeight: '900', color: COLORS.gold, letterSpacing: 2 },
  vsSub:   { fontSize: 8,  fontWeight: '600', color: COLORS.textDim, marginTop: 2 },
  pauseBtn2:  { padding: 6 },
  pauseIcon:  { fontSize: 18, color: COLORS.textDim },
  timerBox:   { minWidth: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border },
  timerBoxWarn: { borderColor: COLORS.timerWarn },
  timerNum:   { fontSize: 22, fontWeight: '900', fontVariant: ['tabular-nums'] },

  hud: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 8,
  },
  hudSide:  { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  hudMeta:  { gap: 1 },
  hudName:  { fontSize: 9,  fontWeight: '800', color: COLORS.textDim, letterSpacing: 1 },
  hudScore: { fontSize: 15, fontWeight: '900', color: COLORS.text, fontVariant: ['tabular-nums'] },
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

  pauseOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', alignItems: 'center', justifyContent: 'center' },
  pauseBox:     { width: 260, backgroundColor: COLORS.panel, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, padding: 28, alignItems: 'center', gap: 16 },
  pauseTitle:   { fontSize: 18, fontWeight: '900', color: COLORS.text, letterSpacing: 4, marginBottom: 4 },
  pauseBtn:     { width: '100%', paddingVertical: 14, borderRadius: 10, backgroundColor: COLORS.accent, alignItems: 'center' },
  pauseBtnText: { fontSize: 14, fontWeight: '900', color: '#FFF', letterSpacing: 2 },
  pauseSecBtn:  { width: '100%', paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  pauseSecBtnText: { fontSize: 12, fontWeight: '700', color: COLORS.textMid },
});
