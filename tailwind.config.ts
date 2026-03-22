import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        rose: {
          pale:  '#fdf2f8',
          light: '#fce7f3',
          DEFAULT: '#f472b6',
          deep:  '#db2777',
          darker:'#be185d',
        },
        gold: {
          light: '#f9e4a0',
          shine: '#ffe066',
          DEFAULT: '#d4a017',
        },
        cream: '#fffaf6',
        charcoal: '#2d1a24',
        muted: '#9d6b82',
      },
      fontFamily: {
        display: ['var(--font-playfair)', 'Georgia', 'serif'],
        body: ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
        script: ['var(--font-great-vibes)', 'cursive'],
      },
      borderRadius: {
        '2xl': '20px',
        '3xl': '28px',
      },
      boxShadow: {
        rose:        '0 8px 40px rgba(244,114,182,0.18)',
        gold:        '0 4px 24px rgba(212,160,23,0.15)',
        card:        '0 2px 16px rgba(0,0,0,0.06)',
        'card-hover':'0 16px 48px rgba(244,114,182,0.18)',
      },
      // Aliases para Tailwind reconhecer shadow-rose etc.
      // (Tailwind 3 já inclui no extend, nomes ficam shadow-rose, shadow-card etc.)
      animation: {
        'fade-up': 'fadeUp 0.6s ease forwards',
        'float': 'float 5s ease-in-out infinite',
        'bounce-slow': 'bounce 3s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(22px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-12px)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
