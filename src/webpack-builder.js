import Logger from './logger';
import Build from './build';
import BuildError from './errors/build-error';
import configManager from './config-manager';
import CliTools from './cli-tools';

const cliTools = new CliTools();

class WebpackBuilder {
	constructor(dir) {
		this.dir = dir;
		this.logger = new Logger();
		if (process.version.startsWith('v8.')) {
			this.webpack = require(this.dir + '/node_modules/webpack');
		} else {
			this.webpack = require('/usr/local/lib/node_modules/webpack');
		}
		this.buildObj = new Build();
		this.configManager = configManager(dir);
	}

	setEnv(env = 'dev') {
		if (!parseInt(this.configManager.directive('no_browser_list'))) {
			process.env.BROWSERSLIST_CONFIG = './.browserslist';
		}
		process.env.NODE_ENV = env;
		this.buildObj.env = env;
	}

	build(env, force = false) {
		this.setEnv(env);

		if (!force && !this.buildObj.needRebuild() && this.buildObj.exists(env, this.dir)) {
			this.logger.noNeedRebuild();
			return;
		}

		if (this.buildObj.existStatus) {
			this.logger[this.buildObj.existStatus]();
		}

		try {
			const webpackConfig = this.applyProgressPlugin(require(this.dir + '/webpack.config.js'), true);
			const compiler = this.webpack(webpackConfig);
			compiler.run((err, stats) => {
				//err && process.stderr.write(err);
				this.log(stats, webpackConfig.stats, true);
				if (!stats.hasErrors()) {
					this.buildObj.save();
				} else {
					process.exitCode = 30;
				}
			});
		} catch (e) {
			throw new BuildError(e.message, 31);
		}
	}

	watch() {
		this.setEnv();
		const webpackConfig = this.applyProgressPlugin(require(this.dir + '/webpack.config.js'));
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
		if (process.version.startsWith('v8.')) {
			require(this.dir + '/webpack.server.js');
		} else {
			cliTools.exec('npm run start');
		}
	}

	applyProgressPlugin(config, isBuild = false) {
		let modulesDir = process.version.startsWith('v8.') ? this.dir : '/usr/local/lib';
		let ProgressPlugin = require(modulesDir + '/node_modules/webpack/lib/ProgressPlugin');
		config.plugins.push(new ProgressPlugin(isBuild ? this.buildProgressLog.bind(this) : this.watchProgressLog.bind(this)));
		return config;
	}

	watchProgressLog(percent) {
		if (percent == 0) {
			this.logger.startCompile();
		}
	}

	buildProgressLog(percent) {
		this.logger.buildProgress(Math.ceil(percent * 100));
	}
}

export default WebpackBuilder;