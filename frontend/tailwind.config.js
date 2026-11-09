// Design tokens from the Figma "Furniture eCommerce Website UI" file (Funiro). Values are Figma style names → hex.
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        gold: { DEFAULT: "#B88E2F", dark: "#9A7522" },   // Primary
        ink: "#333333", ink2: "#666666",                 // Font / Color, Font / Color1
        g1: "#3A3A3A", g2: "#616161", g3: "#898989", g4: "#B0B0B0", g5: "#D8D8D8", g9f: "#9F9F9F",
        light: "#F4F5F7",                                // Color / Light BG (product card footer)
        cream: "#FFF3E3", peach: "#F9F1E7", strip: "#FAF3EA", inspo: "#FCF8F3",
        accent: { red: "#E97171", green: "#2EC1AC" },    // discount / new badges
        // legacy aliases so any older markup keeps working
        brand: { DEFAULT: "#B88E2F", dark: "#9A7522", soft: "#F9F1E7" },
      },
      fontFamily: {
        sans: ["Poppins", "system-ui", "sans-serif"],
        display: ["Poppins", "system-ui", "sans-serif"],
        logo: ["Montserrat", "Poppins", "sans-serif"],
      },
    },
  },
};
