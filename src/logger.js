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

	get lastChild() {
		return this.jsonStats.children[this.jsonStats.children.length - 1] || {errors: [], warnings: []};
	}

	get errors() {
		return this.jsonStats.errors.concat(this.lastChild.errors);
	}

	getWarnings() {
		let warnings = [];
		this.lastChild.warnings.forEach(function(warning) {
			if (warning != 'undefined' && warnings.indexOf(warning) == -1) {
				warnings.push(warning);
			}
		});
		return warnings.concat(this.jsonStats.warnings);
	}

	logStats(options, isBuild = false) {
		if (this.stats.hasErrors() || this.stats.hasWarnings()) {
			this._logErrors();
			this._logWarnings();
			this._logStats(options, isBuild);
			cliTools.buildError(`${this.buildDate(new Date(this.stats.endTime))} Ошибка сборки`);
		} else {
			this._logWarnings();
			this._logStats(options, isBuild);
			cliTools.buildSuccess(`${this.buildDate(new Date(this.stats.endTime))} Сборка прошла успешно`);
		}
	}

	noNeedRebuild() {
		cliTools.buildSuccess(`${this.buildDate(new Date(Date.now()))} Ничего не изменено, используется старая сборка`);
	}

	noAssets() {
		cliTools.buildError(`${this.buildDate(new Date(Date.now()))} Нет содержимого assets. Принудительная пересборка`);
	}

	noBuild() {
		cliTools.buildError(`${this.buildDate(new Date(Date.now()))} Ничего не изменено, но я не могу найти сборку. Принудительная пересборка`);
	}

	startCompile() {
		cliTools.info('Сборка началась');
	}

	buildProgress(percentage) {
		if (!process.stdout.isTTY) {
			return;
		}

		if (percentage != 100) {
			cliTools.clear();
			cliTools.building(percentage);
		} else {
			cliTools.clear();
		}
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
			cliTools.buildWarning(`Предупреждение \n ${warning} \n`);
		})
	}

	_logErrors() {
		this.errors.forEach((error) => {
			if (error.includes('Ошибка сборки модуля')) {
				return;
			}
			this._formatError(error);
		});
	}

	_logStats(options, isBuild) {
		if (isBuild) {
			process.stdout.write(this.stats.toString(this._formatOutputOptions(options, isBuild)) + '\n');
		}
	}

	_formatError(error) {
		if (error.match(/Module not found: Error: Cannot resolve/i)) {
			this._formatResolveError(error);
			return;
		}

		if (error.match(/\.(scss|sass|css|less)$/)) {
			this._formatStyleError(error);
			return;
		}

		if (error.match(/\.(js)/)) {
			this._formatJsError(error);
		}
	}

	_formatStyleError(error) {
		cliTools.buildError(`Ошибка в ${error}`);
		cliTools.simple('\n');
	}

	_formatJsError(error) {
		let parts = error.split('\n');
		cliTools.buildError(`Ошибка в ${parts.shift()}`);
		cliTools.simple(parts.join('\n'));
	}

	_formatResolveError(error) {
		let parts = error.split('\n');
		cliTools.buildError(`${this._findResolveErrorMessage(parts[1])} in ${this._findResolvedModuleName(parts[0])}`);
		cliTools.simple('\n');
	}

	_findResolvedModuleName(string) {
		if (string.endsWith('.js')) {
			return string;
		}

		if (string.match(/\.(scss|sass|css|less)$/)) {
			return string.match(/\.\/src(.*)\.(scss|sass|css|less)$/)[0];
		}
	}

	_findResolveErrorMessage(string) {
		return string.split('in')[0];
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