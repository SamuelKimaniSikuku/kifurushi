/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        kenya: { green: '#1B5E20', light: '#2E7D32', dark: '#0D3B0F' },
        accent: { DEFAULT: '#E65100', light: '#FF6D00' },
        gold: '#FFC107',
      },
    },
  },
  plugins: [],
};
