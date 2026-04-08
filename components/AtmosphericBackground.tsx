import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../contexts/ThemeContext';

/**
 * Atmospheric background with gradient and slowly pulsating radial glow orbs.
 * Uses SVG RadialGradient for proper feathering with no hard edges.
 */
export function AtmosphericBackground() {
  const { resolvedTheme } = useTheme();

  const pulse1 = useSharedValue(1);
  const pulse2 = useSharedValue(1);

  useEffect(() => {
    pulse1.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 8000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 8000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
    pulse2.value = withRepeat(
      withSequence(
        withTiming(0.85, { duration: 10000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 10000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, []);

  const glow1Style = useAnimatedStyle(() => ({
    transform: [{ scale: pulse1.value }],
  }));

  const glow2Style = useAnimatedStyle(() => ({
    transform: [{ scale: pulse2.value }],
  }));

  if (resolvedTheme === 'light') {
    return (
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <LinearGradient
          colors={['#fdf6f4', '#f8eeeb']}
          start={{ x: 0.8, y: 0 }}
          end={{ x: 0.2, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <GlowOrb
          style={[styles.glowTopRight, glow1Style]}
          r={196} g={98} b={58} intensity={0.07}
          size={500}
        />
        <GlowOrb
          style={[styles.glowBottomLeft, glow2Style]}
          r={180} g={140} b={150} intensity={0.06}
          size={550}
        />
      </View>
    );
  }

  if (resolvedTheme === 'midnight') {
    return (
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <LinearGradient
          colors={['hsl(0, 20%, 5%)', 'hsl(0, 25%, 3%)']}
          start={{ x: 0.8, y: 0 }}
          end={{ x: 0.2, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <GlowOrb
          style={[styles.glowTopRight, glow1Style]}
          r={180} g={40} b={40} intensity={0.07}
          size={500}
        />
      </View>
    );
  }

  // Twilight (dark) — default
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={['#001938', '#040e1f']}
        start={{ x: 0.8, y: 0 }}
        end={{ x: 0.2, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <GlowOrb
        style={[styles.glowTopRight, glow1Style]}
        r={255} g={183} b={125} intensity={0.07}
        size={500}
      />
      <GlowOrb
        style={[styles.glowBottomLeft, glow2Style]}
        r={46} g={60} b={100} intensity={0.12}
        size={550}
      />
    </View>
  );
}

/**
 * SVG radial gradient orb. Fades from center color to fully transparent
 * at the edges — no hard boundary.
 */
function GlowOrb({
  style,
  r, g, b,
  intensity,
  size,
}: {
  style: any;
  r: number; g: number; b: number;
  intensity: number;
  size: number;
}) {
  return (
    <Animated.View style={[{ width: size, height: size }, style]}>
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id={`glow-${r}-${g}-${b}`} cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0%" stopColor={`rgb(${r},${g},${b})`} stopOpacity={intensity} />
            <Stop offset="40%" stopColor={`rgb(${r},${g},${b})`} stopOpacity={intensity * 0.5} />
            <Stop offset="70%" stopColor={`rgb(${r},${g},${b})`} stopOpacity={intensity * 0.15} />
            <Stop offset="100%" stopColor={`rgb(${r},${g},${b})`} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width={size} height={size} fill={`url(#glow-${r}-${g}-${b})`} />
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  glowTopRight: {
    position: 'absolute',
    top: -120,
    right: -120,
  },
  glowBottomLeft: {
    position: 'absolute',
    bottom: '20%',
    left: -150,
  },
});
