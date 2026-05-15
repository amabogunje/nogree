/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bone: '#e9dfce',
        ink: '#0d0c0b',
        smoke: '#24211e',
        ash: '#8f8779',
      },
      fontFamily: {
        display: ['Arial Black', 'Impact', 'system-ui', 'sans-serif'],
        body: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        drift: {
          '0%, 100%': { transform: 'translate3d(0, 0, 0) rotate(-2deg)' },
          '50%': { transform: 'translate3d(-1.5rem, 0.8rem, 0) rotate(1deg)' },
        },
        pulseGrain: {
          '0%, 100%': { opacity: '0.2' },
          '50%': { opacity: '0.35' },
        },
        revealUp: {
          '0%': { opacity: '0', transform: 'translateY(26px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(38px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
      animation: {
        drift: 'drift 14s ease-in-out infinite',
        grain: 'pulseGrain 2.6s steps(4) infinite',
        reveal: 'revealUp 900ms cubic-bezier(.2,.8,.2,1) both',
        slideIn: 'slideIn 1100ms cubic-bezier(.2,.8,.2,1) both',
      },
    },
  },
  plugins: [],
};
