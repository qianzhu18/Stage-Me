import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        stage: {
          bg: '#09070d',
          panel: '#12081f',
          pink: '#ff4db8',
          cyan: '#4ef2ff',
          mint: '#7effcd',
          danger: '#ff6b8a'
        }
      },
      boxShadow: {
        neon: '0 0 30px rgba(255, 77, 184, 0.28)',
        cyan: '0 0 30px rgba(78, 242, 255, 0.18)'
      },
      backgroundImage: {
        'stage-grid': 'radial-gradient(circle at top, rgba(255, 78, 183, 0.18), transparent 28%), radial-gradient(circle at 78% 18%, rgba(78, 242, 255, 0.14), transparent 22%), linear-gradient(160deg, #09070d 0%, #12081f 46%, #06050b 100%)'
      }
    }
  },
  plugins: []
};

export default config;
