var path = require('path');
var webpack = require('webpack');
var filename = 'level-selector.js'

module.exports = {
  entry: path.resolve(__dirname, 'index.js'),
  externals: {
    "Clappr": "Clappr",
    "clappr-zepto": "clappr-zepto"
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        loader: 'babel',
        query: {
            compact: false,
        }
      },
      {
        test: /\.scss$/,
        loaders: ['css', 'sass?includePaths[]='
          + path.resolve(__dirname, './node_modules/compass-mixins/lib')
          + '&includePaths[]='
          + path.resolve(__dirname, './node_modules/clappr/src/base/scss')
          + '&includePaths[]='
          + path.resolve(__dirname, './src/base/scss')
        ],
        include: path.resolve(__dirname, 'src'),
      },
      {
        test: /\.html/, loader: 'html?minimize=false'
      },
    ],
  },
  resolve: {
    extensions: ['', '.js'],
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    publicPath: '<%=baseUrl%>/',
    filename: filename,
    library: 'LevelSelector',
    libraryTarget: 'umd',
  },
};
