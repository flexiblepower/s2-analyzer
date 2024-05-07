/** @type {import('tailwindcss').Config} */
export default {
  content: [ './src/**/*.{js,jsx,ts,tsx}', './index.html',
],
  theme: {
    extend: {
      colors:{
        "tno-blue": "#3a617f",
        "stephanie-color": "#31302C",
        "base-gray": "#2C2D31",
        "secondary-gray":"#808183"
      }
    },
  }
}

