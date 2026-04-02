/**
 * CrabSprite — Pure View-based pixel art (zero SVG dependency).
 *
 * Each character is rendered with ~5-12 lightweight <View> elements using
 * borderRadius and backgroundColor. This eliminates the heavy react-native-svg
 * tree (previously 15-35 SVG nodes per tile × 56 tiles = 840-1960 SVG elements)
 * and cuts JS reconciler work by ~80% during cascades.
 *
 * @param {{ phase: 1|2|3, char?: string|null, facingLeft?: boolean, size?: number }} props
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';

const BG = '#F5EDD8';

// Absolute-positioned rectangle helper
const B = ({ x, y, w, h, c, r: br }) => (
  <View
    style={{
      position: 'absolute',
      left:            x,
      top:             y,
      width:           w,
      height:          h,
      backgroundColor: c,
      borderRadius:    br ?? 0,
    }}
  />
);

export default React.memo(function CrabSprite({ phase, char = null, facingLeft = false, size = 48 }) {
  const p = Number(phase);
  const s = size / 56; // scale from 56×56 logical to actual size
  const flip = facingLeft ? [{ scaleX: -1 }] : undefined;

  let content;
  if (p === 1)      content = <Bit s={s} />;
  else if (p === 2) content = <Core s={s} />;
  else {
    const key = char ? String(char).toLowerCase() : 'chip';
    switch (key) {
      case 'chip':    content = <Chip s={s} />;    break;
      case 'wing':    content = <Wing s={s} />;    break;
      case 'gentle':  content = <Gentle s={s} />;  break;
      case 'power':   content = <Power s={s} />;   break;
      case 'pink':    content = <Pink s={s} />;    break;
      case 'robot':   content = <Robot s={s} />;   break;
      case 'pyramid': content = <Pyramid s={s} />; break;
      default:        content = <Chip s={s} />;    break;
    }
  }

  return (
    <View style={[{ width: size, height: size }, flip && { transform: flip }]}>
      {content}
    </View>
  );
});

// ═══════════════════════════════════════════════════════════════════
// Each sprite: body, eyes, claws, legs — all as simple rectangles
// Coordinates are in 56×56 space, scaled by `s`
// ═══════════════════════════════════════════════════════════════════

function Bit({ s }) {
  return (
    <>
      {/* Body */}
      <B x={12*s} y={18*s} w={32*s} h={28*s} c="#2A2A2A" r={4*s} />
      {/* Face plate */}
      <B x={16*s} y={22*s} w={24*s} h={18*s} c="#CCCCCC" r={3*s} />
      {/* Claws */}
      <B x={2*s}  y={24*s} w={10*s} h={5*s}  c="#888888" r={2*s} />
      <B x={44*s} y={24*s} w={10*s} h={5*s}  c="#888888" r={2*s} />
      {/* Eyes */}
      <B x={18*s} y={28*s} w={6*s}  h={6*s}  c={BG}      r={2*s} />
      <B x={32*s} y={28*s} w={6*s}  h={6*s}  c={BG}      r={2*s} />
      <B x={20*s} y={30*s} w={3*s}  h={3*s}  c="#2A2A2A" r={1*s} />
      <B x={34*s} y={30*s} w={3*s}  h={3*s}  c="#2A2A2A" r={1*s} />
      {/* Legs */}
      <B x={12*s} y={46*s} w={5*s}  h={6*s}  c="#555555" r={1*s} />
      <B x={39*s} y={46*s} w={5*s}  h={6*s}  c="#555555" r={1*s} />
    </>
  );
}

