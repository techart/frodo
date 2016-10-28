#!/usr/bin/env node

const webpack = require("webpack");
const cli = require('commander');
const webpackConfig = require('../webpack.config.js');
const compiler = webpack(webpackConfig);

cli.version('0.0.1')
    .option('-w, --watch', 'Watch changes in files')
    .parse(process.argv);


if (cli.watch) {
    compiler.watch({
        aggregateTimeout: 300
    });
} else {
    compiler.run();
}