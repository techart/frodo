import CliTools from './cli-tools';

const cliTools = new CliTools();

class Logger
{
	constructor() {
		this.stats = null;
		this.jsonStats = null;
	}

	setStats(stats) {
		this.stats = stats;
		this.jsonStats = stats.toJson();
	}

	get errors() {
		return this.jsonStats.errors;
	}

	getWarnings() {
		let warnings = [];
		this.jsonStats.children.pop().warnings.forEach(function(warning) {
			if (warning != 'undefined' && warnings.indexOf(warning) == -1) {
				warnings.push(warning);
			}
		});
		return warnings;
	}

	logStats(options, isBuild = false) {
		if (this.stats.hasErrors()) {
			this._logErrors();
			this._logWarnings();
			process.stdout.write(this.stats.toString(this._formatOutputOptions(options, isBuild)) + '\n');
			cliTools.buildError(`${this.buildDate(new Date(this.stats.endTime))} Build failed`);
		} else {
			this._logWarnings();
			cliTools.buildSuccess(`${this.buildDate(new Date(this.stats.endTime))} Build successful`);
		}
	}

	noNeedRebuild() {
		cliTools.buildSuccess(`${this.buildDate(new Date(Date.now()))} Nothing changed, using old build`);
	}

	noAssets() {
		cliTools.buildError(`${this.buildDate(new Date(Date.now()))} There is no assets. Forcing rebuild`);
	}

	noBuild() {
		cliTools.buildError(`${this.buildDate(new Date(Date.now()))} Nothing changed, but I didn't find build. Forcing rebuild`);
	}

	buildDate(date) {
		return `${date.getHours()}:${this._timeLeadZero(date.getMinutes())}:${this._timeLeadZero(date.getSeconds())}`
	}

	_timeLeadZero(time) {
		return `0${time}`.substr(-2);
	}

	_logWarnings() {
		let warnings = this.getWarnings();
		warnings.forEach((warning) => {
			cliTools.buildWarning(`Warning \n ${warning} \n`);
		})
	}

	_logErrors() {
		this.errors.forEach((error) => {
			if (error.includes('Module build failed')) {
				return;
			}

			if (error.endsWith('.scss') || error.endsWith('.less')) {
				this._formatStyleError(error);
			} else {
				this._formatJsError(error);
			}
		});
	}

	_formatStyleError(error) {
		cliTools.buildError(`Error in ${error}`);
		cliTools.simple('\n');
	}

	_formatJsError(error) {
		let parts = error.split('\n');
		cliTools.buildError(`Error in ${parts.shift()}`);
		cliTools.simple(parts.join('\n'));
	}

	_formatOutputOptions(options, isBuild) {
		options.children = false;
		options.warnings = false;
		options.errors = false;

		if (isBuild) {
			options.assets = true;
		}

		return options;
	}
}

export default Logger;