function Core({ s }) {
  return (
    <>
      {/* Antennae */}
      <B x={19*s} y={9*s}  w={6*s}  h={10*s} c="#E8703A" r={3*s} />
      <B x={31*s} y={9*s}  w={6*s}  h={10*s} c="#E8703A" r={3*s} />
      {/* Body */}
      <B x={14*s} y={22*s} w={28*s} h={22*s} c="#D4541A" r={5*s} />
      <B x={14*s} y={22*s} w={28*s} h={8*s}  c="#E8703A" r={5*s} />
      {/* Belly */}
      <B x={18*s} y={32*s} w={20*s} h={10*s} c="#F09060" r={3*s} />
      {/* Claws */}
      <B x={2*s}  y={22*s} w={12*s} h={10*s} c="#C04010" r={3*s} />
      <B x={42*s} y={22*s} w={12*s} h={10*s} c="#C04010" r={3*s} />
      <B x={4*s}  y={24*s} w={5*s}  h={3*s}  c={BG}      r={1*s} />
      <B x={47*s} y={24*s} w={5*s}  h={3*s}  c={BG}      r={1*s} />
      {/* Eyes */}
      <B x={19*s} y={25*s} w={7*s}  h={7*s}  c={BG}      r={3*s} />
      <B x={30*s} y={25*s} w={7*s}  h={7*s}  c={BG}      r={3*s} />
      <B x={21*s} y={27*s} w={4*s}  h={4*s}  c="#2A2A2A" r={2*s} />
      <B x={32*s} y={27*s} w={4*s}  h={4*s}  c="#2A2A2A" r={2*s} />
      {/* Legs */}
      <B x={14*s} y={44*s} w={5*s}  h={10*s} c="#C04010" r={1*s} />
      <B x={37*s} y={44*s} w={5*s}  h={10*s} c="#C04010" r={1*s} />
    </>
  );
}

function Chip({ s }) {
  return (
    <>
      {/* Antennae */}
      <B x={21*s} y={10*s} w={4*s}  h={10*s} c="#1A5A90" r={2*s} />
      <B x={33*s} y={10*s} w={4*s}  h={10*s} c="#1A5A90" r={2*s} />
      {/* Body */}
      <B x={12*s} y={18*s} w={32*s} h={22*s} c="#2B7AB8" r={5*s} />
      <B x={12*s} y={18*s} w={32*s} h={8*s}  c="#4A9AD4" r={5*s} />
      {/* Claws */}
      <B x={2*s}  y={20*s} w={12*s} h={10*s} c="#1A5A90" r={3*s} />
      <B x={42*s} y={20*s} w={12*s} h={10*s} c="#1A5A90" r={3*s} />
      <B x={4*s}  y={22*s} w={4*s}  h={2*s}  c={BG}      r={1*s} />
      <B x={48*s} y={22*s} w={4*s}  h={2*s}  c={BG}      r={1*s} />
      {/* Eyes — rectangular with border-look */}
      <B x={17*s} y={21*s} w={8*s}  h={7*s}  c={BG}      r={2*s} />
      <B x={31*s} y={21*s} w={8*s}  h={7*s}  c={BG}      r={2*s} />
      <B x={20*s} y={23*s} w={3*s}  h={3*s}  c="#2A2A2A" r={1*s} />
      <B x={34*s} y={23*s} w={3*s}  h={3*s}  c="#2A2A2A" r={1*s} />
      {/* Nose bridge */}
      <B x={26*s} y={23*s} w={4*s}  h={2*s}  c="#2A2A2A" r={1*s} />
      {/* Legs */}
      <B x={14*s} y={40*s} w={5*s}  h={9*s}  c="#1A5A90" r={1*s} />
      <B x={37*s} y={40*s} w={5*s}  h={9*s}  c="#1A5A90" r={1*s} />
    </>
  );
}

