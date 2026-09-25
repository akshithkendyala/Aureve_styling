import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        aureve: {
          50: "#FAF8F5",
          100: "#F4EFEA",
          200: "#E8DFD5",
          300: "#D6C7B7",
          400: "#B89F88",
          500: "#9A7B5F",
          600: "#7E6047",
          700: "#5E4633",
          800: "#3D2E22",
          900: "#221A13",
          950: "#130E0A",
        },
        noir: {
          900: "#0D0D0E",
          850: "#141416",
          800: "#1C1C1F",
          700: "#2A2A2E",
          600: "#3E3E44",
        },
        sand: {
          50: "#FAF9F6",
          100: "#F3EFE6",
          200: "#E7DFD0",
          300: "#D8CBB6",
        },
        champagne: {
          DEFAULT: "#D4AF37",
          light: "#EEDC82",
          dark: "#AA820A",
        },
        emeraldRefined: {
          DEFAULT: "#2D5A46",
          light: "#3E7B5F",
        }
      },
      fontFamily: {
        serif: ["var(--font-cormorant)", "Playfair Display", "Georgia", "serif"],
        sans: ["var(--font-inter)", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
      boxShadow: {
        'luxury': '0 10px 30px -10px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.03)',
        'luxury-hover': '0 20px 40px -15px rgba(0, 0, 0, 0.12), 0 8px 10px -4px rgba(0, 0, 0, 0.05)',
        'card-subtle': '0 2px 10px rgba(0, 0, 0, 0.03)',
        'inner-soft': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.02)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      }
    },
  },
  plugins: [],
};
export default config;
