import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, Animated,
} from 'react-native';
import CrabSprite from '../components/CrabSprite';
import { useGameStore } from '../store/gameStore';
import {
  COLORS, ALL_CHARS,
  UNLOCK_P2_AT, UNLOCK_P3_AT, UNLOCK_PYRAMID_AT,
} from '../constants/gameConfig';

function getCharDef(key) {
  return ALL_CHARS.find(c => c.key === key) ?? ALL_CHARS[0];
}

function getUnlockMessage(totalWins, hardWins, won) {
  if (!won) return null;
  if (totalWins === UNLOCK_P2_AT)      return 'Core UNLOCKED!';
  if (totalWins === UNLOCK_P3_AT)      return 'Phase 3 chars UNLOCKED!';
  if (hardWins  === UNLOCK_PYRAMID_AT) return '★ PYRAMID UNLOCKED! ★';
  return null;
}

export default function ResultScreen({ route, navigation }) {
  const { playerScore, oppScore, won, roundScores, difficulty, selectedChar } = route.params;
  const { totalWins, hardWins } = useGameStore();

  const playerCharDef = getCharDef(selectedChar);
  const unlockMsg     = getUnlockMessage(totalWins, hardWins, won);

  // Animate result banner
  const scale = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.spring(scale, {
      toValue:  1,
      friction: 4,
      tension:  80,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>

        {/* WIN / LOSE banner */}
        <Animated.View style={[styles.banner, { transform: [{ scale }] }]}>
          <Text style={[styles.bannerText, { color: won ? COLORS.win : COLORS.lose }]}>
            {won ? 'YOU WIN!' : 'YOU LOSE'}
          </Text>
          <CrabSprite
            phase={playerCharDef.phase}
            char={playerCharDef.char}
            size={72}
          />
        </Animated.View>

        {/* Unlock message */}
        {unlockMsg && (
          <View style={styles.unlockBadge}>
            <Text style={styles.unlockText}>{unlockMsg}</Text>
          </View>
        )}

        {/* Score table */}
        <View style={styles.scoreTable}>
          <View style={styles.scoreRow}>
            <Text style={styles.scoreHead}>RD</Text>
            <Text style={styles.scoreHead}>YOU</Text>
            <Text style={styles.scoreHead}>CPU</Text>
          </View>
          {roundScores.map((rs, i) => (
            <View key={i} style={styles.scoreRow}>
              <Text style={styles.scoreCell}>{i + 1}</Text>
              <Text style={[styles.scoreCell, rs.player > rs.opp && styles.winCell]}>
                {String(rs.player).padStart(6, '0')}
              </Text>
              <Text style={[styles.scoreCell, rs.opp > rs.player && styles.loseCell]}>
                {String(rs.opp).padStart(6, '0')}
              </Text>
            </View>
          ))}
          <View style={[styles.scoreRow, styles.totalRow]}>
            <Text style={styles.scoreHead}>TOT</Text>
            <Text style={[styles.scoreHead, { color: COLORS.accent }]}>
              {String(playerScore).padStart(6, '0')}
            </Text>
            <Text style={[styles.scoreHead, { color: '#FF6666' }]}>
              {String(oppScore).padStart(6, '0')}
            </Text>
          </View>
        </View>

        {/* Buttons */}
        <TouchableOpacity
          style={[styles.btn, styles.btnPrimary]}
          onPress={() => navigation.replace('Game')}
        >
          <Text style={styles.btnText}>PLAY AGAIN</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, styles.btnSecondary]}
          onPress={() => navigation.navigate('Difficulty')}
        >
          <Text style={styles.btnText}>CHANGE MODE</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate('Title')}
        >
          <Text style={styles.home}>← HOME</Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  container: {
    flex:            1,
    alignItems:      'center',
    justifyContent:  'center',
    gap:             20,
    paddingHorizontal: 24,
  },
  banner: {
    alignItems: 'center',
    gap:        10,
  },
  bannerText: {
    fontFamily:    'PressStart2P',
    fontSize:      26,
    letterSpacing: 2,
  },
  unlockBadge: {
    backgroundColor: COLORS.gold,
    borderRadius:    8,
    paddingHorizontal: 16,
    paddingVertical:   8,
  },
  unlockText: {
    fontFamily: 'PressStart2P',
    fontSize:   10,
    color:      '#000',
  },
  scoreTable: {
    width:        '100%',
    borderWidth:  1,
    borderColor:  COLORS.border,
    borderRadius: 6,
    overflow:     'hidden',
  },
  scoreRow: {
    flexDirection:   'row',
    justifyContent:  'space-between',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  totalRow: {
    backgroundColor: COLORS.panel,
    borderBottomWidth: 0,
  },
  scoreHead: {
    fontFamily: 'PressStart2P',
    fontSize:   9,
    color:      COLORS.textDim,
    width:      80,
    textAlign:  'center',
  },
  scoreCell: {
    fontFamily: 'PressStart2P',
    fontSize:   9,
    color:      COLORS.text,
    width:      80,
    textAlign:  'center',
  },
  winCell:  { color: COLORS.win  },
  loseCell: { color: COLORS.lose },
  btn: {
    width:           '100%',
    paddingVertical: 14,
    borderRadius:    6,
    borderWidth:     2,
    alignItems:      'center',
  },
  btnPrimary: {
    backgroundColor: COLORS.accent,
    borderColor:     COLORS.accent,
  },
  btnSecondary: {
    backgroundColor: 'transparent',
    borderColor:     COLORS.border,
  },
  btnText: {
    fontFamily: 'PressStart2P',
    fontSize:   12,
    color:      COLORS.text,
  },
  home: {
    fontFamily: 'PressStart2P',
    fontSize:   9,
    color:      COLORS.textDim,
  },
});
