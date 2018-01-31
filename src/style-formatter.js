import CliTools from './cli-tools';

const cliTools = new CliTools();

class StyleFormatter
{
	constructor(dir) {
		this.dir = dir;
		this.name = 'stylefmt';
	}

	format() {
		if (!this._isScss()) {
			cliTools.error("Ваш проект не поддерживает scss. Format работает только с scss");
		}

		if (this._moduleExists()) {
			cliTools.exec('./node_modules/.bin/stylefmt -c .stylelintrc --recursive=./src/**/*.scss');
		} else {
			cliTools.error(`Пожалуйста. установите "${this.name}" модуль.`);
			cliTools.info(`Запустите "yarn add ${this.name}"`);
		}
	}

	_moduleExists() {
		let packageJson = require(this.dir + '/package.json');
		return packageJson.dependencies[this.name] || packageJson.devDependencies[this.name] || false;
	}

	_isScss() {
		return require(this.dir + '/user.settings.js').mainStyleType == 'scss';
	}
}

export default StyleFormatter;