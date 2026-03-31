import React from 'react';
import { View, StyleSheet } from 'react-native';
import CrabSprite from './CrabSprite';
import { TILE_SIZE, COLORS, SPECIAL_ROBOT, SPECIAL_PYRAMID } from '../constants/gameConfig';

/**
 * block  = { type: number, special: null|'robot'|'pyramid'|'shield' }
 * blockDef = BLOCKS[type]  (regular) or SPECIAL_ROBOT / SPECIAL_PYRAMID
 */
export default React.memo(function BlockTile({ block, blockDef, selected }) {
  if (!block || !blockDef) return <View style={styles.empty} />;

  const isRobot   = block.special === 'robot';
  const isPyramid = block.special === 'pyramid';
  const isSpecial = isRobot || isPyramid;

  const bgColor     = isRobot   ? SPECIAL_ROBOT.color
                    : isPyramid ? SPECIAL_PYRAMID.color
                    : blockDef.color;
  const borderColor = selected  ? '#FFFFFF'
                    : isPyramid ? SPECIAL_PYRAMID.accent
                    : isRobot   ? SPECIAL_ROBOT.accent
                    : blockDef.accent;

  const spritePhase = isRobot   ? 3 : isPyramid ? 3 : blockDef.phase;
  const spriteChar  = isRobot   ? 'robot' : isPyramid ? 'pyramid' : blockDef.char;

  return (
    <View style={[
      styles.tile,
      { backgroundColor: bgColor, borderColor },
      selected  && styles.selected,
      isPyramid && styles.pyramid,
    ]}>
      <CrabSprite phase={spritePhase} char={spriteChar} size={TILE_SIZE - 10} />

      {/* Subtle shine overlay */}
      <View style={styles.shine} pointerEvents="none" />

      {/* Pyramid glow ring */}
      {isPyramid && <View style={styles.pyramidGlow} pointerEvents="none" />}
    </View>
  );
});

const styles = StyleSheet.create({
  tile: {
    width:          TILE_SIZE,
    height:         TILE_SIZE,
    borderWidth:    2,
    borderRadius:   8,
    alignItems:     'center',
    justifyContent: 'center',
    overflow:       'hidden',
  },
  empty: {
    width:  TILE_SIZE,
    height: TILE_SIZE,
  },
  selected: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor:   '#FFFFFF',
    shadowRadius:  8,
    shadowOpacity: 0.6,
    elevation:     8,
    transform:     [{ scale: 1.08 }],
  },
  pyramid: {
    shadowColor:   '#D4A820',
    shadowRadius:  10,
    shadowOpacity: 0.8,
    elevation:     10,
  },
  shine: {
    ...StyleSheet.absoluteFillObject,
    borderRadius:    8,
    backgroundColor: 'transparent',
    borderTopWidth:  1,
    borderTopColor:  'rgba(255,255,255,0.2)',
  },
  pyramidGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius:    8,
    borderWidth:     1,
    borderColor:     'rgba(212,168,32,0.5)',
    backgroundColor: 'rgba(212,168,32,0.08)',
  },
});
