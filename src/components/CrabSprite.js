import Svg, { Ellipse, Path, Polygon, Rect } from 'react-native-svg';

/** 56×56 logical canvas, displayed at given size */
const BG = '#F5EDD8';

const DR = ({ x, y, w, h, c, a }) => (
  <Rect x={x} y={y} width={w} height={h} fill={c} opacity={a ?? 1} />
);

const pts = (arr) => arr.map(([x, y]) => `${x},${y}`).join(' ');

const S = ({ facingLeft, children, size }) => (
  <Svg
    width={size} height={size} viewBox="0 0 56 56"
    style={facingLeft ? { transform: [{ scaleX: -1 }] } : undefined}
  >
    {children}
  </Svg>
);

/**
 * @param {{ phase: 1|2|3, char?: string|null, facingLeft?: boolean, size?: number }} props
 */
export default function CrabSprite({ phase, char = null, facingLeft = false, size = 48 }) {
  const p = Number(phase);
  if (p === 1) return <BitSprite    facingLeft={facingLeft} size={size} />;
  if (p === 2) return <CoreSprite   facingLeft={facingLeft} size={size} />;
  return <P3Sprite char={char} facingLeft={facingLeft} size={size} />;
}

// ─── P1  Bit ─────────────────────────────────────────────────────
function BitSprite({ facingLeft, size }) {
  return (
    <S facingLeft={facingLeft} size={size}>
      <DR x={12} y={18} w={32} h={28} c="#2A2A2A" />
      <DR x={16} y={22} w={24} h={18} c="#CCCCCC" />
      <DR x={2}  y={24} w={10} h={5}  c="#888888" />
      <DR x={44} y={24} w={10} h={5}  c="#888888" />
      <DR x={12} y={46} w={5}  h={6}  c="#555555" />
      <DR x={19} y={48} w={4}  h={4}  c="#555555" />
      <DR x={33} y={48} w={4}  h={4}  c="#555555" />
      <DR x={39} y={46} w={5}  h={6}  c="#555555" />
      <DR x={18} y={28} w={6}  h={6}  c={BG} />
      <DR x={32} y={28} w={6}  h={6}  c={BG} />
      <DR x={20} y={30} w={3}  h={3}  c="#2A2A2A" />
      <DR x={34} y={30} w={3}  h={3}  c="#2A2A2A" />
    </S>
  );
}

// ─── P2  Core ────────────────────────────────────────────────────
function CoreSprite({ facingLeft, size }) {
  return (
    <S facingLeft={facingLeft} size={size}>
      <DR x={22} y={11} w={2}  h={12} c="#A83010" />
      <DR x={32} y={11} w={2}  h={12} c="#A83010" />
      <DR x={19} y={9}  w={6}  h={5}  c="#E8703A" />
      <DR x={31} y={9}  w={6}  h={5}  c="#E8703A" />
      <DR x={2}  y={20} w={10} h={6}  c="#D4541A" />
      <DR x={2}  y={26} w={12} h={7}  c="#C04010" />
      <DR x={4}  y={24} w={5}  h={3}  c={BG} />
      <DR x={44} y={20} w={10} h={6}  c="#D4541A" />
      <DR x={42} y={26} w={12} h={7}  c="#C04010" />
      <DR x={47} y={24} w={5}  h={3}  c={BG} />
      <DR x={14} y={22} w={28} h={22} c="#D4541A" />
      <DR x={14} y={22} w={28} h={8}  c="#E8703A" />
      <DR x={18} y={32} w={20} h={10} c="#F09060" />
      <DR x={14} y={44} w={5}  h={10} c="#C04010" />
      <DR x={21} y={46} w={4}  h={8}  c="#C04010" />
      <DR x={31} y={46} w={4}  h={8}  c="#C04010" />
      <DR x={37} y={44} w={5}  h={10} c="#C04010" />
      <DR x={19} y={25} w={7}  h={7}  c={BG} />
      <DR x={30} y={25} w={7}  h={7}  c={BG} />
      <DR x={21} y={27} w={4}  h={4}  c="#2A2A2A" />
      <DR x={32} y={27} w={4}  h={4}  c="#2A2A2A" />
      <DR x={22} y={28} w={1}  h={1}  c={BG} />
      <DR x={33} y={28} w={1}  h={1}  c={BG} />
    </S>
  );
}

