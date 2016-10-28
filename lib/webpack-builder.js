function WebpackBuilder (dir) {
    this.dir = dir;
}

WebpackBuilder.prototype.build = function(env) {
    process.env.NODE_ENV = env;
    const webpack = require("webpack");
    const webpackConfig = require(this.dir + '/webpack.config.js');
    const compiler = webpack(webpackConfig);
    compiler.run(function(err, stats) {
        err && process.stderr.write(err);
        stats && process.stdout.write(stats.toString(webpackConfig.stats));
    });
};

WebpackBuilder.prototype.watch = function() {
    process.env.NODE_ENV = 'dev';
    const webpack = require("webpack");
    const webpackConfig = require(this.dir +  '/webpack.config.js');
    const compiler = webpack(webpackConfig);
    compiler.watch({}, function(err, stats) {
        err && process.stderr.write(err);
        stats && process.stdout.write(stats.toString(webpackConfig.stats));
    });
};

WebpackBuilder.prototype.hot = function() {
    require(this.dir + '/webpack.server.js');
};

module.exports = WebpackBuilder;