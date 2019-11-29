const webpack = require('webpack');
const path = require('path');
const {parseStringifiedEnv} = require('../common/helpers/env');

const sourcePath = path.join(__dirname, './');
const envPath = path.join(__dirname, './.env');
const distPath = path.join(__dirname, './dist');

module.exports = () => {
  const isProd = process.env.NODE_ENV === 'production';

  const plugins = [
    new webpack.DefinePlugin(parseStringifiedEnv(envPath)),
    new webpack.NamedModulesPlugin(),
    new webpack.HotModuleReplacementPlugin()
  ];

  const config = {
    mode: process.env.NODE_ENV,
    context: sourcePath,

    entry: {
      app: [
        './src/view/WebsiteApp.jsx'
      ],
      vendor: [
        'react',
        'react-dom',
        'immutable',
        'whatwg-fetch'
      ]
    },

    output: {
      path: distPath,
      publicPath: '/',
      filename: '[name].bundle.js'
    },

    module: {
      rules: [{
        test: /\.(woff|woff2|eot|ttf)(\?v=\d+\.\d+\.\d+)?$/,
        use: {
          loader: 'file-loader',
          options: {
            mimetype: 'application/font-woff',
            name: 'fonts/[name].[ext]'
          }
        }
      },
      {
        test: /\.html$/,
        exclude: /node_modules/,
        use: {
          loader: 'file-loader',
          query: {
            name: '[name].[ext]'
          }
        }
      },
      {
        test: /\.scss|.css$/,
        use: [
          'style-loader',
          'css-loader',
          'sass-loader'
        ]
      },
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            // use this approach instead of .babelrc; so that we can transpile files
            // from the common-ui which is in an outside directory
            plugins: [
              require('@babel/plugin-transform-runtime'),
              require('@babel/plugin-proposal-class-properties'),
              require('@babel/plugin-syntax-object-rest-spread'),
              require('babel-plugin-syntax-async-functions'),
              require('babel-plugin-transform-inline-environment-variables'),
              require('react-hot-loader/babel')
            ],
            presets: [
              [require('@babel/preset-env'), {modules: 'commonjs'}],
              require('@babel/preset-react')
            ]
          }
        }
      },
      {
        test: /\.svg$/,
        loader: 'raw-loader'
      },
      {
        test: /.(jpg|png)$/,
        use: {
          loader: 'file-loader',
          options: {
            name: './images/[name]-[hash].[ext]'
          }
        }
      }]
    },

    resolve: {
      extensions: ['.webpack-loader.js', '.web-loader.js', '.loader.js', '.js', '.jsx'],
      modules: [
        path.resolve(__dirname, 'node_modules'),
        sourcePath,
        'node_modules'
      ],
      alias: {
        CommonUI: path.resolve(__dirname, '../common-ui/src/'),
        TokenSale: path.resolve(__dirname, '../token-sale-platform/src'),
        Website: path.resolve(__dirname, './src'),
        Media: path.resolve(__dirname, '../../assets/media/'),
        Common: path.resolve(__dirname, '../common'),
        BitcoinUtils: path.resolve(__dirname, '../bitcoin-utils'),
        EthUtils: path.resolve(__dirname, '../eth-utils'),
        Assets: path.resolve(__dirname, '../../assets')
      }
    },

    plugins,

    optimization: {
      splitChunks: {
        cacheGroups: {
          commons: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendor',
            chunks: 'all'
          }
        }
      }
    },

    performance: isProd && {
      maxAssetSize: 100,
      maxEntrypointSize: 300,
      hints: 'warning'
    },

    stats: {
      colors: {
        green: '\u001b[32m'
      },
      errorDetails: true
    }
  };

  if(!isProd) {
    config.devtool = 'source-map';
    config.devServer = {
      https: true,
      contentBase: path.resolve(__dirname, './'),
      allowedHosts: ['.localhost'],
      historyApiFallback: {
        disableDotRule: true,
        rewrites: [{
          from: /./,
          to: context => (
            context.request.headers.host.includes(`admin.localhost:${process.env.PORT}`)
              ? './src/view/admin.html'
              : './src/view/index.html'
          )
        }]
      },
      port: process.env.PORT,
      compress: true,
      hot: true,
      stats: {
        assets: true,
        children: false,
        chunks: false,
        hash: false,
        modules: false,
        publicPath: true,
        timings: true,
        version: false,
        warnings: true,
        colors: {
          green: '\u001b[32m'
        }
      }
    };

    const developmentEntries = [
      `webpack-dev-server/client?http://localhost:${process.env.PORT}`,
      'webpack/hot/only-dev-server'
    ];

    config.entry.app = [...developmentEntries, ...config.entry.app];
  }

  return config;
};
