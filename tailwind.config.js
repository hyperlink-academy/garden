module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],

  darkMode: false,

  theme: {
    borderRadius: {
      none: "0",
      md: "0.25rem",
      lg: "0.375rem",
      full: "9999px",
    },

    colors: {
      "bg-drawer": "#FDFCFA",
      transparent: "transparent",
      current: "currentColor",
      background: "floralwhite",

      //JUST A BUNCH OF GRAYS. # refers to lightness value. 95 = lightest, 15 = darkest

      "grey-15": "#272727",
      "grey-35": "#595959",
      "grey-55": "#8C8C8C",
      "grey-80": "#CCCCCC",
      "grey-90": "#E6E6E6",
      white: "#FFFFFF",

      //ACCENT COLORS
      "accent-blue": "#0000FF",
      "accent-red": "#DC143C",

      //BG COLORS
      "bg-blue": "#F0F7FA",

      //DO NOT USE IN PRODUCTION. Test colors to aid development, ie, setting bg color on element to see edges of div. DO. NOT. USE. IN. PRODUCTION
      "test-pink": "#E18181",
      "test-blue": "#48D1EF",
    },

    extend: {
      boxShadow: {
        inset: "0 35px 60px -15px rgba(0, 0, 0, 0.3)",
        drop: "0px 2px 3px rgba(0, 0, 0, 0.25), 0px 0.25px 6px rgba(0, 0, 0, 0.15);",
      },
    },
  },

  fontSize: {
    xs: ".75rem",
    sm: ".875rem",
    base: "1rem",
    lg: "1.25rem",
    xl: "1.625rem",
    "2xl": "2rem",
  },

  variants: {
    extend: {},
  },
  plugins: [],
};
