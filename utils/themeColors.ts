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
