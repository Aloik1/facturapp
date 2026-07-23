// Theme: Dark Studio — warm charcoal + gold accent
// No blue. Designed for professionals who appreciate good design.

export const colors = {
  // Backgrounds
  bg: '#1A1A1A',
  bgCard: '#242424',
  bgTertiary: '#2D2D2D',
  bgOverlay: 'rgba(0,0,0,0.6)',

  // Text
  text: '#F5F0EB',
  textSecondary: '#A09890',
  textTertiary: '#6B6560',
  textInverse: '#1A1A1A',

  // Accent
  accent: '#D4A04A',
  accentHover: '#E0B85C',
  accentDim: 'rgba(212, 160, 74, 0.12)',

  // Status
  success: '#6BBF8A',
  successBg: 'rgba(107, 191, 138, 0.12)',
  danger: '#D95C5C',
  dangerBg: 'rgba(217, 92, 92, 0.12)',
  warning: '#D4A04A',
  warningBg: 'rgba(212, 160, 74, 0.12)',

  // Borders
  border: '#333333',
  borderLight: '#3A3A3A',
  borderFocus: '#D4A04A',

  // Input
  inputBg: '#2D2D2D',
  inputBorder: '#333333',
  inputPlaceholder: '#6B6560',

  // Misc
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
}

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 9999,
}

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 8,
  },
  soft: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
}

export const typography = {
  h1: { fontSize: 32, fontWeight: '700' as const, color: colors.text, letterSpacing: -0.02 },
  h2: { fontSize: 24, fontWeight: '600' as const, color: colors.text, letterSpacing: -0.02 },
  h3: { fontSize: 18, fontWeight: '700' as const, color: colors.text },
  body: { fontSize: 16, color: colors.text },
  bodySmall: { fontSize: 14, color: colors.textSecondary },
  caption: { fontSize: 12, color: colors.textTertiary, textTransform: 'uppercase' as const, letterSpacing: 0.1 },
  label: { fontSize: 11, fontWeight: '600' as const, color: colors.textTertiary, textTransform: 'uppercase' as const, letterSpacing: 0.08 },
}
