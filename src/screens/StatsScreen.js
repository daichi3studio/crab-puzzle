/**
 * StatsScreen — Player statistics
 */
import React from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  TouchableOpacity, StatusBar, ScrollView,
} from 'react-native';
import { useGameStore } from '../store/gameStore';
import { COLORS } from '../constants/gameConfig';
import { STAGES } from '../constants/stages';

export default function StatsScreen({ navigation }) {
  const {
    totalWins, hardWins, bestScore,
    stageProgress, clearedStages,
    bestCombo, totalStagePlays,
    unlockedChars,
  } = useGameStore();

  const totalClears   = Object.keys(clearedStages).length;
  const threeStars    = Object.values(clearedStages).filter(s => s.stars === 3).length;
  const totalStages   = STAGES.length;
  const clearRate     = totalStagePlays > 0
    ? Math.round((totalClears / totalStagePlays) * 100)
    : 0;

  const rows = [
    { label: 'STAGES CLEARED',    value: `${totalClears} / ${totalStages}` },
    { label: '3-STAR STAGES',     value: `${threeStars}` },
    { label: 'TOTAL PLAYS',       value: `${totalStagePlays}` },
    { label: 'CLEAR RATE',        value: `${clearRate}%` },
    { label: 'BEST COMBO',        value: `×${bestCombo + 1}` },
    { label: 'BEST SCORE (VS)',   value: bestScore.toLocaleString() },
    { label: 'VS WINS',           value: `${totalWins}` },
    { label: 'HARD WINS',         value: `${hardWins}` },
    { label: 'CHARS UNLOCKED',    value: `${unlockedChars.length}` },
    { label: 'HIGHEST STAGE',     value: `STAGE ${Math.min(stageProgress, totalStages)}` },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>STATS</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>

        {/* Progress bar */}
        <View style={styles.progressCard}>
          <Text style={styles.progressLabel}>ADVENTURE PROGRESS</Text>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: `${(totalClears / totalStages) * 100}%` }]} />
          </View>
          <Text style={styles.progressPct}>
            {Math.round((totalClears / totalStages) * 100)}%
          </Text>
        </View>

        {/* Stats grid */}
        <View style={styles.card}>
          {rows.map((row, i) => (
            <React.Fragment key={row.label}>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>{row.label}</Text>
                <Text style={styles.rowValue}>{row.value}</Text>
              </View>
              {i < rows.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: COLORS.bg },
  header:  {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: 14,
    paddingVertical:   12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn:      { padding: 6, marginRight: 4 },
  backText:     { fontSize: 20, color: COLORS.text },
  headerTitle:  { flex: 1, textAlign: 'center', fontSize: 13, fontWeight: '900', color: COLORS.text, letterSpacing: 3 },
  headerSpacer: { width: 32 },

  content: { padding: 16, gap: 12 },

  progressCard: {
    backgroundColor: COLORS.panel,
    borderRadius:    12,
    borderWidth:     1,
    borderColor:     COLORS.border,
    padding:         16,
    gap:             8,
  },
  progressLabel: { fontSize: 9, fontWeight: '800', color: COLORS.textDim, letterSpacing: 2 },
  barTrack: {
    height:          10,
    backgroundColor: COLORS.bg,
    borderRadius:    5,
    overflow:        'hidden',
  },
  barFill: {
    height:          '100%',
    backgroundColor: COLORS.accent,
    borderRadius:    5,
  },
  progressPct: { fontSize: 20, fontWeight: '900', color: COLORS.accent, textAlign: 'right' },

  card: {
    backgroundColor: COLORS.panel,
    borderRadius:    12,
    borderWidth:     1,
    borderColor:     COLORS.border,
    overflow:        'hidden',
  },
  row: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingVertical:   13,
    paddingHorizontal: 16,
  },
  rowLabel: { fontSize: 10, fontWeight: '700', color: COLORS.textDim, letterSpacing: 1 },
  rowValue: { fontSize: 13, fontWeight: '900', color: COLORS.text },
  divider:  { height: 1, backgroundColor: COLORS.border, marginLeft: 16 },
});