// ─── P3 dispatch ─────────────────────────────────────────────────
function P3Sprite({ char, facingLeft, size }) {
  const key = char ? String(char).toLowerCase() : 'chip';
  switch (key) {
    case 'chip':    return <ChipSprite     facingLeft={facingLeft} size={size} />;
    case 'wing':    return <WingSprite     facingLeft={facingLeft} size={size} />;
    case 'gentle':  return <GentleSprite   facingLeft={facingLeft} size={size} />;
    case 'power':   return <PowerSprite    facingLeft={facingLeft} size={size} />;
    case 'pink':    return <PinkSprite     facingLeft={facingLeft} size={size} />;
    case 'robot':   return <RobotSprite    facingLeft={facingLeft} size={size} />;
    case 'pyramid': return <TriangleSprite facingLeft={facingLeft} size={size} />;
    default:        return <ChipSprite     facingLeft={facingLeft} size={size} />;
  }
}

// ─── Chip ────────────────────────────────────────────────────────
function ChipSprite({ facingLeft, size }) {
  return (
    <S facingLeft={facingLeft} size={size}>
      <DR x={21} y={10} w={2}  h={10} c="#1A5A90" />
      <DR x={33} y={10} w={2}  h={10} c="#1A5A90" />
      <DR x={12} y={18} w={32} h={22} c="#2B7AB8" />
      <DR x={12} y={18} w={32} h={8}  c="#4A9AD4" />
      <DR x={16} y={28} w={24} h={10} c="#3A90C8" />
      <DR x={0}  y={18} w={8}  h={5}  c="#2B7AB8" />
      <DR x={2}  y={22} w={12} h={6}  c="#1A5A90" />
      <DR x={4}  y={21} w={4}  h={2}  c={BG} />
      <DR x={48} y={18} w={8}  h={5}  c="#2B7AB8" />
      <DR x={42} y={22} w={12} h={6}  c="#1A5A90" />
      <DR x={44} y={21} w={4}  h={2}  c={BG} />
      <DR x={14} y={40} w={4}  h={9}  c="#1A5A90" />
      <DR x={20} y={42} w={4}  h={7}  c="#1A5A90" />
      <DR x={32} y={42} w={4}  h={7}  c="#1A5A90" />
      <DR x={38} y={40} w={4}  h={9}  c="#1A5A90" />
      <DR x={17} y={21} w={8}  h={7}  c={BG} />
      <DR x={31} y={21} w={8}  h={7}  c={BG} />
      <DR x={20} y={23} w={3}  h={3}  c="#2A2A2A" />
      <DR x={34} y={23} w={3}  h={3}  c="#2A2A2A" />
      <Rect x={16} y={20} width={10} height={9} fill="none" stroke="#2A2A2A" strokeWidth={0.9} />
      <Rect x={30} y={20} width={10} height={9} fill="none" stroke="#2A2A2A" strokeWidth={0.9} />
      <DR x={26} y={23} w={4}  h={2}  c="#2A2A2A" />
    </S>
  );
}

// ─── Wing ────────────────────────────────────────────────────────
function WingSprite({ facingLeft, size }) {
  return (
    <S facingLeft={facingLeft} size={size}>
      <Polygon points={pts([[2,14],[14,22],[12,32],[6,36],[0,28]])}    fill="#C8E890" />
      <Polygon points={pts([[4,16],[14,22],[12,30],[7,33],[2,26]])}    fill="#A8D870" />
      <Polygon points={pts([[6,18],[14,22],[13,28],[9,30],[5,25]])}    fill="#88C050" />
      <Polygon points={pts([[54,14],[42,22],[44,32],[50,36],[56,28]])} fill="#C8E890" />
      <Polygon points={pts([[52,16],[42,22],[44,30],[49,33],[54,26]])} fill="#A8D870" />
      <Polygon points={pts([[50,18],[42,22],[43,28],[47,30],[51,25]])} fill="#88C050" />
      <DR x={14} y={18} w={28} h={22} c="#58A840" />
      <DR x={14} y={18} w={28} h={8}  c="#78C858" />
      <DR x={18} y={28} w={20} h={10} c="#90D870" />
      <DR x={4}  y={26} w={10} h={5}  c="#3A8028" />
      <DR x={2}  y={22} w={7}  h={5}  c="#58A840" />
      <DR x={3}  y={25} w={4}  h={2}  c={BG} />
      <DR x={42} y={26} w={10} h={5}  c="#3A8028" />
      <DR x={47} y={22} w={7}  h={5}  c="#58A840" />
      <DR x={49} y={25} w={4}  h={2}  c={BG} />
      <DR x={16} y={40} w={4}  h={9}  c="#3A8028" />
      <DR x={22} y={42} w={3}  h={7}  c="#3A8028" />
      <DR x={31} y={42} w={3}  h={7}  c="#3A8028" />
      <DR x={36} y={40} w={4}  h={9}  c="#3A8028" />
      <DR x={18} y={21} w={7}  h={7}  c={BG} />
      <DR x={31} y={21} w={7}  h={7}  c={BG} />
      <DR x={20} y={23} w={3}  h={3}  c="#2A2A2A" />
      <DR x={33} y={23} w={3}  h={3}  c="#2A2A2A" />
    </S>
  );
}

