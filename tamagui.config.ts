import { config as defaultConfig } from '@tamagui/config/v3'
import { createFont, createMedia, createTamagui, createTokens } from 'tamagui'
import type { TamaguiInternalConfig } from '@tamagui/core'

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

const size = defaultConfig.tokens.size

export const tokens = createTokens({
  size,
  space: defaultConfig.tokens.space,
  radius: defaultConfig.tokens.radius,
  zIndex: defaultConfig.tokens.zIndex,
  color: {
    white: '#fff',
    black: '#333',
    border: '#CCC'
  },
})

const config = createTamagui({
  fonts: {
    // for tamagui, heading and body are assumed
    heading: interFont,
    body: interFont,
  },
  tokens,

  // For more on themes, see the Themes page
  themes: {
    light: {
      bg: '#f2f2f2',
      color: tokens.color.black,
    },
    dark: {
      bg: '#111',
      color: tokens.color.white,
    },
  },

  // For web-only, media queries work out of the box and you can avoid the
  // `createMedia` call here by passing the media object directly.
  // If you are going to target React Native, use `createMedia` (it's an identity
  // function on web so you can import it there without concern).
  media: createMedia({
    sm: { maxWidth: 860 },
    gtSm: { minWidth: 860 + 1 },
    short: { maxHeight: 820 },
    hoverNone: { hover: 'none' },
    pointerCoarse: { pointer: 'coarse' },
  }),

  // Shorthands
  // Adds <View m={10} /> to <View margin={10} />
  // See Settings section on this page to only allow shorthands
  // Be sure to have `as const` at the end
  shorthands: {
    px: 'paddingHorizontal',
    f: 'flex',
    m: 'margin',
    w: 'width',
  } as const,

  // Change the default props for any styled() component with a name.
  // We are discouraging the use of this and have deprecated it, prefer to use
  // styled() on any component to change it's styles.
  defaultProps: {
    Text: {
      color: 'green'
    },
  },
})


export default config

export type Conf = typeof config

declare module 'tamagui' {
  interface TamaguiCustomConfig extends Conf { }
}