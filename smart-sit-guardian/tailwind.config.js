/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#c0cedb', // 极浅空气灰（缓解视觉疲劳底色）
          card: '#FFFFFF', // 纯白卡片
          emerald: '#74f1c7', // 健康守护绿
          blue: '#73c5ff', // 效率专注蓝
          amber: '#f9c772', // 警告橙
          pink: '#f8a7c3'
        }
      }
    }
  },
  plugins: []
}
