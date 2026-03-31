import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, Animated,
} from 'react-native';
import PuzzleGrid from '../components/PuzzleGrid';
import CrabSprite from '../components/CrabSprite';
import { useGameStore } from '../store/gameStore';
import {
  EASY_BLOCKS, HARD_BLOCKS, TOTAL_ROUNDS, ROUND_TIME,
  OPP_EASY, OPP_HARD, COLORS, ALL_CHARS,
} from '../constants/gameConfig';

// ─── Helpers ────────────────────────────────────────────────────

function randBetween(min, max) {
  return min + Math.random() * (max - min);
}

function getCharDef(key) {
  return ALL_CHARS.find(c => c.key === key) ?? ALL_CHARS[0];
}

// ─── Sub-components ─────────────────────────────────────────────

function ScorePanel({ label, score, charDef, isPlayer }) {
  return (
    <View style={[styles.scorePanel, isPlayer && styles.scorePanelPlayer]}>
      <CrabSprite phase={charDef.phase} char={charDef.char} size={36} facingLeft={!isPlayer} />
      <View style={styles.scoreMeta}>
        <Text style={styles.scoreLabel}>{label}</Text>
        <Text style={styles.scoreValue}>{String(score).padStart(6, '0')}</Text>
      </View>
    </View>
  );
}

function RoundBar({ round, total }) {
  return (
    <View style={styles.roundBar}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[styles.roundDot, i < round && styles.roundDotFilled]}
        />
      ))}
    </View>
  );
}

function ComboToast({ combo }) {
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }),
      Animated.delay(600),
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  }, [combo]);

  if (combo === 0) return null;
  return (
    <Animated.View style={[styles.comboToast, { opacity }]}>
      <Text style={styles.comboText}>COMBO ×{combo + 1}!</Text>
    </Animated.View>
  );
}

// ─── Main ───────────────────────────────────────────────────────

