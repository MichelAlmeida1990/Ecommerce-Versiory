module.exports = {
  content: [
    './index.html',
    './**/*.{html,ts,tsx,js,jsx}',
    './components/**/*.{ts,tsx,js,jsx}'
  ],
  theme: {
    extend: {
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
