/** @type {import('tailwindcss').Config} */
export default {
  content: [ './src/**/*.{js,jsx,ts,tsx}', './index.html',
],
  theme: {
    extend: {
      colors:{
        "tno-blue": "#1A0DAB",
        "stephanie-color": "#31302C",
        "components-gray": "#2C2D31",
      }
    },
  }
}

