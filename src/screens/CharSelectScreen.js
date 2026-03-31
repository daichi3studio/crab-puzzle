import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView,
} from 'react-native';
import CrabSprite from '../components/CrabSprite';
import { useGameStore } from '../store/gameStore';
import { ALL_CHARS, COLORS } from '../constants/gameConfig';

export default function CharSelectScreen({ navigation }) {
  const { totalWins, hardWins, selectedChar, setSelectedChar } = useGameStore();

  const isUnlocked = (ch) => {
    if (ch.requireHard > 0) return hardWins >= ch.requireHard;
    return totalWins >= ch.requireWins;
  };

  const lockLabel = (ch) => {
    if (ch.requireHard > 0) return `HARD WIN ×${ch.requireHard}`;
    if (ch.requireWins > 0) return `WIN ×${ch.requireWins}`;
    return '';
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.heading}>SELECT CHAR</Text>
        <Text style={styles.wins}>
          WINS: {totalWins}  HARD: {hardWins}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.grid}>
        {ALL_CHARS.map(ch => {
          const unlocked = isUnlocked(ch);
          const active   = selectedChar === ch.key;
          return (
            <TouchableOpacity
              key={ch.key}
              style={[
                styles.card,
                active    && styles.cardActive,
                !unlocked && styles.cardLocked,
                ch.key === 'pyramid' && styles.cardPyramid,
              ]}
              onPress={() => unlocked && setSelectedChar(ch.key)}
              activeOpacity={unlocked ? 0.75 : 1}
            >
              <CrabSprite
                phase={ch.phase}
                char={ch.char}
                size={52}
              />
              <Text style={[styles.charName, !unlocked && styles.textLocked]}>
                {ch.name.toUpperCase()}
              </Text>

              {active && (
                <View style={styles.activeBadge}>
                  <Text style={styles.activeBadgeText}>ON</Text>
                </View>
              )}

              {!unlocked && (
                <View style={styles.lockBadge}>
                  <Text style={styles.lockText}>{lockLabel(ch)}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.doneBtnText}>DONE</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 12,
    gap: 6,
  },
  heading: {
    fontFamily: 'PressStart2P',
    fontSize:   16,
    color:      COLORS.accent,
  },
  wins: {
    fontFamily: 'PressStart2P',
    fontSize:   8,
    color:      COLORS.textDim,
  },
  grid: {
    flexDirection:   'row',
    flexWrap:        'wrap',
    justifyContent:  'center',
    gap:             12,
    paddingHorizontal: 16,
    paddingBottom:   16,
  },
  card: {
    width:          100,
    height:         110,
    backgroundColor: COLORS.panel,
    borderRadius:   8,
    borderWidth:    2,
    borderColor:    COLORS.border,
    alignItems:     'center',
    justifyContent: 'center',
    gap:            6,
    position:       'relative',
    overflow:       'hidden',
  },
  cardActive: {
    borderColor: COLORS.accent,
    backgroundColor: '#0A1A2A',
  },
  cardLocked: {
    opacity: 0.5,
  },
  cardPyramid: {
    borderColor: '#D4A820',
  },
  charName: {
    fontFamily: 'PressStart2P',
    fontSize:   7,
    color:      COLORS.text,
  },
  textLocked: {
    color: COLORS.textDim,
  },
  activeBadge: {
    position:        'absolute',
    top:             4,
    right:           4,
    backgroundColor: COLORS.accent,
    borderRadius:    3,
    paddingHorizontal: 4,
    paddingVertical:   2,
  },
  activeBadgeText: {
    fontFamily: 'PressStart2P',
    fontSize:   6,
    color:      '#000',
  },
  lockBadge: {
    position:        'absolute',
    bottom:          0,
    left:            0,
    right:           0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingVertical: 3,
    alignItems:      'center',
  },
  lockText: {
    fontFamily: 'PressStart2P',
    fontSize:   5,
    color:      COLORS.gold,
    textAlign:  'center',
  },
  doneBtn: {
    margin:         16,
    paddingVertical: 14,
    borderRadius:   6,
    borderWidth:    2,
    borderColor:    COLORS.accent,
    alignItems:     'center',
  },
  doneBtnText: {
    fontFamily: 'PressStart2P',
    fontSize:   12,
    color:      COLORS.accent,
  },
});
