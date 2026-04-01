/**
 * TitleScreen v2 — Clean design with selected crab displayed
 *
 * Layout:
 *   CRAB PUZZLE (title)
 *   [Selected crab — large, animated]
 *   "Bit" (char name)
 *   [▶ PLAY] button
 *   [SELECT CRAB] button
 *   Easy ○●○ Hard (toggle)
 */
import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  StatusBar, SafeAreaView, Animated,
} from 'react-native';
import CrabSprite from '../components/CrabSprite';
import { useGameStore } from '../store/gameStore';
import { COLORS, ALL_CHARS } from '../constants/gameConfig';

function getCharDef(key) { return ALL_CHARS.find(c => c.key === key) ?? ALL_CHARS[0]; }

export default function TitleScreen({ navigation }) {
  const { selectedChar, hydrate } = useGameStore();
  const charDef = getCharDef(selectedChar);

  useEffect(() => { hydrate(); }, [hydrate]);

  // Idle bounce animation for the crab
  const bounce = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, { toValue: -8, duration: 800, useNativeDriver: true }),
        Animated.timing(bounce, { toValue: 0,  duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      <View style={styles.container}>
        {/* Title */}
        <View style={styles.titleWrap}>
          <Text style={styles.title1}>CRAB</Text>
          <Text style={styles.title2}>PUZZLE</Text>
        </View>

        {/* Selected crab showcase */}
        <View style={styles.showcase}>
          <Animated.View style={{ transform: [{ translateY: bounce }] }}>
            <CrabSprite phase={charDef.phase} char={charDef.char} size={96} />
          </Animated.View>
          <Text style={styles.charName}>{charDef.name}</Text>
        </View>

        {/* ADVENTURE button */}
        <TouchableOpacity
          style={styles.playBtn}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('StageMap')}
        >
          <Text style={styles.playBtnText}>▶  ADVENTURE</Text>
        </TouchableOpacity>

        {/* VS BATTLE */}
        <TouchableOpacity
          style={styles.secondaryBtn}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Game')}
        >
          <Text style={styles.secondaryBtnText}>VS BATTLE</Text>
        </TouchableOpacity>

        {/* SELECT CRAB */}
        <TouchableOpacity
          style={styles.secondaryBtn}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('CharSelect')}
        >
          <Text style={styles.secondaryBtnText}>SELECT CRAB</Text>
        </TouchableOpacity>

        {/* Settings / Stats row */}
        <View style={styles.utilRow}>
          <TouchableOpacity
            style={styles.utilBtn}
            onPress={() => navigation.navigate('Stats')}
          >
            <Text style={styles.utilBtnText}>📊 STATS</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.utilBtn}
            onPress={() => navigation.navigate('Settings')}
          >
            <Text style={styles.utilBtnText}>⚙️ SETTINGS</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.ver}>v2.0  MyOpenCrab</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  container: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    gap:            20,
    paddingHorizontal: 24,
  },

  // Title
  titleWrap: { alignItems: 'center', gap: 2 },
  title1: {
    fontSize:      32,
    fontWeight:     '900',
    color:         COLORS.accent,
    letterSpacing: 8,
  },
  title2: {
    fontSize:      24,
    fontWeight:     '900',
    color:         COLORS.gold,
    letterSpacing: 6,
  },

  // Showcase
  showcase: { alignItems: 'center', gap: 8, marginVertical: 4 },
  charName: {
    fontSize:      14,
    fontWeight:     '800',
    color:         COLORS.textMid,
    letterSpacing: 2,
  },

  // Buttons
  playBtn: {
    width:           220,
    paddingVertical: 16,
    borderRadius:    12,
    backgroundColor: COLORS.accent,
    alignItems:      'center',
    shadowColor:     COLORS.accent,
    shadowRadius:    12,
    shadowOpacity:   0.4,
    elevation:       6,
  },
  playBtnText: {
    fontSize:      16,
    fontWeight:     '900',
    color:         '#FFFFFF',
    letterSpacing: 3,
  },
  secondaryBtn: {
    width:           220,
    paddingVertical: 14,
    borderRadius:    12,
    borderWidth:     2,
    borderColor:     COLORS.border,
    alignItems:      'center',
  },
  secondaryBtnText: {
    fontSize:      13,
    fontWeight:     '800',
    color:         COLORS.textMid,
    letterSpacing: 2,
  },

  utilRow: {
    flexDirection:  'row',
    gap:            12,
    marginTop:      4,
  },
  utilBtn: {
    paddingVertical:   8,
    paddingHorizontal: 16,
    borderRadius:      8,
    borderWidth:       1,
    borderColor:       COLORS.border,
  },
  utilBtnText: {
    fontSize:   10,
    fontWeight: '700',
    color:      COLORS.textDim,
  },

  ver: {
    fontSize:   9,
    fontWeight: '600',
    color:      COLORS.textDim,
    marginTop:  4,
  },
});
