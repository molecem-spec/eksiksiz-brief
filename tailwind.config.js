/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Ana renk: pastel lila. Butonlar ve vurgular buradan gelir.
        brand: {
          50: '#f6f2ff',
          100: '#ede5ff',
          200: '#ddcfff',
          300: '#c6adfb',
          400: '#ac89f4',
          500: '#9169e9',
          600: '#7a4fd8',
          700: '#663fbb',
          800: '#553599',
          900: '#472e7c',
        },
        // Ikincil: pastel pembe
        blossom: {
          50: '#fff2f8',
          100: '#ffe4f0',
          200: '#ffc9e2',
          300: '#ffa1cb',
          400: '#fb74ae',
          500: '#f04f92',
          600: '#dc3576',
          700: '#b9275e',
          800: '#98234e',
          900: '#7f2244',
        },
        // Uceuncul: pastel turuncu / seftali
        peach: {
          50: '#fff6ee',
          100: '#ffead8',
          200: '#ffd2ae',
          300: '#ffb27a',
          400: '#ff8d44',
          500: '#fb6f1d',
          600: '#ec5410',
          700: '#c43e0f',
          800: '#9c3314',
          900: '#7e2c13',
        },
        // Yumusak, hafif mor tonlu yuzeyler
        surface: {
          0: '#ffffff',
          50: '#fdfaff',
          100: '#f8f3fc',
          200: '#efe7f5',
          300: '#e0d4ea',
        },
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(90,60,140,0.07),0 1px 2px -1px rgba(90,60,140,0.05)',
        'card-hover': '0 6px 20px -4px rgba(90,60,140,0.14),0 2px 6px -2px rgba(90,60,140,0.08)',
        glow: '0 8px 30px -8px rgba(145,105,233,0.45)',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg,#9169e9 0%,#f04f92 55%,#fb6f1d 100%)',
        'soft-gradient': 'linear-gradient(135deg,#f6f2ff 0%,#fff2f8 50%,#fff6ee 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        // Giris ekranindaki dekoratif renk lekeleri icin yavas suzulme
        float: 'float 11s ease-in-out infinite',
        'float-slow': 'float 16s ease-in-out infinite',
        'rise-in': 'riseIn 0.5s cubic-bezier(0.22,1,0.36,1) both',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        float: {
          '0%, 100%': { transform: 'translate3d(0,0,0)' },
          '50%': { transform: 'translate3d(0,-18px,0)' },
        },
        riseIn: {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
