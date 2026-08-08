/**
 * Thang màu UMC neo vào 2 màu trích từ file logo gốc:
 *   #1854a8 (xanh dương đậm, 52% diện tích logo)  -> umc-600/700
 *   #48c0f0 (xanh cyan sáng, 25% diện tích logo)  -> cyan-400
 * Hai biến cũ trong index.css nằm đúng trong thang này:
 *   --umc-blue #2260aa = umc-600 ; --umc-navy #123d79 = umc-800
 * Dùng thang này để thay hết `teal-*` vốn không thuộc bộ nhận diện.
 */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        umc: {
          50: "#eff6fd",
          100: "#dbeafb",
          200: "#bfdbf7",
          300: "#92c3f1",
          400: "#5fa4e8",
          500: "#3b84dc",
          600: "#2260aa",
          700: "#1d5296",
          800: "#123d79",
          900: "#143462",
          950: "#0e2242",
        },
        cyan: {
          50: "#f0fafe",
          100: "#e0f4fc",
          200: "#bbe8f8",
          300: "#85d7f2",
          400: "#52c3e9",
          500: "#27a7d4",
          600: "#1888b4",
          700: "#166e92",
          800: "#185b78",
          900: "#184c64",
          950: "#0e3145",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
