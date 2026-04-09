import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4F46E5', // indigo-600
          dark: '#3730A3', // indigo-800
          light: '#EEF2FF', // indigo-50
          hover: '#4338CA', // indigo-700
        },
        accent: {
          DEFAULT: '#F59E0B', // amber-500
          light: '#FFFBEB', // amber-50
        },
        success: {
          DEFAULT: '#10B981', // emerald-500
        },
        error: {
          DEFAULT: '#EF4444', // red-500
        },
        warning: {
          DEFAULT: '#FB923C', // orange-400
        },
        background: {
          DEFAULT: '#FFFFFF',
          section: '#F8FAFC', // slate-50
        },
        surface: {
          DEFAULT: '#FFFFFF',
          card: '#FFFFFF',
        },
        border: {
          DEFAULT: '#E5E7EB', // gray-200
          light: '#F3F4F6', // gray-100
        },
        text: {
          primary: '#111827', // gray-900
          secondary: '#4B5563', // gray-600
          muted: '#9CA3AF', // gray-400
          inverse: '#FFFFFF',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        'hind-siliguri': ['Hind Siliguri', 'sans-serif'],
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
    },
  },
  plugins: [],
} satisfies Config;
