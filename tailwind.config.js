module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],

  theme: {
    screens: {
      sm: "640px",
      md: "960px",
    },
    borderRadius: {
      none: "0",
      md: "0.25rem",
      lg: "0.375rem",
      full: "9999px",
    },

    colors: {
      "bg-drawer": "#FDFCFA",
      inherit: "inherit",
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
      "accent-blue": "#0000FF", //blue
      "accent-red": "#DC143C", //crimson
      "accent-gold": "#FFD700", //gold
      "accent-green": "#008000", //green

      //BG COLORS
      "bg-blue": "#F0F7FA",
      "bg-red": "#FFEAEA",
      "bg-gold": "#FFF3CE",
      "bg-green": "#F0FFF0",

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
    fontSize: {
      xs: ".75rem",
      sm: ".875rem",
      base: "1rem",
      lg: "1.125rem",
      xl: "1.625rem",
      "2xl": "2rem",
    },
  },

  variants: {
    extend: {},
  },
  plugins: [],
};
