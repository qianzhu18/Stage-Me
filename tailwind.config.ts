import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        stage: {
          bg: '#06050B',
          ink: '#0F0C17',
          smoke: '#171320',
          fog: '#1F1A2A',
          panel: '#121019',
          shell: '#181421',
          line: '#302A3D',
          pink: '#FF4DB8',
          cyan: '#4EF2FF',
          mint: '#7EFFCD',
          rose: '#FF6B9B',
          danger: '#FF2A55',
          ivory: '#F4EFFA',
          mist: '#B7AEC4',
          ash: '#8E879C'
        }
      },
      fontFamily: {
        bebas: ['"Bebas Neue"', 'sans-serif'],
        space: ['"Space Grotesk"', 'sans-serif']
      },
      boxShadow: {
        'neon-pink': '0 0 24px rgba(255, 77, 184, 0.26)',
        'neon-cyan': '0 0 24px rgba(78, 242, 255, 0.22)',
        panel: '0 30px 60px rgba(0, 0, 0, 0.55)'
      },
      dropShadow: {
        'text-pink': '0 0 10px rgba(255, 77, 184, 0.8)',
        'text-cyan': '0 0 10px rgba(78, 242, 255, 0.8)'
      },
      backgroundImage: {
        'stage-grid': 'radial-gradient(circle at top, rgba(255, 78, 183, 0.12), transparent 26%), radial-gradient(circle at 78% 18%, rgba(78, 242, 255, 0.09), transparent 22%), linear-gradient(160deg, #08060d 0%, #14101c 46%, #07060b 100%)'
      }
    }
  },
  plugins: []
};

export default config;
