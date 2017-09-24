const path = require('path');

const HtmlWebpackPlugin = require('html-webpack-plugin');

const copyHTMLTemplate = new HtmlWebpackPlugin({
  template: "template/index.html"
});

const config = {
  entry: {
    "app": [
      "./src/vuni.js"
    ],
  },
  output: {
    filename: "vuni.js",
    path: path.resolve(__dirname, "build"),
    libraryTarget: "umd",
    umdNamedDefine: true
  },
  devtool: "source-map",
  devServer: {
    contentBase: path.join(__dirname, "build"),
    compress: true,
    open: true,
    hot: false,
  },
  module: {
    rules: [
      {
        use: [
          {
            loader: "babel-loader",
            options: {
              presets: [
                "env"
              ],
              plugins: [
                require('babel-plugin-transform-object-rest-spread'), 
                require('babel-plugin-transform-class-properties'),
              ],
            }
          },
        ],
        test: /\.jsx?$/,
        exclude: [
          path.resolve(__dirname, "node_modules"),
        ]
      },
      {
        test: /\.(jpe?g|png|gif|svg)$/,
        use: [
          {
            loader: "url-loader",
            options: { limit: 5000 }
          },
          "image-webpack-loader"
        ]
      }
    ]
  },
  plugins: [
    copyHTMLTemplate
  ]
};

module.exports = config;