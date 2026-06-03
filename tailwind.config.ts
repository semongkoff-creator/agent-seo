import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
    './reference-html/**/*.html'
  ],
  theme: {
    extend: {
      colors: {
        background: '#f9f9f9',
        surface: '#f9f9f9',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#f3f3f3',
        'surface-container': '#eeeeee',
        'surface-container-high': '#e8e8e8',
        'surface-container-highest': '#e2e2e2',
        'surface-variant': '#e2e2e2',
        primary: '#3525cd',
        'primary-container': '#4f46e5',
        'primary-fixed': '#e2dfff',
        'primary-fixed-dim': '#c3c0ff',
        'on-primary': '#ffffff',
        'on-primary-container': '#dad7ff',
        'on-primary-fixed': '#0f0069',
        'on-primary-fixed-variant': '#3323cc',
        secondary: '#565e74',
        'secondary-container': '#dae2fd',
        'secondary-fixed': '#dae2fd',
        'secondary-fixed-dim': '#bec6e0',
        'on-secondary': '#ffffff',
        'on-secondary-container': '#5c647a',
        'on-secondary-fixed': '#131b2e',
        'on-secondary-fixed-variant': '#3f465c',
        tertiary: '#7e3000',
        'tertiary-container': '#a44100',
        'tertiary-fixed': '#ffdbcc',
        'tertiary-fixed-dim': '#ffb695',
        'on-tertiary': '#ffffff',
        'on-tertiary-container': '#ffd2be',
        'on-tertiary-fixed': '#351000',
        'on-tertiary-fixed-variant': '#7b2f00',
        error: '#ba1a1a',
        'error-container': '#ffdad6',
        'on-error': '#ffffff',
        'on-error-container': '#93000a',
        outline: '#777587',
        'outline-variant': '#c7c4d8',
        'on-surface': '#1a1c1c',
        'on-surface-variant': '#464555',
        'on-background': '#1a1c1c',
        'inverse-surface': '#2f3131',
        'inverse-on-surface': '#f0f1f1',
        'inverse-primary': '#c3c0ff',
        'surface-dim': '#dadada',
        'surface-bright': '#f9f9f9',
        'surface-tint': '#4d44e3'
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        lg: '0.5rem',
        xl: '0.75rem',
        full: '9999px'
      },
      spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2.5rem',
        'margin-mobile': '1rem',
        'margin-desktop': '2rem',
        gutter: '1.5rem',
        base: '4px'
      },
      fontFamily: {
        'headline-md': ['Inter', 'sans-serif'],
        'headline-lg': ['Inter', 'sans-serif'],
        'data-lg': ['JetBrains Mono', 'monospace'],
        'data-md': ['JetBrains Mono', 'monospace'],
        'body-md': ['Inter', 'sans-serif'],
        'body-lg': ['Inter', 'sans-serif'],
        'body-sm': ['Inter', 'sans-serif'],
        'display-lg': ['Inter', 'sans-serif'],
        'label-caps': ['Inter', 'sans-serif']
      },
      fontSize: {
        'headline-md': ['24px', { lineHeight: '32px', letterSpacing: '-0.01em', fontWeight: '600' }],
        'headline-lg': ['32px', { lineHeight: '40px', letterSpacing: '-0.02em', fontWeight: '600' }],
        'data-lg': ['16px', { lineHeight: '24px', fontWeight: '500' }],
        'data-md': ['14px', { lineHeight: '20px', fontWeight: '500' }],
        'body-md': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'body-lg': ['18px', { lineHeight: '28px', fontWeight: '400' }],
        'body-sm': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'display-lg': ['48px', { lineHeight: '56px', letterSpacing: '-0.02em', fontWeight: '700' }],
        'label-caps': ['12px', { lineHeight: '16px', letterSpacing: '0.05em', fontWeight: '600' }]
      }
    }
  },
  plugins: []
};

export default config;
