const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    background: './src/scripts/background.js',
    content: './src/scripts/content.js',
    popup: './src/scripts/popup.js',
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'manifest.json', to: 'manifest.json' },
        { from: 'assets/', to: 'assets/' },
        { from: 'src/popup.html', to: 'popup.html' },
      ],
    }),
  ],
  mode: 'production',
};
