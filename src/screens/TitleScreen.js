import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  StatusBar, SafeAreaView,
} from 'react-native';
import CrabSprite from '../components/CrabSprite';
import { useGameStore } from '../store/gameStore';
import { COLORS } from '../constants/gameConfig';

export default function TitleScreen({ navigation }) {
  const hydrate = useGameStore(s => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      <View style={styles.container}>
        {/* Title */}
        <View style={styles.titleBlock}>
          <Text style={styles.titleTop}>CRAB</Text>
          <Text style={styles.titleBot}>PUZZLE</Text>
        </View>

        {/* Sprite showcase */}
        <View style={styles.spriteRow}>
          <CrabSprite phase={1} size={64} facingLeft />
          <CrabSprite phase={2} size={72} />
          <CrabSprite phase={3} char="pyramid" size={64} facingLeft />
        </View>

        {/* Buttons */}
        <TouchableOpacity
          style={[styles.btn, styles.btnPrimary]}
          onPress={() => navigation.navigate('Difficulty')}
        >
          <Text style={styles.btnText}>PLAY</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, styles.btnSecondary]}
          onPress={() => navigation.navigate('CharSelect')}
        >
          <Text style={styles.btnText}>SELECT CHAR</Text>
        </TouchableOpacity>

        {/* Version */}
        <Text style={styles.ver}>v1.0  MyOpenCrab</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    paddingHorizontal: 24,
  },
  titleBlock: { alignItems: 'center', gap: 4 },
  titleTop: {
    fontFamily: 'PressStart2P',
    fontSize:   30,
    color:      COLORS.accent,
    letterSpacing: 6,
  },
  titleBot: {
    fontFamily: 'PressStart2P',
    fontSize:   22,
    color:      COLORS.gold,
    letterSpacing: 4,
  },
  spriteRow: {
    flexDirection: 'row',
    alignItems:    'flex-end',
    gap: 16,
    marginVertical: 8,
  },
  btn: {
    width:        220,
    paddingVertical: 14,
    borderRadius: 6,
    borderWidth:  2,
    alignItems:   'center',
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
    fontSize:   13,
    color:      COLORS.text,
  },
  ver: {
    fontFamily: 'PressStart2P',
    fontSize:   8,
    color:      COLORS.textDim,
    marginTop:  8,
  },
});
