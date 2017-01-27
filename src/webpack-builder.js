import Logger from './logger';
import Build from './build';

class WebpackBuilder
{
    constructor(dir) {
        this.dir = dir;
        this.logger = new Logger();
        this.webpack = require(this.dir+'/node_modules/webpack');
    }

    setEnv(env = 'dev') {
        process.env.BROWSERSLIST_CONFIG = './.browserslist';
        process.env.NODE_ENV = env;
        Build.env = env;
    }

    build(env, force = false) {
        this.setEnv(env);

        if (!force && !Build.needRebuild() && Build.exists(env ,this.dir)) {
            this.logger.noNeedRebuild();
            return;
        }

        if (Build.noExists) {
            this.logger[Build.noExists]();
        }

        const webpackConfig = this.applyProgressPlugin(require(this.dir +  '/webpack.config.js'), true);
        const compiler = this.webpack(webpackConfig);
        compiler.run((err, stats) => {
            err && process.stderr.write(err);
            this.log(stats, webpackConfig.stats, true);
            if (!stats.hasErrors()) {
                Build.save();
            }
        });
    }

    watch() {
        this.setEnv();
        const webpackConfig = this.applyProgressPlugin(require(this.dir +  '/webpack.config.js'));
        const compiler = this.webpack(webpackConfig);
        compiler.watch({}, (err, stats) => {
            err && process.stderr.write(err);
            this.log(stats, webpackConfig.stats);
        });
    }

    log(stats, options, isBuild = false) {
        let opt = options || {};
        this.logger.setStats(stats);
        this.logger.logStats(opt, isBuild);
    }

    hot() {
        this.setEnv('hot');
        require(this.dir + '/webpack.server.js');
    }

    applyProgressPlugin(config, isBuild = false) {
        let ProgressPlugin = require(this.dir+'/node_modules/webpack/lib/ProgressPlugin');
        config.plugins.push(new ProgressPlugin(isBuild ? this.buildProgressLog.bind(this) : this.watchProgressLog.bind(this)));
        return config;
    }

    watchProgressLog (percent) {
        if (percent == 0) {
            this.logger.startCompile();
        }
    }

    buildProgressLog (percent) {
        this.logger.buildProgress(Math.ceil(percent * 100));
    }
}

export default WebpackBuilder;