// ─── Gentle ──────────────────────────────────────────────────────
function GentleSprite({ facingLeft, size }) {
  return (
    <S facingLeft={facingLeft} size={size}>
      <DR x={18} y={2}  w={20} h={14} c="#2A2A2A" />
      <DR x={14} y={14} w={28} h={4}  c="#444444" />
      <DR x={13} y={18} w={30} h={22} c="#4A4A4A" />
      <DR x={13} y={18} w={30} h={8}  c="#606060" />
      <DR x={24} y={22} w={8}  h={16} c={BG} />
      <DR x={23} y={26} w={4}  h={3}  c="#C03020" />
      <DR x={29} y={26} w={4}  h={3}  c="#C03020" />
      <DR x={27} y={27} w={2}  h={2}  c="#E04030" />
      <DR x={0}  y={18} w={7}  h={5}  c="#4A4A4A" />
      <DR x={2}  y={22} w={11} h={6}  c="#333333" />
      <DR x={2}  y={21} w={4}  h={2}  c={BG} />
      <DR x={49} y={18} w={7}  h={5}  c="#4A4A4A" />
      <DR x={43} y={22} w={11} h={6}  c="#333333" />
      <DR x={50} y={21} w={4}  h={2}  c={BG} />
      <DR x={21} y={32} w={5}  h={2}  c="#2A2A2A" />
      <DR x={30} y={32} w={5}  h={2}  c="#2A2A2A" />
      <DR x={26} y={33} w={4}  h={2}  c="#2A2A2A" />
      <DR x={15} y={40} w={4}  h={9}  c="#333333" />
      <DR x={21} y={42} w={3}  h={7}  c="#333333" />
      <DR x={32} y={42} w={3}  h={7}  c="#333333" />
      <DR x={37} y={40} w={4}  h={9}  c="#333333" />
      <DR x={17} y={21} w={7}  h={7}  c={BG} />
      <DR x={32} y={21} w={7}  h={7}  c={BG} />
      <DR x={19} y={23} w={3}  h={3}  c="#2A2A2A" />
      <DR x={34} y={23} w={3}  h={3}  c="#2A2A2A" />
    </S>
  );
}

// ─── Power ───────────────────────────────────────────────────────
function PowerSprite({ facingLeft, size }) {
  return (
    <S facingLeft={facingLeft} size={size}>
      <DR x={0}  y={16} w={14} h={16} c="#7A0C0C" />
      <DR x={42} y={16} w={14} h={16} c="#7A0C0C" />
      <DR x={0}  y={19} w={9}  h={5}  c="#9E1A1A" />
      <DR x={47} y={19} w={9}  h={5}  c="#9E1A1A" />
      <DR x={4}  y={22} w={6}  h={3}  c={BG} />
      <DR x={46} y={22} w={6}  h={3}  c={BG} />
      <DR x={10} y={22} w={8}  h={8}  c="#8C1010" />
      <DR x={38} y={22} w={8}  h={8}  c="#8C1010" />
      <DR x={14} y={16} w={28} h={26} c="#B01818" />
      <DR x={14} y={16} w={28} h={9}  c="#CC2828" />
      <DR x={20} y={28} w={16} h={3}  c="#8C1010" />
      <DR x={20} y={33} w={16} h={3}  c="#8C1010" />
      <DR x={27} y={28} w={2}  h={8}  c="#8C1010" />
      <DR x={15} y={42} w={6}  h={10} c="#7A0C0C" />
      <DR x={23} y={44} w={5}  h={8}  c="#7A0C0C" />
      <DR x={28} y={44} w={5}  h={8}  c="#7A0C0C" />
      <DR x={35} y={42} w={6}  h={10} c="#7A0C0C" />
      <DR x={18} y={19} w={8}  h={6}  c={BG} />
      <DR x={30} y={19} w={8}  h={6}  c={BG} />
      <DR x={17} y={18} w={10} h={2}  c="#2A2A2A" />
      <DR x={29} y={18} w={10} h={2}  c="#2A2A2A" />
      <DR x={20} y={21} w={4}  h={3}  c="#2A2A2A" />
      <DR x={32} y={21} w={4}  h={3}  c="#2A2A2A" />
    </S>
  );
}

