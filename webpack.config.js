const path = require('path');

const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const copyHTMLTemplate = new HtmlWebpackPlugin({
  template: 'playground/index.html'
});

const copyStatic = new CopyWebpackPlugin([{ from: 'playground' }]);

const config = {
  entry: {
    app: ['babel-polyfill', './playground/index.js']
  },
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'pgbuild')
  },
  devtool: 'source-map',
  devServer: {
    contentBase: path.join(__dirname, 'pgbuild'),
    compress: true,
    open: true
  },
  module: {
    rules: [
      {
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: ['env'],
              plugins: [
                require('babel-plugin-transform-object-rest-spread'),
                require('babel-plugin-transform-class-properties')
              ]
            }
          }
        ],
        test: /\.jsx?$/,
        exclude: [path.resolve(__dirname, 'node_modules')]
      },
      {
        test: /\.scss$/,
        use: ['style-loader', 'css-loader', 'sass-loader']
      },
      {
        test: /\.(jpe?g|png|gif|svg)$/,
        use: [
          {
            loader: 'url-loader',
            options: { limit: 5000 }
          },
          'image-webpack-loader'
        ]
      }
    ]
  },
  plugins: [copyHTMLTemplate, copyStatic]
};

module.exports = config;
