/** @type {import('tailwindcss').Config} */
export default {
  content: [ './src/**/*.{js,jsx,ts,tsx}', './index.html',
],
  theme: {
    extend: {
      colors:{
        "tno-blue": "#3a617f",
        "metallic-gray": "#31302C",
        "base-gray": "#2C2D31",
        "secondary-gray":"#808183",
        "base-backgroung":"#313338",
        "good-red":"#B7555D",
        "good-green":"B4DD6D",
        "good-orange":"#DDC66D"
      }
    },
  }
}