// ─── Pink ────────────────────────────────────────────────────────
function PinkSprite({ facingLeft, size }) {
  return (
    <S facingLeft={facingLeft} size={size}>
      <DR x={16} y={6}  w={10} h={7}  c="#F070A0" />
      <DR x={30} y={6}  w={10} h={7}  c="#F070A0" />
      <DR x={22} y={8}  w={12} h={5}  c="#F898BC" />
      <DR x={13} y={16} w={30} h={24} c="#F898BC" />
      <DR x={13} y={16} w={30} h={10} c="#FAB0CC" />
      <Ellipse cx={19} cy={30} rx={4} ry={3} fill="#F8C0D0" />
      <Ellipse cx={37} cy={30} rx={4} ry={3} fill="#F8C0D0" />
      <DR x={3}  y={22} w={10} h={8}  c="#F070A0" />
      <DR x={2}  y={24} w={6}  h={3}  c="#F898BC" />
      <DR x={4}  y={26} w={4}  h={2}  c={BG} />
      <DR x={43} y={22} w={10} h={8}  c="#F070A0" />
      <DR x={48} y={24} w={6}  h={3}  c="#F898BC" />
      <DR x={48} y={26} w={4}  h={2}  c={BG} />
      <DR x={23} y={32} w={10} h={2}  c="#E04878" />
      <DR x={22} y={30} w={2}  h={2}  c="#E04878" />
      <DR x={32} y={30} w={2}  h={2}  c="#E04878" />
      <DR x={16} y={40} w={5}  h={10} c="#F070A0" />
      <DR x={23} y={42} w={4}  h={8}  c="#F070A0" />
      <DR x={29} y={42} w={4}  h={8}  c="#F070A0" />
      <DR x={35} y={40} w={5}  h={10} c="#F070A0" />
      <DR x={17} y={20} w={9}  h={9}  c={BG} />
      <DR x={30} y={20} w={9}  h={9}  c={BG} />
      <DR x={19} y={22} w={5}  h={5}  c="#2A2A2A" />
      <DR x={32} y={22} w={5}  h={5}  c="#2A2A2A" />
      <DR x={20} y={23} w={2}  h={2}  c={BG} />
      <DR x={33} y={23} w={2}  h={2}  c={BG} />
    </S>
  );
}

