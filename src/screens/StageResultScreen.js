/**
 * StageResultScreen — Stage clear / fail result
 *
 * Layout:
 *   STAGE CLEAR! / TIME'S UP  (animated banner)
 *   ★★★ (stars)
 *   Score: XXXXX / XXXXX
 *   [NEXT STAGE] / [RETRY] / [MAP]
 */
import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  TouchableOpacity, Animated, StatusBar,
} from 'react-native';
import { COLORS } from '../constants/gameConfig';
export default function StageResultScreen({ route, navigation }) {
  const { stageId, score, target, stars, cleared, maxCombo = 0, comboTarget = 99 } = route.params;
  const comboOk = cleared && maxCombo >= comboTarget;
  const scoreOk = cleared && score >= target * 1.3;

  // Entrance animation
  const scale   = useRef(new Animated.Value(0.4)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale,   { toValue: 1, friction: 5, tension: 70, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
  }, []);

  // Star animations (staggered) — fixed refs, hooks must be at top level
  const starScale0 = useRef(new Animated.Value(0)).current;
  const starScale1 = useRef(new Animated.Value(0)).current;
  const starScale2 = useRef(new Animated.Value(0)).current;
  const starScales = [starScale0, starScale1, starScale2];
  useEffect(() => {
    const anims = starScales.slice(0, stars).map((sv, i) =>
      Animated.sequence([
        Animated.delay(300 + i * 150),
        Animated.spring(sv, { toValue: 1, friction: 4, useNativeDriver: true }),
      ])
    );
    Animated.parallel(anims).start();
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      <View style={styles.container}>

        {/* ── Banner ───────────────────────────────────────── */}
        <Animated.View style={[styles.banner, { transform: [{ scale }], opacity }]}>
          <Text style={[
            styles.bannerText,
            { color: cleared ? COLORS.win : COLORS.lose },
          ]}>
            {cleared ? 'STAGE CLEAR!' : "TIME'S UP"}
          </Text>

          {/* Stars */}
          <View style={styles.starsRow}>
            {[0, 1, 2].map(i => (
              <Animated.Text
                key={i}
                style={[
                  styles.star,
                  i < stars
                    ? { color: COLORS.gold, transform: [{ scale: starScales[i] }] }
                    : styles.starEmpty,
                ]}
              >
                ★
              </Animated.Text>
            ))}
          </View>
        </Animated.View>

        {/* ── Score panel ──────────────────────────────────── */}
        <View style={styles.scorePanel}>
          <View style={styles.scoreRow}>
            <Text style={styles.scoreLbl}>SCORE</Text>
            <Text style={[styles.scoreNum, cleared && { color: COLORS.win }]}>
              {score.toLocaleString()}
            </Text>
          </View>
          <View style={styles.scoreDivider} />
          <View style={styles.scoreRow}>
            <Text style={styles.scoreLbl}>TARGET</Text>
            <Text style={styles.scoreNum}>{target.toLocaleString()}</Text>
          </View>
        </View>

        {/* ── Star breakdown ───────────────────────────────── */}
        {cleared && (
          <View style={styles.breakdownPanel}>
            <View style={styles.bRow}>
              <Text style={[styles.bStar, { color: COLORS.gold }]}>★</Text>
              <Text style={styles.bLabel}>CLEAR</Text>
              <Text style={styles.bCheck}>✓</Text>
            </View>
            <View style={styles.bRow}>
              <Text style={[styles.bStar, comboOk ? { color: COLORS.gold } : styles.bStarDim]}>★</Text>
              <Text style={styles.bLabel}>COMBO ×{comboTarget + 1}</Text>
              <Text style={[styles.bCheck, comboOk ? { color: COLORS.win } : styles.bMiss]}>
                {comboOk ? '✓' : `×${maxCombo + 1}`}
              </Text>
            </View>
            <View style={styles.bRow}>
              <Text style={[styles.bStar, scoreOk ? { color: COLORS.gold } : styles.bStarDim]}>★</Text>
              <Text style={styles.bLabel}>SCORE +30%</Text>
              <Text style={[styles.bCheck, scoreOk ? { color: COLORS.win } : styles.bMiss]}>
                {scoreOk ? '✓' : `${Math.floor((score / target - 1) * 100)}%`}
              </Text>
            </View>
          </View>
        )}

        {/* ── Buttons ──────────────────────────────────────── */}
        {cleared ? (
          <>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => navigation.navigate('StageMap')}
            >
              <Text style={styles.primaryBtnText}>BACK TO MAP</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => navigation.replace('StageGame', { stageId })}
            >
              <Text style={styles.secondaryBtnText}>RETRY</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => navigation.replace('StageGame', { stageId })}
            >
              <Text style={styles.primaryBtnText}>RETRY</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.tertiaryBtn}
              onPress={() => navigation.navigate('StageMap')}
            >
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
  container: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    gap:            24,
    paddingHorizontal: 28,
  },

  // Banner
  banner: { alignItems: 'center', gap: 16 },
  bannerText: {
    fontSize:      26,
    fontWeight:    '900',
    letterSpacing: 2,
  },

  // Stars
  starsRow: { flexDirection: 'row', gap: 8 },
  star:      { fontSize: 44, color: COLORS.gold },
  starEmpty: { fontSize: 44, color: COLORS.border },

  // Score panel
  scorePanel: {
    width:           '100%',
    backgroundColor: COLORS.panel,
    borderRadius:    12,
    borderWidth:     1,
    borderColor:     COLORS.border,
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap:             12,
  },
  scoreRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
  },
  scoreLbl: {
    fontSize:   10,
    fontWeight: '800',
    color:      COLORS.textDim,
    letterSpacing: 1,
  },
  scoreNum: {
    fontSize:    20,
    fontWeight:  '900',
    color:       COLORS.text,
    fontVariant: ['tabular-nums'],
  },
  scoreDivider: {
    height:          1,
    backgroundColor: COLORS.border,
  },

  // Buttons
  primaryBtn: {
    width:           '100%',
    paddingVertical: 16,
    borderRadius:    12,
    backgroundColor: COLORS.accent,
    alignItems:      'center',
    shadowColor:     COLORS.accent,
    shadowRadius:    12,
    shadowOpacity:   0.35,
    elevation:       6,
  },
  primaryBtnText: {
    fontSize:      14,
    fontWeight:    '900',
    color:         '#FFF',
    letterSpacing: 2,
  },
  secondaryBtn: {
    width:           '100%',
    paddingVertical: 14,
    borderRadius:    12,
    borderWidth:     2,
    borderColor:     COLORS.border,
    alignItems:      'center',
  },
  secondaryBtnText: {
    fontSize:   13,
    fontWeight: '800',
    color:      COLORS.textMid,
    letterSpacing: 1,
  },
  tertiaryBtn: {
    paddingVertical: 10,
    alignItems:      'center',
  },
  tertiaryBtnText: {
    fontSize:   11,
    fontWeight: '700',
    color:      COLORS.textDim,
    letterSpacing: 1,
  },

  // Star breakdown panel
  breakdownPanel: {
    width:           '100%',
    backgroundColor: COLORS.panel,
    borderRadius:    10,
    borderWidth:     1,
    borderColor:     COLORS.border,
    paddingVertical: 10,
    paddingHorizontal: 18,
    gap:             6,
  },
  bRow: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            10,
  },
  bStar:    { fontSize: 16, color: COLORS.gold },
  bStarDim: { color: COLORS.border },
  bLabel:   { flex: 1, fontSize: 9, fontWeight: '800', color: COLORS.textMid, letterSpacing: 1 },
  bCheck:   { fontSize: 11, fontWeight: '900', color: COLORS.win },
  bMiss:    { color: COLORS.textDim },
});
