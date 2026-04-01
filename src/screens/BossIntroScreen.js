/**
 * BossIntroScreen — Dramatic VS intro before a boss battle
 *
 * route.params: { vsId }
 * Auto-replaces to AdventureBoss after ~2.6s
 */
import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, StatusBar,
} from 'react-native';
import CrabSprite from '../components/CrabSprite';
import { useGameStore } from '../store/gameStore';
import { COLORS, ALL_CHARS } from '../constants/gameConfig';
import { getVsBattle } from '../constants/stages';

const sleep = ms => new Promise(r => setTimeout(r, ms));

const CPU_CHARS = {
  vs1: 'p2', vs2: 'chip', vs3: 'pink', vs4: 'wing',
  vs5: 'power', vs6: 'gentle', vs7: 'robot', vs8: 'pyramid',
};

function getCharDef(key) { return ALL_CHARS.find(c => c.key === key) ?? ALL_CHARS[0]; }

export default function BossIntroScreen({ route, navigation }) {
  const { vsId } = route.params;
  const vs = getVsBattle(vsId);
  const { selectedChar } = useGameStore();

  const playerDef = getCharDef(selectedChar);
  const cpuDef    = getCharDef(CPU_CHARS[vsId] ?? 'p2');

  // Animated values
  const playerX  = useRef(new Animated.Value(-160)).current;
  const cpuX     = useRef(new Animated.Value(160)).current;
  const vsScale  = useRef(new Animated.Value(0)).current;
  const vsOp     = useRef(new Animated.Value(0)).current;
  const bgFlash  = useRef(new Animated.Value(0)).current;
  const nameOp   = useRef(new Animated.Value(0)).current;
  const aliveRef = useRef(true);

  useEffect(() => {
    aliveRef.current = true;

    const run = async () => {
      // Characters slide in simultaneously
      Animated.parallel([
        Animated.spring(playerX, { toValue: 0, friction: 6, tension: 80, useNativeDriver: true }),
        Animated.spring(cpuX,    { toValue: 0, friction: 6, tension: 80, useNativeDriver: true }),
      ]).start();
      await sleep(500);
      if (!aliveRef.current) return;

      // VS text pops in with glow flash
      Animated.parallel([
        Animated.spring(vsScale, { toValue: 1, friction: 3, tension: 160, useNativeDriver: true }),
        Animated.timing(vsOp,    { toValue: 1, duration: 150, useNativeDriver: true }),
        Animated.sequence([
          Animated.timing(bgFlash, { toValue: 0.22, duration: 80,  useNativeDriver: true }),
          Animated.timing(bgFlash, { toValue: 0,    duration: 300, useNativeDriver: true }),
        ]),
      ]).start();
      await sleep(400);
      if (!aliveRef.current) return;

      // Name badge fades in
      Animated.timing(nameOp, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      await sleep(900);
      if (!aliveRef.current) return;

      // Short punch animation on VS then navigate
      Animated.sequence([
        Animated.timing(vsScale, { toValue: 1.3, duration: 120, useNativeDriver: true }),
        Animated.timing(vsScale, { toValue: 0,   duration: 200, useNativeDriver: true }),
      ]).start();
      await sleep(320);
      if (!aliveRef.current) return;

      navigation.replace('AdventureBoss', { vsId });
    };

    run();
    return () => { aliveRef.current = false; };
  }, []);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Background flash */}
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: '#FFFFFF', opacity: bgFlash }]}
      />

      {/* Stage name top */}
      <Animated.View style={[styles.topBanner, { opacity: nameOp }]}>
        <Text style={styles.vsLabel}>VS BATTLE</Text>
        <Text style={styles.charNameText}>{vs?.charName ?? '???'}</Text>
      </Animated.View>

      {/* Characters row */}
      <View style={styles.fighters}>
        {/* Player */}
        <Animated.View style={[styles.fighterSlot, { transform: [{ translateX: playerX }] }]}>
          <CrabSprite phase={playerDef.phase} char={playerDef.char} size={80} />
          <Text style={styles.fighterLabel}>YOU</Text>
        </Animated.View>

        {/* VS badge center */}
        <Animated.View
          style={[styles.vsBadge, { opacity: vsOp, transform: [{ scale: vsScale }] }]}
        >
          <Text style={styles.vsText}>VS</Text>
        </Animated.View>

        {/* CPU */}
        <Animated.View style={[styles.fighterSlot, { transform: [{ translateX: cpuX }] }]}>
          <CrabSprite phase={cpuDef.phase} char={cpuDef.char} size={80} facingLeft />
          <Text style={[styles.fighterLabel, { color: '#FF8888' }]}>CPU</Text>
        </Animated.View>
      </View>

      {/* Decorative divider lines */}
      <Animated.View style={[styles.lineLeft,  { opacity: vsOp }]} />
      <Animated.View style={[styles.lineRight, { opacity: vsOp }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#050810',
    alignItems: 'center',
    justifyContent: 'center',
  },

  topBanner: {
    position: 'absolute',
    top: '18%',
    alignItems: 'center',
    gap: 6,
  },
  vsLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.textDim,
    letterSpacing: 4,
  },
  charNameText: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.gold,
    letterSpacing: 2,
    textShadowColor: COLORS.gold,
    textShadowRadius: 8,
    textShadowOffset: { width: 0, height: 0 },
  },

  fighters: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 20,
  },
  fighterSlot: {
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  fighterLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.accent,
    letterSpacing: 2,
  },

  vsBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FF2020',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF2020',
    shadowRadius: 20,
    shadowOpacity: 0.9,
    elevation: 16,
    borderWidth: 3,
    borderColor: '#FF8888',
  },
  vsText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 2,
  },

  lineLeft: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: '55%',
    height: 2,
    backgroundColor: COLORS.accent + '66',
  },
  lineRight: {
    position: 'absolute',
    top: '50%',
    left: '55%',
    right: 0,
    height: 2,
    backgroundColor: '#FF4444' + '66',
  },
});
