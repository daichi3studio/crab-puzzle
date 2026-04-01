/**
 * TutorialOverlay — step-by-step first-launch guide
 * Shows over the StageGameScreen on first play.
 * Props:
 *   visible: bool
 *   onDone: () => void
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Modal, Animated,
} from 'react-native';
import { COLORS } from '../constants/gameConfig';

const FONT = 'PressStart2P';

const STEPS = [
  {
    icon: '👆',
    title: 'DRAG TO SWAP',
    body: 'Drag a tile up, down, left, or right to swap it with its neighbor.',
  },
  {
    icon: '🟦🟦🟦',
    title: 'MATCH 3+',
    body: 'Line up 3 or more tiles of the same color to clear them and score!',
  },
  {
    icon: '🤖',
    title: 'ROBOT BLOCK',
    body: 'Match 4 in a row to create a ROBOT. Tap it to blast an entire row or column!',
  },
  {
    icon: '🔺',
    title: 'PYRAMID BLOCK',
    body: 'Match 5 or more to create a PYRAMID. Tap it to clear a cross pattern!',
  },
  {
    icon: '⏱️',
    title: 'BEAT THE TARGET',
    body: 'Reach the target score before the timer runs out to clear the stage!',
  },
  {
    icon: '💡',
    title: 'HINT SYSTEM',
    body: 'If you stop moving for 3 seconds, a yellow glow shows you a valid move.',
  },
];

export default function TutorialOverlay({ visible, onDone }) {
  const [step, setStep] = useState(0);
  const opacity = useRef(new Animated.Value(0)).current;
  const scale   = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    if (visible) {
      setStep(0);
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(scale,   { toValue: 1, friction: 6, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const advance = () => {
    if (step < STEPS.length - 1) {
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.4, duration: 80, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1,   duration: 150, useNativeDriver: true }),
      ]).start();
      setStep(s => s + 1);
    } else {
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true })
        .start(onDone);
    }
  };

  const current = STEPS[step];

  return (
    <Modal visible={visible} transparent animationType="none">
      <View style={styles.backdrop}>
        <Animated.View style={[styles.card, { opacity, transform: [{ scale }] }]}>

          {/* Step indicator */}
          <View style={styles.dots}>
            {STEPS.map((_, i) => (
              <View
                key={i}
                style={[styles.dot, i === step && styles.dotActive]}
              />
            ))}
          </View>

          {/* Icon */}
          <Text style={styles.icon}>{current.icon}</Text>

          {/* Content */}
          <Text style={[styles.title, { fontFamily: FONT }]}>{current.title}</Text>
          <Text style={styles.body}>{current.body}</Text>

          {/* Button */}
          <TouchableOpacity style={styles.btn} onPress={advance}>
            <Text style={[styles.btnText, { fontFamily: FONT }]}>
              {step < STEPS.length - 1 ? 'NEXT →' : 'LET\'S GO!'}
            </Text>
          </TouchableOpacity>

          {/* Skip */}
          {step < STEPS.length - 1 && (
            <TouchableOpacity style={styles.skipBtn} onPress={onDone}>
              <Text style={styles.skipText}>SKIP</Text>
            </TouchableOpacity>
          )}

        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex:            1,
    backgroundColor: 'rgba(0,0,0,0.80)',
    alignItems:      'center',
    justifyContent:  'center',
    paddingHorizontal: 28,
  },
  card: {
    width:           '100%',
    backgroundColor: COLORS.panel,
    borderRadius:    16,
    borderWidth:     1,
    borderColor:     COLORS.border,
    padding:         28,
    alignItems:      'center',
    gap:             16,
  },
  dots: {
    flexDirection: 'row',
    gap:           6,
  },
  dot: {
    width:        6,
    height:       6,
    borderRadius: 3,
    backgroundColor: COLORS.border,
  },
  dotActive: { backgroundColor: COLORS.accent },
  icon:  { fontSize: 36 },
  title: {
    fontSize:      12,
    color:         COLORS.accent,
    letterSpacing: 1,
    textAlign:     'center',
  },
  body: {
    fontSize:   12,
    fontWeight: '500',
    color:      COLORS.textMid,
    textAlign:  'center',
    lineHeight: 20,
  },
  btn: {
    width:           '100%',
    paddingVertical: 14,
    borderRadius:    10,
    backgroundColor: COLORS.accent,
    alignItems:      'center',
    marginTop:       4,
  },
  btnText: { fontSize: 11, color: '#FFF', letterSpacing: 2 },
  skipBtn: { paddingVertical: 6 },
  skipText: { fontSize: 10, fontWeight: '700', color: COLORS.textDim },
});