// ─── Robot ───────────────────────────────────────────────────────
function RobotSprite({ facingLeft, size }) {
  return (
    <S facingLeft={facingLeft} size={size}>
      <DR x={26} y={4}  w={4}  h={12} c="#AAAAAA" />
      <Ellipse cx={28} cy={4} rx={3} ry={3} fill="#88FFCC" />
      <DR x={10} y={16} w={36} h={26} c="#E8E8E8" />
      <DR x={10} y={16} w={36} h={8}  c="#CCCCCC" />
      <DR x={12} y={18} w={3}  h={3}  c="#888888" />
      <DR x={41} y={18} w={3}  h={3}  c="#888888" />
      <DR x={12} y={38} w={3}  h={3}  c="#888888" />
      <DR x={41} y={38} w={3}  h={3}  c="#888888" />
      <DR x={18} y={28} w={20} h={10} c="#DDDDDD" />
      <DR x={20} y={30} w={4}  h={3}  c="#88CCFF" />
      <DR x={26} y={30} w={4}  h={3}  c="#FF8888" />
      <DR x={32} y={30} w={4}  h={3}  c="#88FF88" />
      <DR x={22} y={34} w={12} h={2}  c="#AAAAAA" />
      <DR x={0}  y={18} w={10} h={6}  c="#BBBBBB" />
      <DR x={0}  y={24} w={10} h={6}  c="#999999" />
      <DR x={4}  y={23} w={4}  h={3}  c={BG} />
      <DR x={10} y={22} w={4}  h={10} c="#AAAAAA" />
      <DR x={46} y={18} w={10} h={6}  c="#BBBBBB" />
      <DR x={46} y={24} w={10} h={6}  c="#999999" />
      <DR x={48} y={23} w={4}  h={3}  c={BG} />
      <DR x={42} y={22} w={4}  h={10} c="#AAAAAA" />
      <DR x={14} y={19} w={28} h={8}  c="#1A1A1A" />
      <DR x={14} y={20} w={28} h={5}  c="#00FFCC" a={0.28} />
      <DR x={25} y={20} w={6}  h={5}  c="#00FFCC" a={0.90} />
      <DR x={14} y={42} w={6}  h={12} c="#CCCCCC" />
      <DR x={22} y={44} w={5}  h={10} c="#CCCCCC" />
      <DR x={29} y={44} w={5}  h={10} c="#CCCCCC" />
      <DR x={36} y={42} w={6}  h={12} c="#CCCCCC" />
    </S>
  );
}

// ─── Pyramid ─────────────────────────────────────────────────────
function TriangleSprite({ facingLeft, size }) {
  const gold  = '#D4A820';
  const dpurp = '#3A1060';
  const lGold = '#F0CC60';
  const dGold = '#8B6800';
  return (
    <S facingLeft={facingLeft} size={size}>
      {[0,1,2,3,4,5,6,7].map(i => {
        const angle = (i / 8) * Math.PI * 2;
        const cx = 28 + Math.cos(angle) * 14;
        const cy = 22 + Math.sin(angle) * 14;
        return (
          <Ellipse key={i} cx={cx} cy={cy} rx={1} ry={2.5}
            fill={gold} opacity={0.6}
            transform={`rotate(${(i / 8) * 360}, ${cx}, ${cy})`}
          />
        );
      })}
      <Polygon points={pts([[28,8],[4,48],[52,48]])}  fill={dpurp} />
      <Polygon points={pts([[28,8],[4,48],[52,48]])}  fill="none" stroke={gold} strokeWidth={1.5} />
      <Polygon points={pts([[28,14],[8,44],[48,44]])} fill={dGold} opacity={0.35} />
      <Path d="M 28,8 L 28,44"  stroke={gold} strokeWidth={0.8} opacity={0.5} />
      <Path d="M 4,48 L 52,48"  stroke={gold} strokeWidth={0.8} opacity={0.5} />
      <Ellipse cx={28} cy={28} rx={9}   ry={6}   fill={lGold} />
      <Ellipse cx={28} cy={28} rx={5}   ry={5}   fill="#1A0830" />
      <Ellipse cx={28} cy={28} rx={2.5} ry={2.5} fill={gold} />
      <Ellipse cx={28} cy={28} rx={4}   ry={4}   fill={lGold} opacity={0.4} />
      {[-2,-1,0,1,2].map(i => (
        <Path key={i}
          d={`M ${28 + i * 3},22 L ${28 + i * 2.5},19`}
          stroke={gold} strokeWidth={0.7} opacity={0.7}
        />
      ))}
      <Polygon points={pts([[0,32],[10,26],[12,36],[2,40]])}   fill={dpurp} />
      <Polygon points={pts([[0,32],[10,26],[12,36],[2,40]])}   fill="none" stroke={gold} strokeWidth={0.8} />
      <Polygon points={pts([[56,32],[46,26],[44,36],[54,40]])} fill={dpurp} />
      <Polygon points={pts([[56,32],[46,26],[44,36],[54,40]])} fill="none" stroke={gold} strokeWidth={0.8} />
      <DR x={14} y={46} w={5} h={8} c={dpurp} a={0.6} />
      <DR x={20} y={48} w={4} h={6} c={dpurp} a={0.6} />
      <DR x={32} y={48} w={4} h={6} c={dpurp} a={0.6} />
      <DR x={37} y={46} w={5} h={8} c={dpurp} a={0.6} />
    </S>
  );
}
