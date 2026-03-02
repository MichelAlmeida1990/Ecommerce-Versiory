module.exports = {
  content: [
    './index.html',
    './src/**/*.{html,ts,tsx,js,jsx}',
    './components/**/*.{ts,tsx,js,jsx}',
    './*.{html,ts,tsx,js,jsx}'
  ],
  theme: {
    extend: {
      screens: {
        'tablet': '768px',
        'tablet-max': {'max': '1024px'},
        'tablet-only': {'min': '768px', 'max': '1024px'},
      },
      colors: {
        'versiory-ink': '#0f172a',
        'versiory-sand': '#f6efe6',
        'versiory-ivory': '#fff7ee',
        'versiory-coral': '#ff6b4a',
        'versiory-teal': '#1b9aaa',
        'versiory-gold': '#f3b45c',
        'versiory-moss': '#6b8f71',
      }
    },
  },
  plugins: [],
}
