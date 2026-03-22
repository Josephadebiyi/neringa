/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./screens/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: "class",
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#5845D8',
          50: '#F5F3FF',
          100: '#EDE9FE',
          200: '#DDD6FE',
          300: '#C4B5FD',
          400: '#A78BFA',
          500: '#5845D8',
          600: '#4C38C2',
          700: '#3F2BAA',
          800: '#322291',
          900: '#281A79',
        },
        secondary: '#6366F1',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        dark: '#1F2937',
        light: '#F9FAFB',
      },
      // fontFamily: {
      //   regular: ['PlusJakartaSans-Regular'],
      //   medium: ['PlusJakartaSans-Medium'],
      //   semibold: ['PlusJakartaSans-SemiBold'],
      //   bold: ['PlusJakartaSans-Bold'],
      // },
    },
  },
  plugins: [],
}
