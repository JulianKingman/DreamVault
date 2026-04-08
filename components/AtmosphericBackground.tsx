import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
 * Atmospheric background with gradient and slowly pulsating, heavily feathered glow orbs.
 * Replaces SkyScene.
 */
export function AtmosphericBackground() {
  const { resolvedTheme } = useTheme();

  // Slow pulsating animation for the glow orbs
  const pulse1 = useSharedValue(1);
  const pulse2 = useSharedValue(1);

  useEffect(() => {
    pulse1.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 8000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 8000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
    pulse2.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 10000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 10000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, []);

  const glow1Style = useAnimatedStyle(() => ({
    transform: [{ scale: pulse1.value }],
    opacity: 0.5 + (pulse1.value - 1) * 1.5,
  }));

  const glow2Style = useAnimatedStyle(() => ({
    transform: [{ scale: pulse2.value }],
    opacity: 0.5 + (1 - pulse2.value) * 1.2,
  }));

  if (resolvedTheme === 'light') {
    return (
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <LinearGradient
          colors={['#f5f0e8', '#faf6f1']}
          start={{ x: 0.8, y: 0 }}
          end={{ x: 0.2, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <GlowOrb
          style={[styles.glowTopRight, glow1Style]}
          color={[196, 122, 48]}
          intensity={0.06}
        />
        <GlowOrb
          style={[styles.glowBottomLeft, glow2Style]}
          color={[140, 130, 115]}
          intensity={0.05}
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
          color={[180, 40, 40]}
          intensity={0.06}
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
        color={[255, 183, 125]}
        intensity={0.06}
      />
      <GlowOrb
        style={[styles.glowBottomLeft, glow2Style]}
        color={[46, 60, 100]}
        intensity={0.10}
      />
    </View>
  );
}

/**
 * A single glow orb with heavily feathered edges.
 * Uses concentric gradient layers to simulate a radial blur.
 */
function GlowOrb({
  style,
  color,
  intensity,
}: {
  style: any;
  color: [number, number, number];
  intensity: number;
}) {
  const [r, g, b] = color;
  // Multiple gradient stops from center to edge, fading out
  const inner = `rgba(${r}, ${g}, ${b}, ${intensity})`;
  const mid = `rgba(${r}, ${g}, ${b}, ${intensity * 0.5})`;
  const outer = `rgba(${r}, ${g}, ${b}, ${intensity * 0.15})`;
  const edge = `rgba(${r}, ${g}, ${b}, 0)`;

  return (
    <Animated.View style={[styles.glow, style]}>
      <LinearGradient
        colors={[inner, mid, outer, edge]}
        locations={[0, 0.3, 0.6, 1]}
        start={{ x: 0.5, y: 0.5 }}
        end={{ x: 1, y: 1 }}
        style={styles.glowGradient}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  glow: {
    position: 'absolute',
    borderRadius: 9999,
    overflow: 'hidden',
  },
  glowGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 9999,
  },
  glowTopRight: {
    top: -120,
    right: -120,
    width: 500,
    height: 500,
  },
  glowBottomLeft: {
    bottom: '20%',
    left: -150,
    width: 550,
    height: 550,
  },
});
