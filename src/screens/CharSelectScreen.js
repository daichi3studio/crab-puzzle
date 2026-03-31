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
    if (ch.requireHard > 0) return `HARD ×${ch.requireHard}`;
    if (ch.requireWins > 0) return `WIN ×${ch.requireWins}`;
    return '';
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.heading}>SELECT CRAB</Text>
        <Text style={styles.stats}>WINS {totalWins}  •  HARD {hardWins}</Text>
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
              ]}
              onPress={() => unlocked && setSelectedChar(ch.key)}
              activeOpacity={unlocked ? 0.75 : 1}
            >
              <CrabSprite phase={ch.phase} char={ch.char} size={48} />
              <Text style={[styles.name, !unlocked && { color: COLORS.textDim }]}>
                {ch.name}
              </Text>

              {active && <View style={styles.activeDot} />}

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
  safe:   { flex: 1, backgroundColor: COLORS.bg },
  header: { alignItems: 'center', paddingTop: 16, paddingBottom: 12, gap: 4 },
  heading: { fontSize: 18, fontWeight: '900', color: COLORS.accent, letterSpacing: 3 },
  stats:   { fontSize: 10, fontWeight: '700', color: COLORS.textDim },

  grid: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center',
    gap: 12, paddingHorizontal: 16, paddingBottom: 16,
  },
  card: {
    width: 96, height: 104, backgroundColor: COLORS.panel,
    borderRadius: 12, borderWidth: 2, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center', gap: 4,
    position: 'relative', overflow: 'hidden',
  },
  cardActive: { borderColor: COLORS.accent, backgroundColor: COLORS.panelLight },
  cardLocked: { opacity: 0.45 },
  name: { fontSize: 9, fontWeight: '800', color: COLORS.text, letterSpacing: 1 },

  activeDot: {
    position: 'absolute', top: 6, right: 6,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: COLORS.accent,
  },
  lockBadge: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)', paddingVertical: 3, alignItems: 'center',
  },
  lockText: { fontSize: 7, fontWeight: '800', color: COLORS.gold },

  doneBtn: {
    margin: 16, paddingVertical: 14, borderRadius: 12,
    borderWidth: 2, borderColor: COLORS.accent, alignItems: 'center',
  },
  doneBtnText: { fontSize: 13, fontWeight: '900', color: COLORS.accent, letterSpacing: 2 },
});