function Wing({ s }) {
  return (
    <>
      {/* Wings (triangular feel via overlapping rounded rects) */}
      <B x={1*s}  y={16*s} w={13*s} h={16*s} c="#C8E890" r={6*s} />
      <B x={42*s} y={16*s} w={13*s} h={16*s} c="#C8E890" r={6*s} />
      <B x={3*s}  y={18*s} w={10*s} h={12*s} c="#A8D870" r={5*s} />
      <B x={43*s} y={18*s} w={10*s} h={12*s} c="#A8D870" r={5*s} />
      {/* Body */}
      <B x={14*s} y={18*s} w={28*s} h={22*s} c="#58A840" r={5*s} />
      <B x={14*s} y={18*s} w={28*s} h={8*s}  c="#78C858" r={5*s} />
      <B x={18*s} y={28*s} w={20*s} h={10*s} c="#90D870" r={3*s} />
      {/* Claws */}
      <B x={2*s}  y={24*s} w={12*s} h={6*s}  c="#3A8028" r={3*s} />
      <B x={42*s} y={24*s} w={12*s} h={6*s}  c="#3A8028" r={3*s} />
      <B x={3*s}  y={25*s} w={4*s}  h={2*s}  c={BG}      r={1*s} />
      <B x={49*s} y={25*s} w={4*s}  h={2*s}  c={BG}      r={1*s} />
      {/* Eyes */}
      <B x={18*s} y={21*s} w={7*s}  h={7*s}  c={BG}      r={3*s} />
      <B x={31*s} y={21*s} w={7*s}  h={7*s}  c={BG}      r={3*s} />
      <B x={20*s} y={23*s} w={3*s}  h={3*s}  c="#2A2A2A" r={1*s} />
      <B x={33*s} y={23*s} w={3*s}  h={3*s}  c="#2A2A2A" r={1*s} />
      {/* Legs */}
      <B x={16*s} y={40*s} w={5*s}  h={9*s}  c="#3A8028" r={1*s} />
      <B x={35*s} y={40*s} w={5*s}  h={9*s}  c="#3A8028" r={1*s} />
    </>
  );
}

function Gentle({ s }) {
  return (
    <>
      {/* Hat */}
      <B x={18*s} y={4*s}  w={20*s} h={12*s} c="#2A2A2A" r={4*s} />
      <B x={14*s} y={14*s} w={28*s} h={4*s}  c="#444444" r={2*s} />
      {/* Body */}
      <B x={13*s} y={18*s} w={30*s} h={22*s} c="#4A4A4A" r={5*s} />
      <B x={13*s} y={18*s} w={30*s} h={8*s}  c="#606060" r={5*s} />
      {/* Bowtie */}
      <B x={24*s} y={22*s} w={8*s}  h={6*s}  c={BG}      r={2*s} />
      <B x={23*s} y={24*s} w={4*s}  h={3*s}  c="#C03020" r={2*s} />
      <B x={29*s} y={24*s} w={4*s}  h={3*s}  c="#C03020" r={2*s} />
      {/* Claws */}
      <B x={2*s}  y={20*s} w={11*s} h={8*s}  c="#333333" r={3*s} />
      <B x={43*s} y={20*s} w={11*s} h={8*s}  c="#333333" r={3*s} />
      <B x={2*s}  y={21*s} w={4*s}  h={2*s}  c={BG}      r={1*s} />
      <B x={50*s} y={21*s} w={4*s}  h={2*s}  c={BG}      r={1*s} />
      {/* Eyes */}
      <B x={17*s} y={21*s} w={7*s}  h={7*s}  c={BG}      r={3*s} />
      <B x={32*s} y={21*s} w={7*s}  h={7*s}  c={BG}      r={3*s} />
      <B x={19*s} y={23*s} w={3*s}  h={3*s}  c="#2A2A2A" r={1*s} />
      <B x={34*s} y={23*s} w={3*s}  h={3*s}  c="#2A2A2A" r={1*s} />
      {/* Mustache */}
      <B x={21*s} y={32*s} w={14*s} h={2*s}  c="#2A2A2A" r={1*s} />
      {/* Legs */}
      <B x={15*s} y={40*s} w={5*s}  h={9*s}  c="#333333" r={1*s} />
      <B x={36*s} y={40*s} w={5*s}  h={9*s}  c="#333333" r={1*s} />
    </>
  );
}

