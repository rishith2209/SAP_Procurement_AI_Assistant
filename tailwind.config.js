/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        sap: {
          blue: {
            DEFAULT: '#005a9e',
            light: '#e1f4ff',
            medium: '#0078d4',
            dark: '#00325a',
            hover: '#004578',
          },
          accent: {
            DEFAULT: '#ff8c00',
            light: '#fff2e6',
            dark: '#b36200',
          },
          gray: {
            50: '#f9fafb',
            100: '#f3f4f6',
            200: '#e5e7eb',
            300: '#d1d5db',
            400: '#9ca3af',
            500: '#6b7280',
            600: '#4b5563',
            700: '#374151',
            800: '#1f2937',
            900: '#111827',
          },
          status: {
            success: {
              bg: '#e2f6ec',
              text: '#107c41',
              darkBg: '#0f3c21',
              darkText: '#47d384',
            },
            warning: {
              bg: '#fff4ce',
              text: '#795600',
              darkBg: '#443107',
              darkText: '#ffc83d',
            },
            error: {
              bg: '#fde7e9',
              text: '#a80000',
              darkBg: '#3d0a0a',
              darkText: '#ff6b6b',
            },
            info: {
              bg: '#edf2f7',
              text: '#2b6cb0',
              darkBg: '#1a365d',
              darkText: '#63b3ed',
            },
            draft: {
              bg: '#f3f4f6',
              text: '#4b5563',
              darkBg: '#374151',
              darkText: '#d1d5db',
            }
          },
          bg: {
            light: '#f5f6f8',
            dark: '#121e28',
          },
          card: {
            light: '#ffffff',
            dark: '#1c2a35',
          },
          border: {
            light: '#e2e8f0',
            dark: '#2d3b45',
          }
        }
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        fiori: '0 2px 8px 0 rgba(0, 0, 0, 0.05), 0 0 1px 0 rgba(0, 0, 0, 0.1)',
        'fiori-dark': '0 4px 12px 0 rgba(0, 0, 0, 0.3), 0 0 2px 0 rgba(255, 255, 255, 0.05)',
        card: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04)',
      },
      animation: {
        'typing': 'typing 1s infinite steps(3)',
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'pulse-subtle': 'pulseSubtle 2s infinite ease-in-out',
      },
      keyframes: {
        typing: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-4px)' }
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideIn: {
          '0%': { transform: 'translateX(20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' }
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' }
        }
      }
    },
  },
  plugins: [],
}