export default function GameScreen({ navigation }) {
  const { difficulty, selectedChar, recordResult } = useGameStore();
  const blockDefs = difficulty === 'hard' ? HARD_BLOCKS : EASY_BLOCKS;

  // Static opponent character (always P3 or P2 depending on difficulty)
  const oppCharDef = difficulty === 'hard'
    ? { phase: 3, char: 'power', key: 'power' }
    : { phase: 2, char: null,    key: 'p2'    };

  const playerCharDef = getCharDef(selectedChar);

  // ─── Round state ──────────────────────────────────────────────
  const [round,         setRound]         = useState(1);
  const [timeLeft,      setTimeLeft]      = useState(ROUND_TIME);
  const [playerScore,   setPlayerScore]   = useState(0);
  const [oppScore,      setOppScore]      = useState(0);
  const [totalPlayer,   setTotalPlayer]   = useState(0);
  const [totalOpp,      setTotalOpp]      = useState(0);
  const [roundScores,   setRoundScores]   = useState([]);
  const [phase,         setPhase]         = useState('playing'); // playing | roundEnd | done
  const [combo,         setCombo]         = useState(0);
  const [paused,        setPaused]        = useState(false);
  const [gridKey,       setGridKey]       = useState(0); // remount grid to reset

  const timerRef  = useRef(null);
  const oppRef    = useRef(null);
  const comboRef  = useRef(0);

  // ─── Timer ────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'playing') return;

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          endRound();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [phase, round]);

  // ─── Opponent scoring ─────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'playing') return;
    const cfg = difficulty === 'hard' ? OPP_HARD : OPP_EASY;

    oppRef.current = setInterval(() => {
      const pts = Math.floor(randBetween(cfg.min, cfg.max));
      setOppScore(prev => prev + pts);
    }, 1000);

    return () => clearInterval(oppRef.current);
  }, [phase, round, difficulty]);

  // ─── End of a round ──────────────────────────────────────────
  const endRound = useCallback(() => {
    clearInterval(timerRef.current);
    clearInterval(oppRef.current);
    setPaused(true);
    setPhase('roundEnd');

    setTotalPlayer(prev => prev + playerScore);
    setTotalOpp(prev    => prev + oppScore);
    setRoundScores(prev => [...prev, { player: playerScore, opp: oppScore }]);

    setTimeout(() => {
      if (round >= TOTAL_ROUNDS) {
        setPhase('done');
      } else {
        // Next round
        setRound(r => r + 1);
        setPlayerScore(0);
        setOppScore(0);
        setTimeLeft(ROUND_TIME);
        setGridKey(k => k + 1);
        setPhase('playing');
        setPaused(false);
      }
    }, 1800);
  }, [round, playerScore, oppScore]);

  // ─── Game over: navigate to result ───────────────────────────
  useEffect(() => {
    if (phase !== 'done') return;

    const finalPlayer = totalPlayer + playerScore;
    const finalOpp    = totalOpp    + oppScore;
    const won         = finalPlayer > finalOpp;

    recordResult({
      won,
      hard:  difficulty === 'hard',
      score: finalPlayer,
    });

    setTimeout(() => {
      navigation.replace('Result', {
        playerScore: finalPlayer,
        oppScore:    finalOpp,
        won,
        roundScores,
        difficulty,
        selectedChar,
      });
    }, 500);
  }, [phase]);

  // ─── Score callback from grid ─────────────────────────────────
  const handleScoreAdd = useCallback((pts) => {
    setPlayerScore(prev => prev + pts);
  }, []);

  const handleCombo = useCallback((level) => {
    comboRef.current = level;
    setCombo(level);
    setTimeout(() => setCombo(0), 1000);
  }, []);

  // ─── Timer color ─────────────────────────────────────────────
  const timerColor = timeLeft <= 10 ? COLORS.lose : timeLeft <= 20 ? COLORS.gold : COLORS.text;

  // ─── Render ──────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>

      {/* Top HUD */}
      <View style={styles.hud}>
        <ScorePanel
          label="YOU"
          score={playerScore}
          charDef={playerCharDef}
          isPlayer
        />
        <View style={styles.hudCenter}>
          <Text style={[styles.timer, { color: timerColor }]}>
            {String(timeLeft).padStart(2, '0')}
          </Text>
          <RoundBar round={round} total={TOTAL_ROUNDS} />
          <Text style={styles.roundLabel}>RD {round}/{TOTAL_ROUNDS}</Text>
        </View>
        <ScorePanel
          label="CPU"
          score={oppScore}
          charDef={oppCharDef}
        />
      </View>

      {/* Combo toast */}
      <ComboToast key={combo} combo={combo} />

      {/* Puzzle grid */}
      <View style={styles.gridWrap}>
        <PuzzleGrid
          key={gridKey}
          blockDefs={blockDefs}
          onScoreAdd={handleScoreAdd}
          onCombo={handleCombo}
          paused={paused || phase !== 'playing'}
        />
      </View>

      {/* Total score strip */}
      <View style={styles.totalStrip}>
        <Text style={styles.totalLabel}>TOTAL</Text>
        <Text style={[styles.totalVal, { color: COLORS.accent }]}>
          {String(totalPlayer + playerScore).padStart(7, '0')}
        </Text>
        <Text style={styles.totalSep}>vs</Text>
        <Text style={[styles.totalVal, { color: '#FF6666' }]}>
          {String(totalOpp + oppScore).padStart(7, '0')}
        </Text>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex:            1,
    backgroundColor: COLORS.bg,
  },
  hud: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'space-between',
    paddingHorizontal: 10,
    paddingVertical:   8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  scorePanel: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             6,
    flex:            1,
  },
  scorePanelPlayer: {
    justifyContent: 'flex-start',
  },
  scoreMeta: {
    gap: 2,
  },
  scoreLabel: {
    fontFamily: 'PressStart2P',
    fontSize:   7,
    color:      COLORS.textDim,
  },
  scoreValue: {
    fontFamily: 'PressStart2P',
    fontSize:   11,
    color:      COLORS.text,
  },
  hudCenter: {
    alignItems: 'center',
    gap:        4,
  },
  timer: {
    fontFamily: 'PressStart2P',
    fontSize:   24,
  },
  roundBar: {
    flexDirection: 'row',
    gap:           6,
  },
  roundDot: {
    width:        10,
    height:       10,
    borderRadius: 5,
    borderWidth:  1,
    borderColor:  COLORS.border,
    backgroundColor: 'transparent',
  },
  roundDotFilled: {
    backgroundColor: COLORS.accent,
    borderColor:     COLORS.accent,
  },
  roundLabel: {
    fontFamily: 'PressStart2P',
    fontSize:   7,
    color:      COLORS.textDim,
  },
  gridWrap: {
    flex:            1,
    alignItems:      'center',
    justifyContent:  'center',
  },
  totalStrip: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    gap:             8,
    paddingVertical: 8,
    borderTopWidth:  1,
    borderTopColor:  COLORS.border,
  },
  totalLabel: {
    fontFamily: 'PressStart2P',
    fontSize:   8,
    color:      COLORS.textDim,
  },
  totalVal: {
    fontFamily: 'PressStart2P',
    fontSize:   11,
  },
  totalSep: {
    fontFamily: 'PressStart2P',
    fontSize:   8,
    color:      COLORS.textDim,
  },
  comboToast: {
    position:        'absolute',
    top:             80,
    alignSelf:       'center',
    zIndex:          99,
    backgroundColor: COLORS.gold,
    borderRadius:    6,
    paddingHorizontal: 14,
    paddingVertical:   6,
  },
  comboText: {
    fontFamily: 'PressStart2P',
    fontSize:   13,
    color:      '#000',
  },
});