function Power({ s }) {
  return (
    <>
      {/* Big claws */}
      <B x={0*s}  y={16*s} w={14*s} h={16*s} c="#7A0C0C" r={4*s} />
      <B x={42*s} y={16*s} w={14*s} h={16*s} c="#7A0C0C" r={4*s} />
      <B x={0*s}  y={19*s} w={9*s}  h={5*s}  c="#9E1A1A" r={2*s} />
      <B x={47*s} y={19*s} w={9*s}  h={5*s}  c="#9E1A1A" r={2*s} />
      <B x={4*s}  y={22*s} w={6*s}  h={3*s}  c={BG}      r={1*s} />
      <B x={46*s} y={22*s} w={6*s}  h={3*s}  c={BG}      r={1*s} />
      {/* Body */}
      <B x={14*s} y={16*s} w={28*s} h={26*s} c="#B01818" r={5*s} />
      <B x={14*s} y={16*s} w={28*s} h={9*s}  c="#CC2828" r={5*s} />
      {/* Battle scars */}
      <B x={20*s} y={28*s} w={16*s} h={2*s}  c="#8C1010" r={1*s} />
      <B x={20*s} y={33*s} w={16*s} h={2*s}  c="#8C1010" r={1*s} />
      {/* Angry eyes (with brow) */}
      <B x={17*s} y={18*s} w={10*s} h={2*s}  c="#2A2A2A" r={1*s} />
      <B x={29*s} y={18*s} w={10*s} h={2*s}  c="#2A2A2A" r={1*s} />
      <B x={18*s} y={19*s} w={8*s}  h={6*s}  c={BG}      r={2*s} />
      <B x={30*s} y={19*s} w={8*s}  h={6*s}  c={BG}      r={2*s} />
      <B x={20*s} y={21*s} w={4*s}  h={3*s}  c="#2A2A2A" r={1*s} />
      <B x={32*s} y={21*s} w={4*s}  h={3*s}  c="#2A2A2A" r={1*s} />
      {/* Legs */}
      <B x={15*s} y={42*s} w={6*s}  h={10*s} c="#7A0C0C" r={1*s} />
      <B x={35*s} y={42*s} w={6*s}  h={10*s} c="#7A0C0C" r={1*s} />
    </>
  );
}

function Pink({ s }) {
  return (
    <>
      {/* Ears/ribbons */}
      <B x={16*s} y={6*s}  w={10*s} h={7*s}  c="#F070A0" r={5*s} />
      <B x={30*s} y={6*s}  w={10*s} h={7*s}  c="#F070A0" r={5*s} />
      {/* Body */}
      <B x={13*s} y={16*s} w={30*s} h={24*s} c="#F898BC" r={6*s} />
      <B x={13*s} y={16*s} w={30*s} h={10*s} c="#FAB0CC" r={6*s} />
      {/* Blush */}
      <B x={15*s} y={27*s} w={8*s}  h={6*s}  c="#F8C0D0" r={3*s} />
      <B x={33*s} y={27*s} w={8*s}  h={6*s}  c="#F8C0D0" r={3*s} />
      {/* Claws */}
      <B x={3*s}  y={22*s} w={10*s} h={8*s}  c="#F070A0" r={3*s} />
      <B x={43*s} y={22*s} w={10*s} h={8*s}  c="#F070A0" r={3*s} />
      <B x={4*s}  y={26*s} w={4*s}  h={2*s}  c={BG}      r={1*s} />
      <B x={48*s} y={26*s} w={4*s}  h={2*s}  c={BG}      r={1*s} />
      {/* Smile */}
      <B x={22*s} y={31*s} w={12*s} h={2*s}  c="#E04878" r={1*s} />
      {/* Big round eyes */}
      <B x={17*s} y={20*s} w={9*s}  h={9*s}  c={BG}      r={4*s} />
      <B x={30*s} y={20*s} w={9*s}  h={9*s}  c={BG}      r={4*s} />
      <B x={19*s} y={22*s} w={5*s}  h={5*s}  c="#2A2A2A" r={2*s} />
      <B x={32*s} y={22*s} w={5*s}  h={5*s}  c="#2A2A2A" r={2*s} />
      <B x={20*s} y={23*s} w={2*s}  h={2*s}  c={BG}      r={1*s} />
      <B x={33*s} y={23*s} w={2*s}  h={2*s}  c={BG}      r={1*s} />
      {/* Legs */}
      <B x={16*s} y={40*s} w={5*s}  h={10*s} c="#F070A0" r={1*s} />
      <B x={35*s} y={40*s} w={5*s}  h={10*s} c="#F070A0" r={1*s} />
    </>
  );
}

