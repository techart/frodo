import webpack from 'webpack';

class WebpackBuilder
{
    constructor(dir) {
        this.dir = dir;
    }

    build(env) {
        const webpackConfig = require(this.dir +  '/webpack.config.js');
        process.env.BROWSERSLIST_CONFIG = './.browserslist';
        const compiler = webpack(webpackConfig);
        process.env.NODE_ENV = env;
        compiler.run(function(err, stats) {
            err && process.stderr.write(err);
            stats && process.stdout.write(stats.toString(webpackConfig.stats));
        });
    }

    watch() {
        const webpackConfig = require(this.dir +  '/webpack.config.js');
        const compiler = webpack(webpackConfig);
        process.env.BROWSERSLIST_CONFIG = './.browserslist';
        process.env.NODE_ENV = 'dev';
        compiler.watch({}, function(err, stats) {
            err && process.stderr.write(err);
            stats && process.stdout.write(stats.toString(webpackConfig.stats));
        });
    }

    hot() {
        process.env.BROWSERSLIST_CONFIG = './.browserslist';
        require(this.dir + '/webpack.server.js');
    }
}

export default WebpackBuilder;