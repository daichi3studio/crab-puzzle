import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
} from 'react-native';
import CrabSprite from '../components/CrabSprite';
import { useGameStore } from '../store/gameStore';
import { COLORS } from '../constants/gameConfig';

export default function DifficultyScreen({ navigation }) {
  const { setDifficulty } = useGameStore();

  const pick = (diff) => {
    setDifficulty(diff);
    navigation.navigate('Game');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.heading}>DIFFICULTY</Text>

        {/* Easy card */}
        <TouchableOpacity style={[styles.card, styles.cardEasy]} onPress={() => pick('easy')}>
          <View style={styles.cardRow}>
            <CrabSprite phase={1} size={56} />
            <CrabSprite phase={2} size={56} />
          </View>
          <Text style={styles.cardTitle}>EASY</Text>
          <Text style={styles.cardDesc}>{'Phase 1 & 2 blocks\nFun for beginners'}</Text>
        </TouchableOpacity>

        {/* Hard card */}
        <TouchableOpacity style={[styles.card, styles.cardHard]} onPress={() => pick('hard')}>
          <View style={styles.cardRow}>
            <CrabSprite phase={3} char="power"   size={48} />
            <CrabSprite phase={3} char="pyramid" size={56} />
            <CrabSprite phase={3} char="robot"   size={48} />
          </View>
          <Text style={styles.cardTitle}>HARD</Text>
          <Text style={styles.cardDesc}>{'Phase 3 blocks appear!\nPyramid is rare & deadly'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← BACK</Text>
        </TouchableOpacity>
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
    gap: 20,
    paddingHorizontal: 24,
  },
  heading: {
    fontFamily:    'PressStart2P',
    fontSize:      18,
    color:         COLORS.accent,
    marginBottom:  8,
    letterSpacing: 3,
  },
  card: {
    width:        '100%',
    borderRadius: 10,
    borderWidth:  2,
    padding:      20,
    alignItems:   'center',
    gap:          10,
  },
  cardEasy: {
    backgroundColor: '#0A1A2A',
    borderColor:     COLORS.accent,
  },
  cardHard: {
    backgroundColor: '#1A0A0A',
    borderColor:     '#CC3333',
  },
  cardRow: {
    flexDirection:  'row',
    alignItems:     'flex-end',
    gap:            12,
  },
  cardTitle: {
    fontFamily: 'PressStart2P',
    fontSize:   16,
    color:      COLORS.text,
  },
  cardDesc: {
    fontFamily: 'PressStart2P',
    fontSize:   8,
    color:      COLORS.textDim,
    textAlign:  'center',
    lineHeight: 16,
  },
  back: {
    fontFamily: 'PressStart2P',
    fontSize:   10,
    color:      COLORS.textDim,
    marginTop:  8,
  },
});
