import type { Config } from "tailwindcss";

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'sans-serif']
      },
      height: {
        header: "35px", 
        onbarding: "400px",
      },
      colors: {
        // Base color palette
        border: "hsl(var(--border))",
        dragger: "hsl(var(--dragger))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        primaryBlue: "#0779d1",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        sidebar: "var(--sidebar)",
        content: "var(--content)",
        hovered: "var(--hovered)",
        captcha: "var(--captcha)",
        
        // Primary color variations
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          50: "hsl(var(--primary-50, 0 0% 97%))",
          100: "hsl(var(--primary-100, 0 0% 94%))",
          200: "hsl(var(--primary-200, 0 0% 90%))",
          300: "hsl(var(--primary-300, 0 0% 85%))",
          400: "hsl(var(--primary-400, 0 0% 75%))",
          500: "hsl(var(--primary-500, 0 0% 65%))",
          600: "hsl(var(--primary-600, 0 0% 55%))",
          700: "hsl(var(--primary-700, 0 0% 45%))",
        },
        
        // Refined gray scale
        gray: {
          50: "hsl(var(--gray-50, 0 0% 98%))",
          100: "hsl(var(--gray-100, 0 0% 96%))",
          200: "hsl(var(--gray-200, 0 0% 92%))",
          300: "hsl(var(--gray-300, 0 0% 88%))",
          400: "hsl(var(--gray-400, 0 0% 78%))",
          500: "hsl(var(--gray-500, 0 0% 68%))",
          600: "hsl(var(--gray-600, 0 0% 58%))",
          700: "hsl(var(--gray-700, 0 0% 48%))",
        },
        
        // Semantic colors
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
      
      // Typography
      fontSize: {
        'xs': '0.75rem',
        'sm': '0.800rem',
        'base': '0.825rem',
        'lg': '1.125rem',
        'xl': '1.25rem',
        '2xl': '1.5rem',
      },

      fontWeight: {
        'bold': '700',
      },

      padding: {
        'xs': '0.25rem',
        'sm':'0.5rem', 
        'md': '1rem', 
        'lg':'1.5rem'
      },
      
      // Spacing
      spacing: {
        'sm': '0.25rem' ,     
        'md': '0.5rem',  
      },
      
      // Border Radius
      borderRadius: {
        'sm': '0.25rem',
        'DEFAULT': '0.375rem',
        'md': '0.5rem',
        'lg': '0.75rem',
        'xl': '1rem',
        'full': '9999px',
      },
      
      // Transition and Animation
      transitionDuration: {
        '250': '250ms',
        '350': '350ms',
        '450': '450ms',
      },
      
      // Keyframes and Animations
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "subtle-pulse": {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.02)' },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "subtle-pulse": "subtle-pulse 2s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

export default config;