/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          900: '#064e3b',
          neon: '#00e676',
          'neon-dark': '#00c764',
        },
        dark: {
          bg: '#0b0f17',
          'bg-alt': '#0d1220',
          surface: '#121824',
          card: '#161f2e',
          border: '#334155',
          slate: '#1e293b',
        },
        bronze: {
          DEFAULT: '#b45309',
          light: '#E9A867',
          dark: '#78350f',
        },
        silver: {
          DEFAULT: '#64748b',
          light: '#C9D1DC',
          dark: '#334155',
        },
        gold: {
          DEFAULT: '#d97706',
          light: '#FFD95A',
          bright: '#F5C542',
          dark: '#92400e',
        },
      },
    },
  },
  plugins: [],
};
