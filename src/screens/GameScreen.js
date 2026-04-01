/**
 * GameScreen v2 — Battle layout
 *
 * Layout:
 *  ┌──────────────────────────────────┐
 *  │ [YOU crab] SCORE  ⏱  SCORE [CPU]│
 *  │ ████████████░░░ vs ████████░░░░░│
 *  │                                  │
 *  │          ┌──────────┐            │
 *  │          │ 7×8 GRID │            │
 *  │          └──────────┘            │
 *  │                                  │
 *  │     RD ●●○  │  COMBO x3!        │
 *  └──────────────────────────────────┘
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, Animated,
} from 'react-native';
import PuzzleGrid from '../components/PuzzleGrid';
import CrabSprite from '../components/CrabSprite';
import { useGameStore } from '../store/gameStore';
import {
  TOTAL_ROUNDS, ROUND_TIME, OPP_EASY, OPP_HARD,
  COLORS, ALL_CHARS,
} from '../constants/gameConfig';

function randBetween(a, b) { return a + Math.random() * (b - a); }
function getCharDef(key) { return ALL_CHARS.find(c => c.key === key) ?? ALL_CHARS[0]; }

// Random opponent character (always P3)
const OPP_CHARS = ['chip', 'wing', 'gentle', 'power', 'pink', 'robot'];
function randomOppChar() { return OPP_CHARS[Math.floor(Math.random() * OPP_CHARS.length)]; }

// ─── Score bar ──────────────────────────────────────────────────

function ScoreBar({ score, maxScore, color, align }) {
  const pct = Math.min(score / Math.max(maxScore, 1), 1);
  return (
    <View style={[styles.barTrack, align === 'right' && { flexDirection: 'row-reverse' }]}>
      <View style={[styles.barFill, { width: `${pct * 100}%`, backgroundColor: color }]} />
    </View>
  );
}

// ─── Combo toast ────────────────────────────────────────────────

function ComboToast({ combo }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale   = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    if (combo === 0) return;
    Animated.parallel([
      Animated.spring(scale,   { toValue: 1, friction: 4, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start(() => {
      setTimeout(() => {
        Animated.timing(opacity, { toValue: 0, duration: 400, useNativeDriver: true }).start();
      }, 600);
    });
  }, [combo]);

  if (combo === 0) return null;
  return (
    <Animated.View style={[styles.combo, { opacity, transform: [{ scale }] }]}>
      <Text style={styles.comboText}>COMBO ×{combo + 1}</Text>
    </Animated.View>
  );
}

// ─── Main ───────────────────────────────────────────────────────

export default function GameScreen({ navigation }) {
  const { selectedChar, recordResult } = useGameStore();

  const playerChar = getCharDef(selectedChar);
  const [oppChar]  = useState(() => randomOppChar());
  const oppCharDef = { phase: 3, char: oppChar };

  // State
  const [round,       setRound]       = useState(1);
  const [timeLeft,    setTimeLeft]    = useState(ROUND_TIME);
  const [playerScore, setPlayerScore] = useState(0);
  const [oppScore,    setOppScore]    = useState(0);
  const [totalPlayer, setTotalPlayer] = useState(0);
  const [totalOpp,    setTotalOpp]    = useState(0);
  const [roundScores, setRoundScores] = useState([]);
  const [phase,       setPhase]       = useState('playing');
  const [combo,       setCombo]       = useState(0);
  const [gridKey,     setGridKey]     = useState(0);

  const timerRef = useRef(null);
  const oppRef   = useRef(null);

  // Max score for bar sizing (dynamic, tracks the higher scorer)
  const maxBar = Math.max(playerScore, oppScore, 200);

  // ─── Timer ────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'playing') return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timerRef.current); endRound(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase, round]);

  // ─── Opponent ─────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'playing') return;
    oppRef.current = setInterval(() => {
      setOppScore(prev => prev + Math.floor(randBetween(OPP_EASY.min, OPP_EASY.max)));
    }, 1000);
    return () => clearInterval(oppRef.current);
  }, [phase, round]);

  // ─── End round ────────────────────────────────────────────────
  const endRound = useCallback(() => {
    clearInterval(timerRef.current);
    clearInterval(oppRef.current);
    setPhase('roundEnd');

    setTotalPlayer(p => p + playerScore);
    setTotalOpp(p    => p + oppScore);
    setRoundScores(p => [...p, { player: playerScore, opp: oppScore }]);

    setTimeout(() => {
      if (round >= TOTAL_ROUNDS) {
        setPhase('done');
      } else {
        setRound(r => r + 1);
        setPlayerScore(0);
        setOppScore(0);
        setTimeLeft(ROUND_TIME);
        setGridKey(k => k + 1);
        setPhase('playing');
      }
    }, 1500);
  }, [round, playerScore, oppScore]);

  // ─── Game over ────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'done') return;
    const fp = totalPlayer + playerScore;
    const fo = totalOpp    + oppScore;
    const won = fp > fo;
    recordResult({ won, score: fp });
    setTimeout(() => {
      navigation.replace('Result', {
        playerScore: fp, oppScore: fo, won, roundScores, selectedChar,
      });
    }, 500);
  }, [phase]);

  // ─── Callbacks ────────────────────────────────────────────────
  const handleScore = useCallback(pts => setPlayerScore(p => p + pts), []);
  const handleCombo = useCallback(level => { setCombo(level); setTimeout(() => setCombo(0), 1000); }, []);

  // Timer color
  const timerColor = timeLeft <= 5 ? COLORS.timerDanger
                   : timeLeft <= 10 ? COLORS.timerWarn
                   : COLORS.text;

  return (
    <SafeAreaView style={styles.safe}>
      {/* ── Battle HUD ──────────────────────────────────────── */}
      <View style={styles.hud}>
        {/* Player side */}
        <View style={styles.hudSide}>
          <CrabSprite phase={playerChar.phase} char={playerChar.char} size={32} />
          <View style={styles.hudMeta}>
            <Text style={styles.hudName}>YOU</Text>
            <Text style={styles.hudScore}>{playerScore.toLocaleString()}</Text>
          </View>
        </View>

        {/* Center timer */}
        <View style={styles.hudCenter}>
          <Text style={[styles.timer, { color: timerColor }]}>{timeLeft}</Text>
          <View style={styles.roundDots}>
            {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => (
              <View key={i} style={[styles.dot, i < round && styles.dotActive]} />
            ))}
          </View>
        </View>

        {/* Opponent side */}
        <View style={[styles.hudSide, { flexDirection: 'row-reverse' }]}>
          <CrabSprite phase={oppCharDef.phase} char={oppCharDef.char} size={32} facingLeft />
          <View style={[styles.hudMeta, { alignItems: 'flex-end' }]}>
            <Text style={styles.hudName}>CPU</Text>
            <Text style={[styles.hudScore, { color: '#FF8888' }]}>{oppScore.toLocaleString()}</Text>
          </View>
        </View>
      </View>

      {/* ── Score bars ──────────────────────────────────────── */}
      <View style={styles.barsRow}>
        <ScoreBar score={playerScore} maxScore={maxBar} color={COLORS.accent} align="left" />
        <Text style={styles.vs}>VS</Text>
        <ScoreBar score={oppScore}    maxScore={maxBar} color="#FF6666"       align="right" />
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
        />
      </View>

      {/* ── Bottom info ─────────────────────────────────────── */}
      <View style={styles.bottomBar}>
        <Text style={styles.totalLabel}>TOTAL</Text>
        <Text style={[styles.totalVal, { color: COLORS.accent }]}>
          {(totalPlayer + playerScore).toLocaleString()}
        </Text>
        <Text style={styles.totalSep}>:</Text>
        <Text style={[styles.totalVal, { color: '#FF8888' }]}>
          {(totalOpp + oppScore).toLocaleString()}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },

  // HUD
  hud: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'space-between',
    paddingHorizontal: 12,
    paddingVertical:   6,
  },
  hudSide: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           6,
    flex:          1,
  },
  hudMeta:  { gap: 1 },
  hudName:  { fontSize: 10, fontWeight: '800', color: COLORS.textDim, letterSpacing: 1 },
  hudScore: { fontSize: 16, fontWeight: '900', color: COLORS.text, fontVariant: ['tabular-nums'] },
  hudCenter: { alignItems: 'center', gap: 2, paddingHorizontal: 8 },
  timer: { fontSize: 28, fontWeight: '900', fontVariant: ['tabular-nums'] },
  roundDots: { flexDirection: 'row', gap: 5 },
  dot:       { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.border },
  dotActive: { backgroundColor: COLORS.accent },

  // Score bars
  barsRow: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: 12,
    gap:               6,
    marginBottom:      4,
  },
  barTrack: {
    flex:            1,
    height:          6,
    backgroundColor: COLORS.panel,
    borderRadius:    3,
    overflow:        'hidden',
    flexDirection:   'row',
  },
  barFill: { height: '100%', borderRadius: 3 },
  vs: { fontSize: 10, fontWeight: '900', color: COLORS.textDim },

  // Grid
  gridWrap: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
  },

  // Bottom
  bottomBar: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    gap:             8,
    paddingVertical: 8,
    borderTopWidth:  1,
    borderTopColor:  COLORS.border,
  },
  totalLabel: { fontSize: 10, fontWeight: '800', color: COLORS.textDim },
  totalVal:   { fontSize: 14, fontWeight: '900', fontVariant: ['tabular-nums'] },
  totalSep:   { fontSize: 12, fontWeight: '900', color: COLORS.textDim },

  // Combo
  combo: {
    position:     'absolute',
    top:          90,
    alignSelf:    'center',
    zIndex:       99,
    backgroundColor: COLORS.gold,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical:   6,
    shadowColor:  COLORS.gold,
    shadowRadius: 12,
    shadowOpacity: 0.5,
    elevation:    10,
  },
  comboText: { fontSize: 14, fontWeight: '900', color: '#000', letterSpacing: 1 },
});
