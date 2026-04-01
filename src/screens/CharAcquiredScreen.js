/**
 * CharAcquiredScreen — Character acquisition cutscene
 * Adapted from crab-core's EvolveP2toP3Screen (using standard Animated API)
 *
 * route.params: { unlocksChar, charName }
 * On tap → navigate back to StageMap
 */
import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, Animated, Platform, Pressable,
} from 'react-native';
import CrabSprite from '../components/CrabSprite';
import { ALL_CHARS, BLOCKS, SPECIAL_ROBOT, SPECIAL_PYRAMID, COLORS } from '../constants/gameConfig';
import { useSoundEffects } from '../hooks/useSoundEffects';

const FONT = 'PressStart2P';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Map character key → display color */
function getCharColor(charKey) {
  if (charKey === 'robot')   return SPECIAL_ROBOT.color;
  if (charKey === 'pyramid') return SPECIAL_PYRAMID.accent; // gold
  const block = BLOCKS.find((b) => b.char === charKey);
  if (block) return block.color;
  if (charKey === 'p2') return '#E07830';
  return COLORS.accent;
}

function getCharDef(key) {
  return ALL_CHARS.find((c) => c.key === key) ?? ALL_CHARS[0];
}

export default function CharAcquiredScreen({ route, navigation }) {
  const { unlocksChar, charName } = route.params;
  const charColor = getCharColor(unlocksChar);
  const charDef = getCharDef(unlocksChar);

  const { play } = useSoundEffects();
  const aliveRef = useRef(true);
  const [showMystery, setShowMystery] = useState(false);
  const [showReveal, setShowReveal] = useState(false);
  const [tapReady, setTapReady] = useState(false);

  // Animated values
  const glow       = useRef(new Animated.Value(0)).current;
  const flash      = useRef(new Animated.Value(0)).current;
  const darkVeil   = useRef(new Animated.Value(0)).current;
  const mysteryOp  = useRef(new Animated.Value(0)).current;
  const fillProg   = useRef(new Animated.Value(0)).current;
  const spriteOp   = useRef(new Animated.Value(0)).current;
  const spriteScale = useRef(new Animated.Value(0.92)).current;
  const sparklesOp = useRef(new Animated.Value(0)).current;
  const nameOp     = useRef(new Animated.Value(0)).current;
  const badgeOp    = useRef(new Animated.Value(0)).current;
  const badgeY     = useRef(new Animated.Value(48)).current;
  const tapHintOp  = useRef(new Animated.Value(0)).current;

  // Silhouette color interpolation (dark → char color)
  const silhouetteBg = fillProg.interpolate({
    inputRange: [0, 1],
    outputRange: ['#2a2a2a', charColor],
  });
  const silhouetteOpacity = fillProg.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 1],
  });

  // Glow ring scale & opacity
  const glowScale = glow.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.25] });
  const glowOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0, 0.55] });

  const sparklePositions = useMemo(() =>
    Array.from({ length: 14 }).map((_, i) => ({
      left: `${8 + ((i * 17) % 84)}%`,
      top:  `${12 + ((i * 23) % 70)}%`,
    })), []);

  useEffect(() => {
    aliveRef.current = true;
    play('acquire');

    const run = async () => {
      // 1. Glow builds up
      Animated.timing(glow, { toValue: 0.2, duration: 400, useNativeDriver: false }).start();
      await sleep(500);
      if (!aliveRef.current) return;
      Animated.timing(glow, { toValue: 1, duration: 900, useNativeDriver: false }).start();
      await sleep(1100);
      if (!aliveRef.current) return;

      // 2. Flash white
      Animated.timing(flash, { toValue: 1, duration: 140, useNativeDriver: true }).start();
      await sleep(160);
      if (!aliveRef.current) return;

      // 3. Dark veil + mystery text
      setShowMystery(true);
      Animated.parallel([
        Animated.timing(flash,    { toValue: 0, duration: 220, useNativeDriver: true }),
        Animated.timing(darkVeil, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(mysteryOp,{ toValue: 1, duration: 500, useNativeDriver: true }),
      ]).start();
      await sleep(700);
      if (!aliveRef.current) return;

      // 4. Character reveal — silhouette fill + sprite fade in
      setShowReveal(true);
      Animated.timing(fillProg, { toValue: 1, duration: 1000, useNativeDriver: false }).start();
      Animated.sequence([
        Animated.delay(200),
        Animated.parallel([
          Animated.timing(spriteOp,    { toValue: 1, duration: 900, useNativeDriver: true }),
          Animated.timing(spriteScale, { toValue: 1, duration: 900, useNativeDriver: true }),
        ]),
      ]).start();
      await sleep(1100);
      if (!aliveRef.current) return;

      // 5. Sparkles
      Animated.sequence([
        Animated.timing(sparklesOp, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(sparklesOp, { toValue: 0.45, duration: 160, useNativeDriver: true }),
            Animated.timing(sparklesOp, { toValue: 1,    duration: 180, useNativeDriver: true }),
          ]),
          { iterations: 6 },
        ),
      ]).start();

      // 6. Name flash
      Animated.loop(
        Animated.sequence([
          Animated.timing(nameOp, { toValue: 1,    duration: 180, useNativeDriver: true }),
          Animated.timing(nameOp, { toValue: 0.35, duration: 220, useNativeDriver: true }),
          Animated.timing(nameOp, { toValue: 1,    duration: 200, useNativeDriver: true }),
        ]),
        { iterations: 3 },
      ).start();
      await sleep(900);
      if (!aliveRef.current) return;

      // 7. Badge slides in
      Animated.parallel([
        Animated.timing(badgeOp, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.spring(badgeY,  { toValue: 0, friction: 15, tension: 160, useNativeDriver: true }),
      ]).start();
      await sleep(600);
      if (!aliveRef.current) return;

      // 8. Tap hint
      Animated.timing(tapHintOp, { toValue: 1, duration: 400, useNativeDriver: true }).start();
      setTapReady(true);
    };

    run();
    return () => { aliveRef.current = false; };
  }, []);

  const handleTap = () => {
    if (!tapReady) return;
    navigation.reset({ index: 1, routes: [{ name: 'Title' }, { name: 'StageMap' }] });
  };

  return (
    <View style={styles.root}>
      {/* Dark background */}
      <View style={[styles.fill, { backgroundColor: COLORS.bg }]} />

      {/* Glow ring */}
      <Animated.View
        style={[styles.fill, styles.center]}
        pointerEvents="none"
      >
        <Animated.View
          style={[
            styles.glowRing,
            Platform.OS === 'web'
              ? { borderColor: charColor, boxShadow: `0 0 32px ${charColor}` }
              : { borderColor: charColor, shadowColor: charColor },
            { opacity: glowOpacity, transform: [{ scale: glowScale }] },
          ]}
        />
      </Animated.View>

      {/* Flash overlay */}
      <Animated.View
        style={[styles.fill, { backgroundColor: '#fff', opacity: flash }]}
        pointerEvents="none"
      />

      {/* Dark veil */}
      {showMystery && (
        <Animated.View
          style={[styles.fill, { backgroundColor: '#050508', opacity: darkVeil }]}
          pointerEvents="none"
        />
      )}

      {/* Mystery text */}
      {showMystery && (
        <Animated.View style={[styles.fill, styles.center, styles.mysteryWrap, { opacity: mysteryOp }]} pointerEvents="none">
          <Text style={[styles.mysteryText, { fontFamily: FONT }]}>? ? ?</Text>
        </Animated.View>
      )}

      {/* Character reveal */}
      {showReveal && (
        <View style={[styles.fill, styles.center]} pointerEvents="none">
          {/* Sparkles */}
          <Animated.View style={[styles.fill, { opacity: sparklesOp }]} pointerEvents="none">
            {sparklePositions.map((pos, i) => (
              <View
                key={i}
                style={[
                  styles.sparkleDot,
                  {
                    left: pos.left,
                    top:  pos.top,
                    backgroundColor: i % 2 === 0 ? charColor : '#ffffff',
                  },
                ]}
              />
            ))}
          </Animated.View>

          {/* Card with silhouette fill + sprite */}
          <View style={styles.cardGroup}>
            <View style={styles.cardContainer}>
              <Animated.View
                style={[
                  StyleSheet.absoluteFill,
                  styles.cardRadius,
                  { backgroundColor: silhouetteBg, opacity: silhouetteOpacity },
                ]}
              />
              <Animated.View
                style={[
                  StyleSheet.absoluteFill,
                  styles.center,
                  { opacity: spriteOp, transform: [{ scale: spriteScale }] },
                ]}
              >
                <CrabSprite phase={charDef.phase} char={charDef.char} size={96} />
              </Animated.View>
            </View>

            {/* Character name */}
            <Animated.View style={[styles.nameWrap, { opacity: nameOp }]}>
              <Text style={[styles.charName, { fontFamily: FONT, color: charColor }]}>
                {charName}
              </Text>
            </Animated.View>
          </View>
        </View>
      )}

      {/* UNLOCKED badge */}
      <Animated.View
        style={[styles.badgeWrap, { opacity: badgeOp, transform: [{ translateY: badgeY }] }]}
        pointerEvents="none"
      >
        <View style={[styles.badge, { borderColor: charColor }]}>
          <Text style={[styles.badgeText, { fontFamily: FONT, color: charColor }]}>
            CHAR UNLOCKED!
          </Text>
        </View>
      </Animated.View>

      {/* TAP hint */}
      <Animated.View style={[styles.tapHintWrap, { opacity: tapHintOp }]} pointerEvents="none">
        <Text style={[styles.tapHintText, { fontFamily: FONT }]}>TAP TO CONTINUE</Text>
      </Animated.View>

      {/* Full-screen tap target */}
      {tapReady && (
        <Pressable style={StyleSheet.absoluteFill} onPress={handleTap} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#000' },
  fill:   { ...StyleSheet.absoluteFillObject },
  center: { justifyContent: 'center', alignItems: 'center' },

  glowRing: {
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 3,
    ...Platform.select({
      default: { shadowOpacity: 0.85, shadowRadius: 32, shadowOffset: { width: 0, height: 0 } },
      web: {},
    }),
  },

  mysteryWrap: { paddingBottom: '18%' },
  mysteryText: { fontSize: 22, letterSpacing: 4, color: '#8a8a8a' },

  sparkleDot: {
    position: 'absolute',
    width: 7,
    height: 7,
    borderRadius: 4,
    opacity: 0.95,
  },

  cardGroup:     { alignItems: 'center' },
  cardContainer: { width: 132, height: 132, borderRadius: 16, overflow: 'hidden' },
  cardRadius:    { borderRadius: 16 },

  nameWrap: { marginTop: 14, alignItems: 'center' },
  charName: { fontSize: 14, textAlign: 'center' },

  badgeWrap: {
    position: 'absolute',
    left: 0, right: 0, bottom: '22%',
    alignItems: 'center',
  },
  badge: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderWidth: 2,
    borderRadius: 4,
    backgroundColor: COLORS.panel,
  },
  badgeText: { fontSize: 9, letterSpacing: 1 },

  tapHintWrap: {
    position: 'absolute',
    left: 0, right: 0, bottom: '5%',
    alignItems: 'center',
  },
  tapHintText: { fontSize: 8, color: COLORS.textDim },
});
