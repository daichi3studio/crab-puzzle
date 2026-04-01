/**
 * AdventureBossResultScreen — WIN / LOSE after VS battle
 * On win: brief result → CharAcquiredScreen
 * On loss: retry or quit
 */
import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  TouchableOpacity, Animated, StatusBar,
} from 'react-native';
import { COLORS } from '../constants/gameConfig';

export default function AdventureBossResultScreen({ route, navigation }) {
  const { vsId, won, playerScore, oppScore, unlocksChar, charName } = route.params;

  const scale   = useRef(new Animated.Value(0.3)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale,   { toValue: 1, friction: 4, tension: 80, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      <View style={styles.container}>

        {/* ── Banner ───────────────────────────────────────── */}
        <Animated.View style={[styles.banner, { transform: [{ scale }], opacity }]}>
          <Text style={[styles.bannerText, { color: won ? COLORS.win : COLORS.lose }]}>
            {won ? 'YOU WIN!' : 'YOU LOSE'}
          </Text>

          {/* Score panel (always shown) */}
          <View style={styles.scorePanel}>
            <View style={styles.scoreRow}>
              <Text style={styles.scoreLbl}>YOU</Text>
              <Text style={[styles.scoreNum, won && { color: COLORS.win }]}>
                {playerScore.toLocaleString()}
              </Text>
            </View>
            <View style={styles.scoreDivider} />
            <View style={styles.scoreRow}>
              <Text style={styles.scoreLbl}>CPU</Text>
              <Text style={[styles.scoreNum, !won && { color: COLORS.lose }]}>
                {oppScore.toLocaleString()}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* ── Buttons ──────────────────────────────────────── */}
        {won && (
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigation.replace('CharAcquired', { unlocksChar, charName })}
          >
            <Text style={styles.primaryBtnText}>GET CHARACTER  →</Text>
          </TouchableOpacity>
        )}

        {!won && (
          <>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => navigation.replace('AdventureBoss', { vsId })}
            >
              <Text style={styles.primaryBtnText}>RETRY</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.tertiaryBtn} onPress={() => navigation.navigate('StageMap')}>
              <Text style={styles.tertiaryBtnText}>BACK TO MAP</Text>
            </TouchableOpacity>
          </>
        )}

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: COLORS.bg },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 28, paddingHorizontal: 28 },

  banner:     { alignItems: 'center', gap: 20, width: '100%' },
  bannerText: { fontSize: 28, fontWeight: '900', letterSpacing: 3 },

  scorePanel: {
    width: '100%', backgroundColor: COLORS.panel, borderRadius: 12,
    borderWidth: 1, borderColor: COLORS.border, paddingVertical: 16, paddingHorizontal: 24, gap: 12,
  },
  scoreRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  scoreLbl: { fontSize: 10, fontWeight: '800', color: COLORS.textDim, letterSpacing: 1 },
  scoreNum: { fontSize: 20, fontWeight: '900', color: COLORS.text, fontVariant: ['tabular-nums'] },
  scoreDivider: { height: 1, backgroundColor: COLORS.border },

  primaryBtn: {
    width: '100%', paddingVertical: 16, borderRadius: 12,
    backgroundColor: COLORS.accent, alignItems: 'center',
    shadowColor: COLORS.accent, shadowRadius: 12, shadowOpacity: 0.35, elevation: 6,
  },
  primaryBtnText: { fontSize: 14, fontWeight: '900', color: '#FFF', letterSpacing: 2 },
  tertiaryBtn: { paddingVertical: 10, alignItems: 'center' },
  tertiaryBtnText: { fontSize: 11, fontWeight: '700', color: COLORS.textDim, letterSpacing: 1 },
});
