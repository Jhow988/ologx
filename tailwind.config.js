/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#cdb27b',
        accent: '#de7c04',
        'primary-dark': '#b59a66',
        'accent-dark': '#c56d03',
        dark: {
          bg: '#1a202c',
          'bg-secondary': '#2d3748',
          text: '#e2e8f0',
          'text-secondary': '#a0aec0',
          border: '#4a5568',
        }
      },
    },
  },
  plugins: [],
};
