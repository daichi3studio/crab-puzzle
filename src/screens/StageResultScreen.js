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
import { STAGES } from '../constants/stages';

export default function StageResultScreen({ route, navigation }) {
  const { stageId, score, target, stars, cleared } = route.params;

  const hasNext = stageId < STAGES.length;
  const nextStageId = stageId + 1;

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

        {/* ── Buttons ──────────────────────────────────────── */}
        {cleared && hasNext && (
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigation.replace('StageGame', { stageId: nextStageId })}
          >
            <Text style={styles.primaryBtnText}>NEXT STAGE  →</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={cleared ? styles.secondaryBtn : styles.primaryBtn}
          onPress={() => navigation.replace('StageGame', { stageId })}
        >
          <Text style={cleared ? styles.secondaryBtnText : styles.primaryBtnText}>
            RETRY
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tertiaryBtn}
          onPress={() => navigation.navigate('StageMap')}
        >
          <Text style={styles.tertiaryBtnText}>BACK TO MAP</Text>
        </TouchableOpacity>

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
});
