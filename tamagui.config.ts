import { config as defaultConfig } from '@tamagui/config/v3'
import { shorthands } from '@tamagui/shorthands'
import { createFont, createMedia, createTamagui } from 'tamagui'

// ---------------------------------------------------------------------------
// Fonts
// ---------------------------------------------------------------------------

const plusJakartaSans = createFont({
  family: 'PlusJakartaSans, Helvetica, Arial, sans-serif',
  size: defaultConfig.fonts.body.size,
  lineHeight: defaultConfig.fonts.body.lineHeight,
  weight: {
    1: '300',
    3: '600',
    7: '700',
  },
  letterSpacing: {
    1: 0,
    2: -0.5,
  },
  face: {
    300: { normal: 'PlusJakartaSans_300Light' },
    400: { normal: 'PlusJakartaSans_400Regular' },
    500: { normal: 'PlusJakartaSans_500Medium' },
    600: { normal: 'PlusJakartaSans_600SemiBold' },
    700: { normal: 'PlusJakartaSans_700Bold' },
  },
})

const notoSerif = createFont({
  family: 'NotoSerif, Georgia, Times, serif',
  size: defaultConfig.fonts.body.size,
  lineHeight: defaultConfig.fonts.body.lineHeight,
  weight: {
    1: '400',
    3: '700',
  },
  letterSpacing: {
    1: 0,
    2: -0.5,
  },
  face: {
    400: { normal: 'NotoSerif_400Regular' },
    700: { normal: 'NotoSerif_700Bold' },
  },
})

// ---------------------------------------------------------------------------
// Twilight Theme — deep navy backgrounds, amber/gold accents
// Default dark theme.
// ---------------------------------------------------------------------------

const twilightTheme = {
  // Surface hierarchy (3 levels)
  // Base (#040e1f), Card (#02132c), Elevated (#001938)
  color1: '#040e1f',
  color2: '#02132c',
  color3: '#001938',
  color4: '#001f43',
  color5: '#00264e',
  color6: '#2e3c4f',
  color7: '#4e5c71',
  color8: '#909fb5',
  color9: '#ffb77d',   // primary amber
  color10: '#ffa454',  // primary amber dim
  color11: '#dae6ff',  // text primary
  color12: '#dae6ff',  // text primary
  color0: 'rgba(4,14,31,0)',
  color025: 'rgba(4,14,31,0.15)',
  color05: 'rgba(4,14,31,0.3)',
  color075: 'rgba(4,14,31,0.5)',

  // Backgrounds
  background: '#040e1f',
  background0: 'rgba(4,14,31,0)',
  background025: 'rgba(4,14,31,0.25)',
  background05: 'rgba(4,14,31,0.5)',
  background075: 'rgba(4,14,31,0.75)',
  backgroundHover: '#02132c',
  backgroundPress: '#001938',
  backgroundFocus: '#02132c',
  backgroundStrong: '#02132c',
  backgroundTransparent: 'rgba(4,14,31,0)',

  // Foreground — light blue-white text
  color: '#dae6ff',
  colorHover: '#c7d5ed',
  colorPress: '#dae6ff',
  colorFocus: '#c7d5ed',
  colorTransparent: 'rgba(218,230,255,0)',

  // Borders — very subtle, use sparingly
  borderColor: 'rgba(33,72,125,0.15)',
  borderColorHover: 'rgba(33,72,125,0.25)',
  borderColorPress: 'rgba(33,72,125,0.10)',
  borderColorFocus: 'rgba(33,72,125,0.20)',

  // Placeholder / outline
  placeholderColor: '#4e5c71',
  outlineColor: 'rgba(33,72,125,0.2)',

  // Accent — amber
  accentBackground: '#ffb77d',
  accentColor: '#643400',

  // Gray scale — slate blue tinted
  gray1: '#040e1f',
  gray2: '#02132c',
  gray3: '#001938',
  gray4: '#001f43',
  gray5: '#00264e',
  gray6: '#2e3c4f',
  gray7: '#4e5c71',
  gray8: '#5376ae',
  gray9: '#89ace7',
  gray10: '#909fb5',
  gray11: '#c7d5ed',
  gray12: '#dae6ff',

  // Red — for errors/destructive
  red1: '#1a0505',
  red2: '#2a0a0a',
  red3: '#3d1010',
  red4: '#4d1515',
  red5: '#5c1a1a',
  red6: '#6e2020',
  red7: '#7e2b17',
  red8: '#ba573f',
  red9: '#ed7f64',
  red10: '#ff9b82',
  red11: '#ffb8a4',
  red12: '#ffddd4',

  // Blue — slate-blue tinted
  blue1: '#02132c',
  blue2: '#001938',
  blue3: '#001f43',
  blue4: '#00264e',
  blue5: '#002c5a',
  blue6: '#21487d',
  blue7: '#5376ae',
  blue8: '#89ace7',
  blue9: '#909fb5',
  blue10: '#c7d5ed',
  blue11: '#dae6ff',
  blue12: '#f0f4ff',

  // Green — success states
  green1: '#021a0e',
  green2: '#03261a',
  green3: '#053324',
  green4: '#08402e',
  green5: '#0a4d38',
  green6: '#0d5a42',
  green7: '#10744f',
  green8: '#15945e',
  green9: '#20b46e',
  green10: '#3ec988',
  green11: '#6edda8',
  green12: '#a8f0cc',

  // Orange — warm, amber-adjacent
  orange1: '#1a0e02',
  orange2: '#2a1700',
  orange3: '#3d2200',
  orange4: '#4a2c00',
  orange5: '#563400',
  orange6: '#6e3900',
  orange7: '#8c4a00',
  orange8: '#b86200',
  orange9: '#ffb148',   // tertiary
  orange10: '#ffb77d',  // primary
  orange11: '#ffc497',
  orange12: '#ffdcc3',

  // Pink — soft accent
  pink1: '#1a0515',
  pink2: '#2a0a22',
  pink3: '#3d1035',
  pink4: '#4d1545',
  pink5: '#5c1a55',
  pink6: '#6e2068',
  pink7: '#842a7e',
  pink8: '#a83d9d',
  pink9: '#cc55bd',
  pink10: '#e070d4',
  pink11: '#f098e8',
  pink12: '#fac4f5',

  // Purple — used for AI features
  purple1: '#0d0520',
  purple2: '#150a30',
  purple3: '#1e1045',
  purple4: '#2e1a60',
  purple5: '#3a2275',
  purple6: '#462a8a',
  purple7: '#5535a5',
  purple8: '#6d48c4',
  purple9: '#8860e0',
  purple10: '#a480f0',
  purple11: '#c4a8ff',
  purple12: '#e0d0ff',

  // Yellow — warm gold
  yellow1: '#1a1000',
  yellow2: '#2a1a00',
  yellow3: '#3d2800',
  yellow4: '#4a3000',
  yellow5: '#5a3c00',
  yellow6: '#6e4a00',
  yellow7: '#8c6000',
  yellow8: '#b88000',
  yellow9: '#e79400',
  yellow10: '#f8a010',
  yellow11: '#ffb148',
  yellow12: '#ffdcc3',

  // Shadows — deep navy tinted
  shadowColor: 'rgba(0,8,20,0.5)',
  shadowColorHover: 'rgba(0,8,20,0.5)',
  shadowColorPress: 'rgba(0,8,20,0.4)',
  shadowColorFocus: 'rgba(0,8,20,0.4)',
} as const

