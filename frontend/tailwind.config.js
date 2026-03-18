/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#0f1f42',
          yellow: '#f9b31d',
          cyan: '#0dbdc6',
          sand: '#efe7d7'
        },
        shell: '#f4f6fb'
      },
      fontFamily: {
        sans: ['Manrope', 'sans-serif'],
        display: ['Space Grotesk', 'sans-serif']
      }
    }
  },
  plugins: []
}