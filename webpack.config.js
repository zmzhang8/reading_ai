const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    background: './src/scripts/background.ts',
    content: './src/scripts/content.ts',
    options: './src/scripts/options.ts',
    popup: './src/scripts/popup.ts',
    sidepanel: './src/scripts/sidepanel.ts',
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
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
        { from: 'src/pages/', to: '.' },
        { from: 'src/styles/', to: 'styles/' },
      ],
    }),
  ],
  mode: 'production',
};
