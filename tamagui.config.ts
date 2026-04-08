import { config as defaultConfig } from '@tamagui/config/v3'
import { shorthands } from '@tamagui/shorthands'
import { createFont, createMedia, createTamagui } from 'tamagui'

const interFont = createFont({
  family: 'Inter, Helvetica, Arial, sans-serif',
  size: defaultConfig.fonts.body.size,
  lineHeight: defaultConfig.fonts.body.lineHeight,
  weight: {
    1: '300',
    // 2 will be 300
    3: '600',
  },
  letterSpacing: {
    1: 0,
    2: -1,
    // 3 will be -1
  },
  // (native only) swaps out fonts by face/style
  face: {
    300: { normal: 'InterLight', italic: 'InterItalic' },
    600: { normal: 'InterBold' },
  },
})

// Midnight theme: deep dark with warm red hues, designed for nighttime use.
// Based on dark theme structure with all grays shifted to red-tinted.
const midnightTheme = {
  // Night-vision palette: everything is dim red on near-black.
  // The brightest element (~50% lightness) is the primary accent.
  // Body text tops out around 35-40%. Secondary text ~25%.
  // No whites, no bright colors — pure scotopic-safe red channel only.

  // Base palette (near-black to dim red)
  color1: 'hsl(0, 20%, 3%)',
  color2: 'hsl(0, 18%, 5%)',
  color3: 'hsl(0, 16%, 7%)',
  color4: 'hsl(0, 16%, 9%)',
  color5: 'hsl(0, 14%, 11%)',
  color6: 'hsl(0, 14%, 13%)',
  color7: 'hsl(0, 12%, 16%)',
  color8: 'hsl(0, 12%, 20%)',
  color9: 'hsl(0, 15%, 25%)',
  color10: 'hsl(0, 20%, 28%)',
  color11: 'hsl(0, 30%, 35%)',
  color12: 'hsl(0, 50%, 45%)',
  color0: 'rgba(80,20,20,0)',
  color025: 'rgba(80,20,20,0.15)',
  color05: 'rgba(80,20,20,0.3)',
  color075: 'rgba(80,20,20,0.5)',

  // Backgrounds
  background: 'hsl(0, 25%, 3%)',
  background0: 'rgba(10,2,2,0)',
  background025: 'rgba(10,2,2,0.25)',
  background05: 'rgba(10,2,2,0.5)',
  background075: 'rgba(10,2,2,0.75)',
  backgroundHover: 'hsl(0, 20%, 6%)',
  backgroundPress: 'rgba(10,2,2,0.75)',
  backgroundFocus: 'rgba(10,2,2,0.75)',
  backgroundStrong: 'hsl(0, 20%, 5%)',
  backgroundTransparent: 'rgba(10,2,2,0)',

  // Foreground — body text is dim red, never white
  color: 'hsl(0, 50%, 40%)',
  colorHover: 'hsl(0, 40%, 35%)',
  colorPress: 'hsl(0, 55%, 42%)',
  colorFocus: 'hsl(0, 40%, 35%)',
  colorTransparent: 'rgba(80,20,20,0)',

  // Borders — very subtle dark red
  borderColor: 'hsl(0, 25%, 10%)',
  borderColorHover: 'hsl(0, 25%, 13%)',
  borderColorPress: 'hsl(0, 25%, 8%)',
  borderColorFocus: 'hsl(0, 25%, 10%)',

  // Placeholder / outline
  placeholderColor: 'hsl(0, 20%, 20%)',
  outlineColor: 'rgba(80,20,20,0.2)',

  // Accent
  accentBackground: 'hsl(0, 60%, 22%)',
  accentColor: 'hsl(0, 60%, 42%)',

  // Gray scale — all red-tinted, capped low
  gray1: 'hsl(0, 15%, 5%)',
  gray2: 'hsl(0, 12%, 7%)',
  gray3: 'hsl(0, 12%, 9%)',
  gray4: 'hsl(0, 10%, 11%)',
  gray5: 'hsl(0, 10%, 13%)',
  gray6: 'hsl(0, 10%, 15%)',
  gray7: 'hsl(0, 10%, 18%)',
  gray8: 'hsl(0, 12%, 22%)',
  gray9: 'hsl(0, 15%, 26%)',
  gray10: 'hsl(0, 20%, 30%)',
  gray11: 'hsl(0, 30%, 36%)',
  gray12: 'hsl(0, 45%, 42%)',

  // Red — primary accent, the brightest things on screen
  red1: 'hsl(355, 35%, 5%)',
  red2: 'hsl(355, 40%, 7%)',
  red3: 'hsl(355, 50%, 10%)',
  red4: 'hsl(355, 55%, 13%)',
  red5: 'hsl(355, 58%, 15%)',
  red6: 'hsl(356, 60%, 18%)',
  red7: 'hsl(356, 65%, 22%)',
  red8: 'hsl(357, 70%, 28%)',
  red9: 'hsl(358, 80%, 38%)',
  red10: 'hsl(358, 85%, 42%)',
  red11: 'hsl(358, 90%, 48%)',
  red12: 'hsl(355, 70%, 50%)',

  // Blue — collapsed into dim red (no blue light in night vision)
  blue1: 'hsl(350, 25%, 5%)',
  blue2: 'hsl(350, 28%, 7%)',
  blue3: 'hsl(350, 32%, 10%)',
  blue4: 'hsl(350, 35%, 12%)',
  blue5: 'hsl(350, 38%, 14%)',
  blue6: 'hsl(350, 40%, 17%)',
  blue7: 'hsl(352, 45%, 21%)',
  blue8: 'hsl(354, 50%, 26%)',
  blue9: 'hsl(355, 65%, 35%)',
  blue10: 'hsl(355, 70%, 40%)',
  blue11: 'hsl(355, 75%, 44%)',
  blue12: 'hsl(352, 60%, 48%)',

  // Green — warm red-shifted, dim
  green1: 'hsl(10, 25%, 5%)',
  green2: 'hsl(10, 30%, 6%)',
  green3: 'hsl(10, 35%, 9%)',
  green4: 'hsl(10, 38%, 11%)',
  green5: 'hsl(10, 40%, 13%)',
  green6: 'hsl(10, 42%, 15%)',
  green7: 'hsl(10, 45%, 19%)',
  green8: 'hsl(10, 48%, 24%)',
  green9: 'hsl(10, 55%, 32%)',
  green10: 'hsl(10, 55%, 36%)',
  green11: 'hsl(10, 60%, 40%)',
  green12: 'hsl(10, 55%, 45%)',

  // Orange — warm, dim
  orange1: 'hsl(8, 50%, 5%)',
  orange2: 'hsl(8, 55%, 6%)',
  orange3: 'hsl(8, 58%, 9%)',
  orange4: 'hsl(8, 60%, 11%)',
  orange5: 'hsl(8, 60%, 13%)',
  orange6: 'hsl(8, 62%, 16%)',
  orange7: 'hsl(8, 65%, 20%)',
  orange8: 'hsl(8, 68%, 25%)',
  orange9: 'hsl(8, 75%, 34%)',
  orange10: 'hsl(8, 78%, 38%)',
  orange11: 'hsl(8, 80%, 42%)',
  orange12: 'hsl(8, 70%, 46%)',

  // Pink — collapsed toward red, dim
  pink1: 'hsl(345, 28%, 5%)',
  pink2: 'hsl(345, 32%, 7%)',
  pink3: 'hsl(345, 38%, 10%)',
  pink4: 'hsl(345, 42%, 12%)',
  pink5: 'hsl(345, 45%, 14%)',
  pink6: 'hsl(345, 48%, 17%)',
  pink7: 'hsl(345, 52%, 21%)',
  pink8: 'hsl(345, 58%, 27%)',
  pink9: 'hsl(348, 65%, 36%)',
  pink10: 'hsl(348, 70%, 40%)',
  pink11: 'hsl(348, 75%, 44%)',
  pink12: 'hsl(345, 65%, 48%)',

  // Purple — warm-shifted into dark red-pink, dim
  purple1: 'hsl(340, 22%, 5%)',
  purple2: 'hsl(340, 26%, 7%)',
  purple3: 'hsl(340, 32%, 10%)',
  purple4: 'hsl(340, 35%, 12%)',
  purple5: 'hsl(340, 38%, 14%)',
  purple6: 'hsl(340, 42%, 17%)',
  purple7: 'hsl(340, 45%, 21%)',
  purple8: 'hsl(340, 50%, 27%)',
  purple9: 'hsl(342, 55%, 36%)',
  purple10: 'hsl(342, 60%, 40%)',
  purple11: 'hsl(342, 65%, 44%)',
  purple12: 'hsl(340, 60%, 48%)',

  // Yellow — pulled into amber/deep orange, dim
  yellow1: 'hsl(12, 55%, 4%)',
  yellow2: 'hsl(12, 60%, 5%)',
  yellow3: 'hsl(12, 58%, 8%)',
  yellow4: 'hsl(12, 58%, 10%)',
  yellow5: 'hsl(14, 58%, 12%)',
  yellow6: 'hsl(16, 58%, 14%)',
  yellow7: 'hsl(18, 55%, 18%)',
  yellow8: 'hsl(20, 58%, 22%)',
  yellow9: 'hsl(20, 70%, 32%)',
  yellow10: 'hsl(20, 75%, 38%)',
  yellow11: 'hsl(18, 70%, 35%)',
  yellow12: 'hsl(16, 65%, 42%)',

  // Shadows
  shadowColor: 'rgba(10,0,0,0.5)',
  shadowColorHover: 'rgba(10,0,0,0.5)',
  shadowColorPress: 'rgba(10,0,0,0.4)',
  shadowColorFocus: 'rgba(10,0,0,0.4)',
} as const

const config = createTamagui({
  fonts: {
    heading: interFont,
    body: interFont,
  },

  // Use the full default token set (includes all color scales)
  tokens: defaultConfig.tokens,

  // Use the full default themes (light, dark, and all sub-themes like
  // dark_blue, light_gray, etc.) plus our custom midnight theme.
  themes: {
    ...defaultConfig.themes,
    midnight: midnightTheme,
  },

  media: createMedia({
    sm: { maxWidth: 860 },
    gtSm: { minWidth: 860 + 1 },
    short: { maxHeight: 820 },
    hoverNone: { hover: 'none' },
    pointerCoarse: { pointer: 'coarse' },
  }),

  shorthands,
})

export default config

export type Conf = typeof config

declare module 'tamagui' {
  interface TamaguiCustomConfig extends Conf {}
}
