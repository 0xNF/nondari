const path = require('path');
const webpack = require('webpack');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

const ROOT = path.resolve( __dirname, 'src' );
const DESTINATION = path.resolve( __dirname, 'dist' );

module.exports = {
    context: ROOT,

    entry: {
        'main': './main.ts',
    },

    plugins: [
        new CleanWebpackPlugin(['dist']),
        new CopyPlugin([
            { from: 'css/', to: 'css/' },
            { from: 'img/', to: 'img/' },
            { from: 'json/', to: 'json/'},
            { from: 'js/', to: 'js/'},
          ]),
        new HtmlWebpackPlugin({
            filename: 'index.html',
            template: 'html/pages/index.html',
          }),
          new HtmlWebpackPlugin({
            filename: 'builder.html',
            template: 'html/pages/builder.html',
          }),
          new HtmlWebpackPlugin({
            filename: 'about.html',
            template: 'html/pages/about.html'
          }),
          new HtmlWebpackPlugin({
            filename: 'custom.html',
            template: 'html/pages/custom.html'
          }),
          new HtmlWebpackPlugin({
            filename: 'drinks.html',
            template: 'html/pages/drinks.html'
          }),
          new HtmlWebpackPlugin({
            filename: 'ingredient.html',
            template: 'html/pages/ingredient.html'
          }),
          new HtmlWebpackPlugin({
            filename: 'pantry.html',
            template: 'html/pages/pantry.html'
          }),
    ],

    output: {
        filename: '[name].bundle.js',
        path: DESTINATION,
        library: 'nondari'
    },

    resolve: {
        extensions: ['.ts', '.js'],
        modules: [
            ROOT,
            'node_modules'
        ]
    },

    module: {
        rules: [
            /****************
            * PRE-LOADERS
            *****************/
            {
                enforce: 'pre',
                test: /\.js$/,
                use: 'source-map-loader'
            },
            {
                enforce: 'pre',
                test: /\.ts$/,
                exclude: /node_modules/,
                use: 'tslint-loader'
            },

            /****************
            * LOADERS
            *****************/
            {
                test: /\.ts$/,
                exclude: [ /node_modules/ ],
                use: 'awesome-typescript-loader'
            },
        ]
    },

    devtool: 'cheap-module-source-map',
    devServer: {}
};

