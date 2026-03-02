import React, { useMemo } from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
  Rect,
  Circle,
  Ellipse,
  G,
  Path,
} from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { MotiView } from 'moti';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

function getTimeOfDay(hour: number): TimeOfDay {
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 20) return 'evening';
  return 'night';
}

function getCelestialProgress(hour: number, minute: number): number {
  const timeOfDay = getTimeOfDay(hour);
  const totalMinutes = hour * 60 + minute;
  switch (timeOfDay) {
    case 'morning':
      return (totalMinutes - 360) / 360; // 6:00-12:00
    case 'afternoon':
      return (totalMinutes - 720) / 300; // 12:00-17:00
    case 'evening':
      return (totalMinutes - 1020) / 180; // 17:00-20:00
    case 'night':
      if (hour >= 20) return (totalMinutes - 1200) / 600;
      return (totalMinutes + 240) / 600; // wraps past midnight
  }
}

const SKY_COLORS: Record<TimeOfDay, [string, string]> = {
  morning: ['#87CEEB', '#FFDAB9'],
  afternoon: ['#1E90FF', '#87CEEB'],
  evening: ['#2E0854', '#FF8C00'],
  night: ['#0A0A2E', '#1A1A4E'],
};

interface SkySceneProps {
  height: number;
}

function Star({ cx, cy, delay }: { cx: number; cy: number; delay: number }) {
  return (
    <MotiView
      from={{ opacity: 0.3 }}
      animate={{ opacity: 1 }}
      transition={{
        opacity: {
          type: 'timing',
          duration: 1500,
          delay,
          loop: true,
        },
      }}
      style={[styles.star, { left: cx, top: cy }]}
    />
  );
}

function CloudShape({ x, y, scale }: { x: number; y: number; scale: number }) {
  return (
    <G transform={`translate(${x}, ${y}) scale(${scale})`}>
      <Ellipse cx={0} cy={0} rx={40} ry={20} fill="rgba(255,255,255,0.3)" />
      <Ellipse cx={-25} cy={5} rx={25} ry={15} fill="rgba(255,255,255,0.25)" />
      <Ellipse cx={25} cy={5} rx={30} ry={18} fill="rgba(255,255,255,0.25)" />
      <Ellipse cx={10} cy={-8} rx={20} ry={14} fill="rgba(255,255,255,0.3)" />
    </G>
  );
}

export function SkyScene({ height }: SkySceneProps) {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const timeOfDay = getTimeOfDay(hour);
  const progress = getCelestialProgress(hour, minute);
  const [topColor, bottomColor] = SKY_COLORS[timeOfDay];
  const isDay = timeOfDay === 'morning' || timeOfDay === 'afternoon';
  const isNight = timeOfDay === 'night';

  // Sun/moon arc: sine curve across the width
  const celestialX = progress * SCREEN_WIDTH;
  const celestialY = height * 0.7 - Math.sin(progress * Math.PI) * (height * 0.5);

  // Deterministic star positions
  const stars = useMemo(() => {
    const result = [];
    for (let i = 0; i < 40; i++) {
      const seed = (i * 7919 + 1) % 1000;
      result.push({
        cx: (seed / 1000) * SCREEN_WIDTH,
        cy: ((seed * 3 + i * 137) % 1000 / 1000) * height * 0.7,
        delay: (i * 200) % 3000,
      });
    }
    return result;
  }, [height]);

  // Cloud animation
  const cloud1X = useSharedValue(-100);
  const cloud2X = useSharedValue(SCREEN_WIDTH + 50);

  React.useEffect(() => {
    if (isDay) {
      cloud1X.value = withRepeat(
        withTiming(SCREEN_WIDTH + 100, { duration: 30000, easing: Easing.linear }),
        -1,
        false,
      );
      cloud2X.value = withDelay(
        5000,
        withRepeat(
          withSequence(
            withTiming(-150, { duration: 0 }),
            withTiming(SCREEN_WIDTH + 150, { duration: 35000, easing: Easing.linear }),
          ),
          -1,
          false,
        ),
      );
    }
  }, [isDay]);

  const cloud1Style = useAnimatedStyle(() => ({
    transform: [{ translateX: cloud1X.value }],
    position: 'absolute' as const,
    top: height * 0.2,
  }));

  const cloud2Style = useAnimatedStyle(() => ({
    transform: [{ translateX: cloud2X.value }],
    position: 'absolute' as const,
    top: height * 0.35,
  }));

  return (
    <Animated.View style={[styles.container, { height }]}>
      <Svg width={SCREEN_WIDTH} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          <SvgLinearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={topColor} />
            <Stop offset="1" stopColor={bottomColor} />
          </SvgLinearGradient>
        </Defs>
        <Rect x={0} y={0} width={SCREEN_WIDTH} height={height} fill="url(#skyGrad)" />

        {/* Sun */}
        {isDay && (
          <Circle cx={celestialX} cy={celestialY} r={24} fill="#FFD700" opacity={0.9} />
        )}

        {/* Moon (crescent) */}
        {isNight && (
          <G>
            <Circle cx={celestialX} cy={celestialY} r={20} fill="#F0E68C" opacity={0.9} />
            <Circle cx={celestialX + 8} cy={celestialY - 4} r={16} fill={topColor} />
          </G>
        )}

        {/* Evening sun (dimmer, larger) */}
        {timeOfDay === 'evening' && (
          <Circle cx={celestialX} cy={celestialY} r={28} fill="#FF6347" opacity={0.7} />
        )}
      </Svg>

      {/* Stars (night only) */}
      {(isNight || timeOfDay === 'evening') &&
        stars.map((s, i) => <Star key={i} cx={s.cx} cy={s.cy} delay={s.delay} />)}

      {/* Clouds (day only) */}
      {isDay && (
        <>
          <Animated.View style={cloud1Style}>
            <Svg width={120} height={60}>
              <CloudShape x={60} y={30} scale={1} />
            </Svg>
          </Animated.View>
          <Animated.View style={cloud2Style}>
            <Svg width={150} height={60}>
              <CloudShape x={75} y={30} scale={1.2} />
            </Svg>
          </Animated.View>
        </>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    overflow: 'hidden',
  },
  star: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#FFFFFF',
  },
});