// ---------------------------------------------------------------------------
// Twilight Light Theme — warm cream backgrounds, amber accents preserved
// ---------------------------------------------------------------------------

const twilightLightTheme = {
  // Surface hierarchy: cream/warm white base
  color1: '#faf6f1',
  color2: '#f5f0e8',
  color3: '#efe9df',
  color4: '#e8e1d5',
  color5: '#dfd8cb',
  color6: '#c5bfb3',
  color7: '#8a8479',
  color8: '#6e6860',
  color9: '#c47a30',   // primary amber (darker for light bg)
  color10: '#a66520',  // primary amber dim
  color11: '#1a1510',  // text primary
  color12: '#1a1510',  // text primary
  color0: 'rgba(250,246,241,0)',
  color025: 'rgba(250,246,241,0.15)',
  color05: 'rgba(250,246,241,0.3)',
  color075: 'rgba(250,246,241,0.5)',

  // Backgrounds
  background: '#faf6f1',
  background0: 'rgba(250,246,241,0)',
  background025: 'rgba(250,246,241,0.25)',
  background05: 'rgba(250,246,241,0.5)',
  background075: 'rgba(250,246,241,0.75)',
  backgroundHover: '#f5f0e8',
  backgroundPress: '#efe9df',
  backgroundFocus: '#f5f0e8',
  backgroundStrong: '#f5f0e8',
  backgroundTransparent: 'rgba(250,246,241,0)',

  // Foreground — dark warm text
  color: '#1a1510',
  colorHover: '#2e2820',
  colorPress: '#1a1510',
  colorFocus: '#2e2820',
  colorTransparent: 'rgba(26,21,16,0)',

  // Borders
  borderColor: 'rgba(140,130,115,0.2)',
  borderColorHover: 'rgba(140,130,115,0.3)',
  borderColorPress: 'rgba(140,130,115,0.15)',
  borderColorFocus: 'rgba(140,130,115,0.25)',

  // Placeholder / outline
  placeholderColor: '#8a8479',
  outlineColor: 'rgba(140,130,115,0.2)',

  // Accent — amber
  accentBackground: '#c47a30',
  accentColor: '#ffffff',

  // Gray scale — warm tinted
  gray1: '#faf6f1',
  gray2: '#f5f0e8',
  gray3: '#efe9df',
  gray4: '#e8e1d5',
  gray5: '#dfd8cb',
  gray6: '#c5bfb3',
  gray7: '#a8a298',
  gray8: '#8a8479',
  gray9: '#6e6860',
  gray10: '#55504a',
  gray11: '#3a3530',
  gray12: '#1a1510',

  // Red
  red1: '#fff5f5',
  red2: '#ffe8e8',
  red3: '#ffd5d0',
  red4: '#ffbbb5',
  red5: '#ffa098',
  red6: '#ff8580',
  red7: '#e86055',
  red8: '#cc4035',
  red9: '#b22d22',
  red10: '#991f15',
  red11: '#7a1510',
  red12: '#500a08',

  // Blue
  blue1: '#f5f8ff',
  blue2: '#e8f0ff',
  blue3: '#d5e3fc',
  blue4: '#c0d5f8',
  blue5: '#a8c5f0',
  blue6: '#89ace7',
  blue7: '#5376ae',
  blue8: '#3a5c8e',
  blue9: '#21487d',
  blue10: '#153566',
  blue11: '#0a2550',
  blue12: '#041530',

  // Green
  green1: '#f0faf5',
  green2: '#e0f5ea',
  green3: '#c8edd8',
  green4: '#a8e0c2',
  green5: '#80d0a8',
  green6: '#55be88',
  green7: '#35a06a',
  green8: '#208552',
  green9: '#15703e',
  green10: '#0a5a2e',
  green11: '#054520',
  green12: '#022a12',

  // Orange — amber family
  orange1: '#fff8f0',
  orange2: '#fff0e0',
  orange3: '#ffe5c8',
  orange4: '#ffd8aa',
  orange5: '#ffc888',
  orange6: '#ffb565',
  orange7: '#e09540',
  orange8: '#c47a30',
  orange9: '#a66520',
  orange10: '#884f15',
  orange11: '#6e3900',
  orange12: '#4a2500',

  // Pink
  pink1: '#fff5fa',
  pink2: '#ffe8f2',
  pink3: '#ffd5e8',
  pink4: '#ffb8d8',
  pink5: '#ff98c5',
  pink6: '#f075b0',
  pink7: '#d55598',
  pink8: '#b83a80',
  pink9: '#9a2568',
  pink10: '#7e1555',
  pink11: '#600a40',
  pink12: '#400528',

  // Purple
  purple1: '#f8f5ff',
  purple2: '#f0e8ff',
  purple3: '#e5d8ff',
  purple4: '#d5c0ff',
  purple5: '#c4a8ff',
  purple6: '#a480f0',
  purple7: '#8860e0',
  purple8: '#6d48c4',
  purple9: '#5535a5',
  purple10: '#3e228a',
  purple11: '#2a1570',
  purple12: '#180a48',

  // Yellow
  yellow1: '#fffcf0',
  yellow2: '#fff8e0',
  yellow3: '#fff0c0',
  yellow4: '#ffe69a',
  yellow5: '#ffd870',
  yellow6: '#f8c445',
  yellow7: '#e0a820',
  yellow8: '#c48e10',
  yellow9: '#a87505',
  yellow10: '#8a5f00',
  yellow11: '#6e4a00',
  yellow12: '#4a3000',

  // Shadows
  shadowColor: 'rgba(26,21,16,0.08)',
  shadowColorHover: 'rgba(26,21,16,0.1)',
  shadowColorPress: 'rgba(26,21,16,0.06)',
  shadowColorFocus: 'rgba(26,21,16,0.06)',
} as const

