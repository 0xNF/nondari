const webpackConfig = require('./webpack.config.js');
webpackConfig.mode = 'production';

module.exports = function(config) {
  config.set({
    browserNoActivityTimeout: 50000,
    browserDisconnectTolerance: 2,
    singleRun: true,
    
    browsers: [
      'PhantomJS'
    ],

    frameworks: [
      'jasmine'
    ],

    files: [
      'spec.bundle.js'
    ],

    preprocessors: {
      'spec.bundle.js': ['webpack']
    },

    webpack: webpackConfig,

    webpackMiddleware: {
      stats: 'errors-only'
    },

    plugins: [
      require('karma-jasmine'),
      require('karma-phantomjs-launcher'),
      require('karma-webpack')
    ]
  });
};