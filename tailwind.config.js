/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',

  content: [
    'index.html',
    './src/**'
  ],

  theme: {
    extend: {
      fontFamily: {
        sans: '-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji"'
      },
      colors: {
        transparent: 'transparent',
        current: 'currentColor',
        white: '#ffffff',
        gray: {
          50: '#f4f4f6',
          100: '#e8eaed',
          150: '#dddfe4',
          200: '#c6cad2',
          300: '#afb5c0',
          400: '#8d95a5',
          500: '#6c7689',
          600: '#3f4550',
          700: '#363b45',
          750: '#2d3139',
          800: '#202329',
          900: '#1b1d22',
          950: '#121417'
        },
        // gray: {
        //   750: '#2a3647',
        // },
        blue: {
          50: '#eef5ff',
          100: '#e0ecff',
          200: '#c7d8fe',
          300: '#a5c1fc',
          400: '#81a7f8',
          500: '#638bf1',
          600: '#4666e5',
          700: '#3850ca',
          800: '#3047a3',
          900: '#2e4681',
          950: '#1b254b',
        },
        // green: {
        //   50: '#ecfdf3',
        //   100: '#d1fadb',
        //   200: '#a7f3c2',
        //   300: '#6ee7a2',
        //   400: '#34d374',
        //   500: '#10b965',
        //   600: '#05964e',
        //   700: '#047848',
        //   800: '#065f33',
        //   900: '#064e2e',
        //   950: '#022c1a',
        // },
      },
    }
  },

  plugins: []
}
