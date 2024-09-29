import { config } from '@tamagui/config/v3'
import { createTamagui } from 'tamagui'
import type { TamaguiInternalConfig } from '@tamagui/core'

export const tamaguiConfig: TamaguiInternalConfig = createTamagui(config)

export default tamaguiConfig

export type Conf = typeof tamaguiConfig

declare module 'tamagui' {
  interface TamaguiCustomConfig extends Conf { }
}