/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#161412",
        cream: "#f7f0e6",
        ember: "#d56f3e",
        moss: "#60705f",
        gold: "#c69c4b",
      },
      fontFamily: {
        display: ["Fraunces", "serif"],
        body: ["Manrope", "sans-serif"],
      },
      boxShadow: {
        card: "0 18px 60px rgba(22, 20, 18, 0.14)",
      },
    },
  },
  plugins: [],
};

