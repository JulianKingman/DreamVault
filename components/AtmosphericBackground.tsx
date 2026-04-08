import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';

/**
 * Atmospheric background with gradient and ambient glow circles.
 * Replaces SkyScene. Renders behind screen content as a fixed background.
 */
export function AtmosphericBackground() {
  const { resolvedTheme } = useTheme();

  if (resolvedTheme === 'light') {
    return (
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <LinearGradient
          colors={['#f5f0e8', '#faf6f1']}
          start={{ x: 0.8, y: 0 }}
          end={{ x: 0.2, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {/* Warm ambient glow — top right */}
        <View style={[styles.glow, styles.glowTopRight, { backgroundColor: 'rgba(196, 122, 48, 0.06)' }]} />
        {/* Cool ambient glow — bottom left */}
        <View style={[styles.glow, styles.glowBottomLeft, { backgroundColor: 'rgba(140, 130, 115, 0.06)' }]} />
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
        {/* Dim red glow — top right */}
        <View style={[styles.glow, styles.glowTopRight, { backgroundColor: 'hsla(358, 80%, 38%, 0.05)' }]} />
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
      {/* Amber ambient glow — top right */}
      <View style={[styles.glow, styles.glowTopRight, { backgroundColor: 'rgba(255, 183, 125, 0.05)' }]} />
      {/* Slate ambient glow — bottom left */}
      <View style={[styles.glow, styles.glowBottomLeft, { backgroundColor: 'rgba(46, 60, 79, 0.10)' }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  glow: {
    position: 'absolute',
    borderRadius: 9999,
  },
  glowTopRight: {
    top: -80,
    right: -80,
    width: 350,
    height: 350,
  },
  glowBottomLeft: {
    bottom: '25%',
    left: -100,
    width: 400,
    height: 400,
  },
});
