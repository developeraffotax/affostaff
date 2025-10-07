module.exports = {
  content: [
    "./src/renderer/**/*.{js,ts,jsx,tsx}",
     
  ],
  theme: {
    extend: {
      fontFamily: {
        outfit: ['Outfit', 'ui-sans-serif', 'system-ui'], 
         
        // you can fall back to default sans fonts 
      }
    }
  },
  plugins: [],
};