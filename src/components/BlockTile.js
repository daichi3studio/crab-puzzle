import React from 'react';
import { TouchableOpacity, View, StyleSheet, Text } from 'react-native';
import CrabSprite from './CrabSprite';
import { TILE_SIZE, COLORS } from '../constants/gameConfig';

/**
 * block = { type: number, special: null|'shield'|'random' }
 * blockDef = { id, phase, char, bg, border, rare? }
 */
export default function BlockTile({ block, blockDef, selected, onPress, disabled }) {
  if (!block || !blockDef) return <View style={styles.empty} />;

  const isShield  = block.special === 'shield';
  const isRandom  = block.special === 'random';
  const isRare    = blockDef.rare;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.75}
      style={[
        styles.tile,
        { backgroundColor: blockDef.bg, borderColor: selected ? COLORS.selected : blockDef.border },
        selected && styles.selectedTile,
        isRare    && styles.rareTile,
      ]}
    >
      {/* Character sprite */}
      <CrabSprite
        phase={blockDef.phase}
        char={blockDef.char}
        size={TILE_SIZE - 10}
      />

      {/* Shield overlay */}
      {isShield && (
        <View style={styles.shieldOverlay} pointerEvents="none">
          <Text style={styles.shieldIcon}>🛡</Text>
        </View>
      )}

      {/* Random overlay */}
      {isRandom && (
        <View style={styles.randomOverlay} pointerEvents="none">
          <Text style={styles.randomIcon}>?</Text>
        </View>
      )}

      {/* Rare glow */}
      {isRare && <View style={styles.rareGlow} pointerEvents="none" />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tile: {
    width:        TILE_SIZE,
    height:       TILE_SIZE,
    borderWidth:  2,
    borderRadius: 4,
    alignItems:   'center',
    justifyContent: 'center',
    overflow:     'hidden',
  },
  empty: {
    width:  TILE_SIZE,
    height: TILE_SIZE,
  },
  selectedTile: {
    borderWidth: 3,
    transform: [{ scale: 1.06 }],
    shadowColor:  COLORS.selected,
    shadowRadius: 6,
    shadowOpacity: 0.9,
    elevation: 8,
  },
  rareTile: {
    shadowColor:  '#D4A820',
    shadowRadius: 8,
    shadowOpacity: 0.8,
    elevation: 10,
  },
  shieldOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems:   'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(136,170,255,0.35)',
  },
  shieldIcon: {
    fontSize: 14,
  },
  randomOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems:   'center',
    justifyContent: 'flex-end',
    paddingBottom: 1,
    backgroundColor: 'rgba(255,136,255,0.25)',
  },
  randomIcon: {
    fontSize:   11,
    color:      '#FF88FF',
    fontWeight: '900',
  },
  rareGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 4,
    borderWidth:  1,
    borderColor:  '#D4A820',
    backgroundColor: 'rgba(212,168,32,0.12)',
  },
});
