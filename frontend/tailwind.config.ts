import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
    './src/shared/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ── Aureum Prestige Design System ─────────────────────────────
        // Gold (Primary) — matches #D4A84B (primary-container) / #7a5900 (primary)
        gold: {
          50:  '#FBF7EC',
          100: '#ffdea2', // primary-fixed
          200: '#eec060', // primary-fixed-dim / inverse-primary
          300: '#EDD17A',
          400: '#D4A84B', // primary-container → CTA background
          500: '#B8912F',
          600: '#7a5900', // primary → text on light bg
          700: '#5c4200', // on-primary-fixed-variant
          800: '#563e00', // on-primary-container
          900: '#261900', // on-primary-fixed
        },
        // Navy (Base dark)
        navy: {
          50:  '#f8f9fa', // surface / background
          100: '#f3f4f5', // surface-container-low
          200: '#edeeef', // surface-container
          300: '#e7e8e9', // surface-container-high
          400: '#d9dadb', // surface-dim
          500: '#807665', // outline
          600: '#4e4637', // on-surface-variant
          700: '#191c1d', // on-surface / on-background
          800: '#2e3132', // inverse-surface
          900: '#0F1B2D', // nav/footer dark base
        },
        // Design-system semantic tokens (match HTML classes)
        'surface':                  '#f8f9fa',
        'surface-dim':              '#d9dadb',
        'surface-bright':           '#f8f9fa',
        'surface-container-lowest': '#ffffff',
        'surface-container-low':    '#f3f4f5',
        'surface-container':        '#edeeef',
        'surface-container-high':   '#e7e8e9',
        'surface-container-highest':'#e1e3e4',
        'on-surface':               '#191c1d',
        'on-surface-variant':       '#4e4637',
        'outline':                  '#807665',
        'outline-variant':          '#d2c5b1',
        'primary':                  '#7a5900',
        'on-primary':               '#ffffff',
        'primary-container':        '#d4a84b',
        'on-primary-container':     '#563e00',
        'primary-fixed':            '#ffdea2',
        'primary-fixed-dim':        '#eec060',
        'inverse-primary':          '#eec060',
        'on-primary-fixed':         '#261900',
        'on-primary-fixed-variant': '#5c4200',
        'secondary':                '#535f74',
        'on-secondary':             '#ffffff',
        'secondary-container':      '#d4e0f9',
        'on-secondary-container':   '#576378',
        'secondary-fixed':          '#d7e3fc',
        'secondary-fixed-dim':      '#bbc7df',
        'on-secondary-fixed':       '#101c2e',
        'on-secondary-fixed-variant':'#3c475b',
        'tertiary':                 '#575e70',
        'on-tertiary':              '#ffffff',
        'tertiary-container':       '#a8aec2',
        'on-tertiary-container':    '#3b4252',
        'tertiary-fixed':           '#dce2f7',
        'tertiary-fixed-dim':       '#c0c6db',
        'on-tertiary-fixed':        '#141b2b',
        'on-tertiary-fixed-variant':'#404758',
        'background':               '#f8f9fa',
        'on-background':            '#191c1d',
        'surface-variant':          '#e1e3e4',
        'surface-tint':             '#7a5900',
        'inverse-surface':          '#2e3132',
        'inverse-on-surface':       '#f0f1f2',
        'error':                    '#ba1a1a',
        'on-error':                 '#ffffff',
        'error-container':          '#ffdad6',
        'on-error-container':       '#93000a',

        // Semantic
        success: '#059669',
        warning: '#D97706',
        info:    '#2563EB',
      },
      fontFamily: {
        heading:       ['Playfair Display', 'Georgia', 'serif'],
        body:          ['Inter', 'system-ui', 'sans-serif'],
        mono:          ['JetBrains Mono', 'Courier New', 'monospace'],
        // aliases matching HTML design
        'display-lg':  ['Playfair Display', 'serif'],
        'display-md':  ['Playfair Display', 'serif'],
        'headline-sm': ['Playfair Display', 'serif'],
        'body-lg':     ['Inter', 'sans-serif'],
        'body-md':     ['Inter', 'sans-serif'],
        'label-md':    ['Inter', 'sans-serif'],
      },
      fontSize: {
        'display-lg': ['48px', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '700' }],
        'display-md': ['36px', { lineHeight: '1.2', fontWeight: '600' }],
        'headline-sm':['24px', { lineHeight: '1.4', fontWeight: '600' }],
        'body-lg':    ['18px', { lineHeight: '1.6', fontWeight: '400' }],
        'body-md':    ['16px', { lineHeight: '1.6', fontWeight: '400' }],
        'label-md':   ['14px', { lineHeight: '1.2', letterSpacing: '0.05em', fontWeight: '600' }],
        // Legacy aliases
        'display':    ['2.5rem', { lineHeight: '1.2', fontWeight: '700' }],
        'h1':         ['2rem',   { lineHeight: '1.3', fontWeight: '700' }],
        'h2':         ['1.5rem', { lineHeight: '1.4', fontWeight: '600' }],
        'h3':         ['1.25rem',{ lineHeight: '1.5', fontWeight: '600' }],
      },
      spacing: {
        'stack-xs':       '8px',
        'stack-sm':       '12px',
        'stack-md':       '24px',
        'stack-lg':       '48px',
        'stack-xl':       '80px',
        'gutter':         '24px',
        'margin-mobile':  '16px',
        'margin-desktop': '48px',
        'container-max':  '1280px',
        'unit':           '8px',
        '18': '4.5rem',
        '22': '5.5rem',
      },
      boxShadow: {
        // ── Elevation System ──────────────────────────────────────────
        // flat   → no shadow (use border only)
        'elevation-low':  '0 1px 3px 0 rgba(15,27,45,0.08), 0 1px 2px -1px rgba(15,27,45,0.04)',
        'elevation-mid':  '0 4px 12px -2px rgba(15,27,45,0.12), 0 2px 6px -2px rgba(15,27,45,0.06)',
        'elevation-high': '0 16px 40px -4px rgba(15,27,45,0.18), 0 8px 16px -8px rgba(15,27,45,0.10)',
        // Gold-tinted (for CTA/product hover)
        'elevation-gold': '0 8px 24px -4px rgba(212,168,75,0.25)',
      },
      transitionDuration: {
        // Standard interaction durations
        fast:    '150ms',  // micro: hover color
        DEFAULT: '200ms',  // standard: most interactions
        slow:    '300ms',  // deliberate: drawer/accordion
        slower:  '500ms',  // layout/page transitions
      },
      transitionTimingFunction: {
        DEFAULT: 'cubic-bezier(0.4, 0, 0.2, 1)', // standard ease
        spring:  'cubic-bezier(0.34, 1.56, 0.64, 1)', // subtle spring
      },
      borderRadius: {
        'DEFAULT': '0.25rem',
        'sm':      '0.25rem',
        'md':      '0.5rem',    // base input / card
        'lg':      '0.5rem',    // buttons (matches DESIGN.md rounded-lg)
        'xl':      '0.75rem',
        '2xl':     '1rem',
        'full':    '9999px',
      },
      maxWidth: {
        '8xl': '90rem',
      },
    },
  },
  plugins: [],
}

export default config
