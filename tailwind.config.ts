import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        /** Text only — "ink" is what you write with. Higher = darker. */
        ink: {
          900: "#14141A",
          800: "#24242E",
          700: "#35353F",
          600: "#4E4E5C",
          500: "#6C6C7B",
          400: "#8E8E9C",
          300: "#B0B0BC",
        },
        /** Light surfaces for the site chrome. */
        paper: {
          DEFAULT: "#F5F5F7",
          50: "#FFFFFF",
          100: "#FAFAFB",
          200: "#EFEFF3",
          300: "#E3E3E9",
        },
        line: {
          DEFAULT: "#E4E4EA",
          strong: "#CACAD4",
        },
        /**
         * The planner stays dark: equipment blocks and warning colours need to
         * pop, and a dark floor reads as "workspace" the way CAD tools do.
         */
        canvas: {
          DEFAULT: "#1C1C23",
          floor: "#26262F",
          grid: "#33333F",
          gridMajor: "#454554",
          wall: "#7C7C8C",
        },
        accent: {
          /** Brand orange — borders, highlights, small marks. */
          DEFAULT: "#FF4D1C",
          /** Deepened so white button text clears WCAG AA. */
          600: "#DE3D0E",
          700: "#B8310A",
          400: "#FF7A4F",
          50: "#FFF2EC",
        },
        warn: "#B26A00",
        warnBg: "#FFF6E5",
        danger: "#C62828",
        dangerBg: "#FDECEC",
        ok: "#15803D",
        okBg: "#ECFDF3",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(20,20,26,0.05), 0 1px 3px rgba(20,20,26,0.04)",
      },
    },
  },
  plugins: [],
};

export default config;
