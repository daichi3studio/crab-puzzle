/**
 * SettingsScreen — BGM / SE / Vibration toggles
 */
import React from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  TouchableOpacity, Switch, StatusBar, ScrollView,
} from 'react-native';
import { useGameStore } from '../store/gameStore';
import { COLORS } from '../constants/gameConfig';

function SettingRow({ label, sublabel, value, onToggle }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <Text style={styles.rowLabel}>{label}</Text>
        {sublabel ? <Text style={styles.rowSub}>{sublabel}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: COLORS.border, true: COLORS.accent }}
        thumbColor={value ? '#FFF' : COLORS.textDim}
        ios_backgroundColor={COLORS.border}
      />
    </View>
  );
}

export default function SettingsScreen({ navigation }) {
  const { sfxEnabled, bgmEnabled, vibrationEnabled, setSettings } = useGameStore();

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>SETTINGS</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>

        {/* Sound section */}
        <Text style={styles.section}>SOUND</Text>
        <View style={styles.card}>
          <SettingRow
            label="SOUND EFFECTS"
            sublabel="Match, combo, special block sounds"
            value={sfxEnabled}
            onToggle={v => setSettings({ sfxEnabled: v })}
          />
          <View style={styles.divider} />
          <SettingRow
            label="BACKGROUND MUSIC"
            sublabel="In-game BGM"
            value={bgmEnabled}
            onToggle={v => setSettings({ bgmEnabled: v })}
          />
        </View>

        {/* Haptics section */}
        <Text style={styles.section}>HAPTICS</Text>
        <View style={styles.card}>
          <SettingRow
            label="VIBRATION"
            sublabel="Feedback on combos and stage clear"
            value={vibrationEnabled}
            onToggle={v => setSettings({ vibrationEnabled: v })}
          />
        </View>

        {/* About section */}
        <Text style={styles.section}>ABOUT</Text>
        <View style={styles.card}>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>VERSION</Text>
            <Text style={styles.aboutValue}>1.0.0</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>GAME</Text>
            <Text style={styles.aboutValue}>CRAB PUZZLE</Text>
          </View>
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

  content: { padding: 16, gap: 8 },

  section: {
    fontSize:      9,
    fontWeight:    '800',
    color:         COLORS.textDim,
    letterSpacing: 2,
    marginTop:     8,
    marginBottom:  4,
    marginLeft:    4,
  },
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
    paddingVertical:   14,
    paddingHorizontal: 16,
    gap:               12,
  },
  rowLeft:  { flex: 1 },
  rowLabel: { fontSize: 11, fontWeight: '800', color: COLORS.text, letterSpacing: 1 },
  rowSub:   { fontSize: 9,  fontWeight: '500', color: COLORS.textDim, marginTop: 3 },
  divider:  { height: 1, backgroundColor: COLORS.border, marginLeft: 16 },

  aboutRow: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingVertical:   14,
    paddingHorizontal: 16,
  },
  aboutLabel: { fontSize: 10, fontWeight: '700', color: COLORS.textDim, letterSpacing: 1 },
  aboutValue: { fontSize: 10, fontWeight: '800', color: COLORS.textMid },
});
