
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary': 'var(--primary)',
        'primary-focus': 'var(--primary-focus)',
        'primary-content': 'var(--primary-content)',
        'secondary': 'var(--secondary)',
        'secondary-focus': 'var(--secondary-focus)',
        'base-100': 'var(--base-100)',
        'base-200': 'var(--base-200)',
        'base-300': 'var(--base-300)',
        'base-content': 'var(--base-content)',
        'info': 'var(--info)',
        'success': 'var(--success)',
        'warning': 'var(--warning)',
        'error': 'var(--error)',
      },
      fontFamily: {
        'playfair': ['"Playfair Display"', 'serif'],
        'merriweather': ['"Merriweather"', 'serif'],
        'great-vibes': ['"Great Vibes"', 'cursive'],
        'dancing-script': ['"Dancing Script"', 'cursive'],
        'lobster': ['"Lobster"', 'cursive'],
        'roboto-slab': ['"Roboto Slab"', 'serif'],
        'alegreya': ['"Alegreya"', 'serif'],
        'cormorant': ['"Cormorant Garamond"', 'serif'],
        'old-standard': ['"Old Standard TT"', 'serif'],
        'sacramento': ['"Sacramento"', 'cursive'],
        'cinzel': ['"Cinzel"', 'serif'],
        'eb-garamond': ['"EB Garamond"', 'serif'],
        'tangerine': ['"Tangerine"', 'cursive'],
        'pinyon-script': ['"Pinyon Script"', 'cursive'],
        'libre-baskerville': ['"Libre Baskerville"', 'serif'],
        'arvo': ['"Arvo"', 'serif'],
        'alex-brush': ['"Alex Brush"', 'cursive'],
        'allura': ['"Allura"', 'cursive'],
        'italianno': ['"Italianno"', 'cursive'],
        'unifrakturcook': ['"UnifrakturCook"', 'cursive'],
        'meddon': ['"Meddon"', 'cursive'],
        'im-fell': ['"IM Fell English"', 'serif'],
        'bookman': ['"Bookman Old Style"', 'serif'],
      }
    },
  },
  plugins: [],
}