function Robot({ s }) {
  return (
    <>
      {/* Antenna */}
      <B x={26*s} y={4*s}  w={4*s}  h={12*s} c="#AAAAAA" r={2*s} />
      <B x={25*s} y={2*s}  w={6*s}  h={5*s}  c="#88FFCC" r={3*s} />
      {/* Body */}
      <B x={10*s} y={16*s} w={36*s} h={26*s} c="#E8E8E8" r={4*s} />
      <B x={10*s} y={16*s} w={36*s} h={8*s}  c="#CCCCCC" r={4*s} />
      {/* Panel lights */}
      <B x={20*s} y={30*s} w={4*s}  h={3*s}  c="#88CCFF" r={1*s} />
      <B x={26*s} y={30*s} w={4*s}  h={3*s}  c="#FF8888" r={1*s} />
      <B x={32*s} y={30*s} w={4*s}  h={3*s}  c="#88FF88" r={1*s} />
      {/* Visor */}
      <B x={14*s} y={19*s} w={28*s} h={8*s}  c="#1A1A1A" r={3*s} />
      <B x={24*s} y={20*s} w={8*s}  h={5*s}  c="#00FFCC" r={2*s} />
      {/* Claws */}
      <B x={0*s}  y={18*s} w={10*s} h={12*s} c="#BBBBBB" r={3*s} />
      <B x={46*s} y={18*s} w={10*s} h={12*s} c="#BBBBBB" r={3*s} />
      <B x={4*s}  y={23*s} w={4*s}  h={3*s}  c={BG}      r={1*s} />
      <B x={48*s} y={23*s} w={4*s}  h={3*s}  c={BG}      r={1*s} />
      {/* Legs */}
      <B x={14*s} y={42*s} w={6*s}  h={12*s} c="#CCCCCC" r={1*s} />
      <B x={36*s} y={42*s} w={6*s}  h={12*s} c="#CCCCCC" r={1*s} />
    </>
  );
}

function Pyramid({ s }) {
  const gold  = '#D4A820';
  const dpurp = '#3A1060';
  const lGold = '#F0CC60';
  return (
    <>
      {/* Pyramid body (triangle approximation) */}
      <B x={16*s} y={8*s}  w={24*s} h={40*s} c={dpurp}   r={3*s} />
      <B x={20*s} y={12*s} w={16*s} h={32*s} c="#4A1878"  r={2*s} />
      {/* Gold trim */}
      <B x={15*s} y={8*s}  w={26*s} h={3*s}  c={gold}     r={1*s} />
      <B x={13*s} y={45*s} w={30*s} h={3*s}  c={gold}     r={1*s} />
      <B x={27*s} y={8*s}  w={2*s}  h={40*s} c={gold} />
      {/* Eye */}
      <B x={20*s} y={22*s} w={16*s} h={12*s} c={lGold}    r={6*s} />
      <B x={23*s} y={24*s} w={10*s} h={8*s}  c="#1A0830"   r={4*s} />
      <B x={25*s} y={26*s} w={6*s}  h={4*s}  c={gold}      r={2*s} />
      {/* Claws (small diamond shapes) */}
      <B x={2*s}  y={26*s} w={12*s} h={12*s} c={dpurp}    r={4*s} />
      <B x={42*s} y={26*s} w={12*s} h={12*s} c={dpurp}    r={4*s} />
      <B x={4*s}  y={29*s} w={8*s}  h={6*s}  c={gold}     r={2*s} />
      <B x={44*s} y={29*s} w={8*s}  h={6*s}  c={gold}     r={2*s} />
      {/* Legs */}
      <B x={14*s} y={46*s} w={5*s}  h={8*s}  c={dpurp}    r={1*s} />
      <B x={37*s} y={46*s} w={5*s}  h={8*s}  c={dpurp}    r={1*s} />
    </>
  );
}
