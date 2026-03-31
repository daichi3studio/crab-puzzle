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

function getCharDef(key) { return ALL_CHARS.find(c => c.key === key) ?? ALL_CHARS[0]; }

function getUnlockMsg(totalWins, hardWins, won) {
  if (!won) return null;
  if (totalWins === UNLOCK_P2_AT)      return 'Core UNLOCKED!';
  if (totalWins === UNLOCK_P3_AT)      return 'Phase 3 crabs UNLOCKED!';
  if (hardWins  === UNLOCK_PYRAMID_AT) return '★ PYRAMID UNLOCKED! ★';
  return null;
}

export default function ResultScreen({ route, navigation }) {
  const { playerScore, oppScore, won, roundScores, selectedChar } = route.params;
  const { totalWins, hardWins } = useGameStore();
  const charDef   = getCharDef(selectedChar);
  const unlockMsg = getUnlockMsg(totalWins, hardWins, won);

  const scale = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    Animated.spring(scale, { toValue: 1, friction: 4, tension: 80, useNativeDriver: true }).start();
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>

        {/* Banner */}
        <Animated.View style={[styles.banner, { transform: [{ scale }] }]}>
          <Text style={[styles.bannerText, { color: won ? COLORS.win : COLORS.lose }]}>
            {won ? 'YOU WIN!' : 'YOU LOSE'}
          </Text>
          <CrabSprite phase={charDef.phase} char={charDef.char} size={80} />
        </Animated.View>

        {unlockMsg && (
          <View style={styles.unlockBadge}>
            <Text style={styles.unlockText}>{unlockMsg}</Text>
          </View>
        )}

        {/* Score table */}
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <Text style={styles.th}>RD</Text>
            <Text style={styles.th}>YOU</Text>
            <Text style={styles.th}>CPU</Text>
          </View>
          {roundScores.map((rs, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.td}>{i + 1}</Text>
              <Text style={[styles.td, rs.player > rs.opp && { color: COLORS.win }]}>
                {rs.player.toLocaleString()}
              </Text>
              <Text style={[styles.td, rs.opp > rs.player && { color: COLORS.lose }]}>
                {rs.opp.toLocaleString()}
              </Text>
            </View>
          ))}
          <View style={[styles.tableRow, styles.totalRow]}>
            <Text style={styles.th}>TOT</Text>
            <Text style={[styles.th, { color: COLORS.accent }]}>{playerScore.toLocaleString()}</Text>
            <Text style={[styles.th, { color: '#FF8888' }]}>{oppScore.toLocaleString()}</Text>
          </View>
        </View>

        {/* Buttons */}
        <TouchableOpacity style={styles.playBtn} onPress={() => navigation.replace('Game')}>
          <Text style={styles.playBtnText}>PLAY AGAIN</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secBtn} onPress={() => navigation.navigate('Title')}>
          <Text style={styles.secBtnText}>HOME</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 18, paddingHorizontal: 24 },

  banner:     { alignItems: 'center', gap: 10 },
  bannerText: { fontSize: 28, fontWeight: '900', letterSpacing: 3 },

  unlockBadge: { backgroundColor: COLORS.gold, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  unlockText:  { fontSize: 12, fontWeight: '900', color: '#000' },

  table:    { width: '100%', borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, overflow: 'hidden' },
  tableRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  totalRow: { backgroundColor: COLORS.panel, borderBottomWidth: 0 },
  th: { fontSize: 11, fontWeight: '800', color: COLORS.textDim, width: 80, textAlign: 'center' },
  td: { fontSize: 12, fontWeight: '700', color: COLORS.text, width: 80, textAlign: 'center', fontVariant: ['tabular-nums'] },

  playBtn:     { width: '100%', paddingVertical: 16, borderRadius: 12, backgroundColor: COLORS.accent, alignItems: 'center' },
  playBtnText: { fontSize: 14, fontWeight: '900', color: '#FFF', letterSpacing: 2 },
  secBtn:      { width: '100%', paddingVertical: 14, borderRadius: 12, borderWidth: 2, borderColor: COLORS.border, alignItems: 'center' },
  secBtnText:  { fontSize: 12, fontWeight: '800', color: COLORS.textMid, letterSpacing: 1 },
});
