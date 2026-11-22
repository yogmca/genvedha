const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.[contenthash].js',
    publicPath: '/',
    clean: true
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react']
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg|ico|webp|avif)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'images/[name].[hash][ext]'
        }
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx']
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.REACT_APP_USE_CLAUDE_API': JSON.stringify(process.env.REACT_APP_USE_CLAUDE_API || 'false'),
      'process.env.REACT_APP_LLM_MODEL': JSON.stringify(process.env.REACT_APP_LLM_MODEL || 'claude'),
      'process.env.REACT_APP_CLAUDE_API_AVAILABLE': JSON.stringify(process.env.REACT_APP_CLAUDE_API_AVAILABLE === 'true'),
      'process.env.REACT_APP_NVIDIA_API_AVAILABLE': JSON.stringify(process.env.REACT_APP_NVIDIA_API_AVAILABLE === 'true'),
    }),
    new HtmlWebpackPlugin({
      template: './public/index-template.html',
      filename: 'index.html',
      favicon: './public/logo.png'
    })
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'public')
    },
    historyApiFallback: true,
    port: 3001,
    hot: true,
    open: false,
    proxy: [
      {
        context: ['/api'],
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    ]
  },
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development'
};
