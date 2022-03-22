module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    borderRadius: {
      none: "0",
      md: "0.25rem",
      lg: "0.375rem",
    },
    colors: {
      "grey-15": "#272727",
      "grey-35": "#595959",
      "grey-55": "#8C8C8C",
      "grey-80": "#CCCCCC",
      "grey-90": "#E6E6E6",
      white: "#FFFFFF",
      background: "seashell",
      lightBG: "#FDFCFA",
      "accent-blue": "#0000FF",
      "accent-red": "#DC143C",
    },
    extend: {
      boxShadow: {
        inset: "0 35px 60px -15px rgba(0, 0, 0, 0.3)",
        drop: "0px 2px 3px rgba(0, 0, 0, 0.25), 0px 0.25px 6px rgba(0, 0, 0, 0.15);",
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
};
