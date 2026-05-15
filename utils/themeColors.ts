/**
 * Theme-aware accent gradient colors.
 * Returns the primary gradient pair for the current theme.
 */
export function getAccentGradient(theme: string): [string, string] {
  switch (theme) {
    case 'midnight':
      return ['hsl(358, 80%, 38%)', 'hsl(355, 35%, 12%)'];
    case 'light':
      return ['#c4623a', '#8b3d1e'];
    default: // twilight (dark)
      return ['#ffb77d', '#6e3900'];
  }
}

/**
 * Theme-aware accent foreground color (text on accent background).
 */
export function getAccentForeground(theme: string): string {
  switch (theme) {
    case 'midnight':
      return 'hsl(0, 50%, 85%)';
    case 'light':
      return '#ffffff';
    default:
      return '#643400';
  }
}

/**
 * Theme-aware inactive tab icon color.
 */
export function getInactiveColor(theme: string): string {
  switch (theme) {
    case 'midnight':
      return 'hsl(0, 20%, 30%)';
    case 'light':
      return '#9a8a85';
    default:
      return '#909fb5';
  }
}

/**
 * Theme-aware disabled gradient (for buttons that can't be pressed).
 */
export function getDisabledGradient(theme: string): [string, string] {
  switch (theme) {
    case 'midnight':
      return ['hsl(0, 15%, 12%)', 'hsl(0, 15%, 8%)'];
    case 'light':
      return ['#e8d8d3', '#d4c4be'];
    default:
      return ['#2e3c4f', '#1a2a3f'];
  }
}

/**
 * Theme-aware primary text color — for TextInputs and other components that
 * can't pick up `$color` from the Tamagui theme directly.
 */
export function getTextColor(theme: string): string {
  switch (theme) {
    case 'midnight':
      return 'hsl(0, 50%, 40%)';
    case 'light':
      return '#2a1a15';
    default:
      return '#dae6ff';
  }
}

/**
 * Theme-aware placeholder text color for raw TextInputs.
 */
export function getPlaceholderColor(theme: string): string {
  switch (theme) {
    case 'midnight':
      return 'hsl(0, 20%, 20%)';
    case 'light':
      return '#a08a82';
    default:
      return '#4e5c71';
  }
}

/**
 * Theme-aware muted/secondary text color (analogous to $gray10).
 */
export function getMutedColor(theme: string): string {
  switch (theme) {
    case 'midnight':
      return 'hsl(0, 20%, 30%)';
    case 'light':
      return '#584a44';
    default:
      return '#909fb5';
  }
}

/**
 * Theme-aware subtle border color for input underlines / dividers.
 */
export function getDividerColor(theme: string): string {
  switch (theme) {
    case 'midnight':
      return 'hsl(0, 25%, 10%)';
    case 'light':
      return 'rgba(160,120,110,0.15)';
    default:
      return 'rgba(33,72,125,0.15)';
  }
}