// ---------------------------------------------------------------------------
// Midnight Theme — red-tinted night vision (unchanged)
// ---------------------------------------------------------------------------

const midnightTheme = {
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

  color: 'hsl(0, 50%, 40%)',
  colorHover: 'hsl(0, 40%, 35%)',
  colorPress: 'hsl(0, 55%, 42%)',
  colorFocus: 'hsl(0, 40%, 35%)',
  colorTransparent: 'rgba(80,20,20,0)',

  borderColor: 'hsl(0, 25%, 10%)',
  borderColorHover: 'hsl(0, 25%, 13%)',
  borderColorPress: 'hsl(0, 25%, 8%)',
  borderColorFocus: 'hsl(0, 25%, 10%)',

  placeholderColor: 'hsl(0, 20%, 20%)',
  outlineColor: 'rgba(80,20,20,0.2)',

  accentBackground: 'hsl(0, 60%, 22%)',
  accentColor: 'hsl(0, 60%, 42%)',

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

  shadowColor: 'rgba(10,0,0,0.5)',
  shadowColorHover: 'rgba(10,0,0,0.5)',
  shadowColorPress: 'rgba(10,0,0,0.4)',
  shadowColorFocus: 'rgba(10,0,0,0.4)',
} as const

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const config = createTamagui({
  fonts: {
    heading: notoSerif,
    body: plusJakartaSans,
  },

  tokens: defaultConfig.tokens,

  themes: {
    ...defaultConfig.themes,
    dark: twilightTheme,
    light: twilightLightTheme,
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
