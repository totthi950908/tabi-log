/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // 旅の空をイメージした青〜ティール系（ライトテーマ）
        bg: '#f8fafc',
        surface: '#ffffff',
        surface2: '#f1f5f9',
        border: '#e2e8f0',
        ink: '#0f172a',
        accent: '#0ea5e9',   // sky
        accent2: '#14b8a6',  // teal
        accent3: '#f59e0b',  // amber（支出・強調）
        danger: '#ef4444',
        muted: '#64748b',
        subtle: '#94a3b8',
      },
      fontFamily: {
        sans: ['"Hiragino Sans"', '"Noto Sans JP"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
