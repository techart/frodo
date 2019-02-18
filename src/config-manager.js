import fse from 'fs-extra';

class ConfigManager {
	constructor(dir) {
		this.dir = dir;
		this._data = null;
	}

	get coreFile() {
		return this.dir + '/.blankcore';
	}

	get data() {
		if (!fse.existsSync(this.coreFile)) {
			this._data = {files: [], directives: {}};
		}
		if (!this._data) {
			this._parseData(fse.readFileSync(this.coreFile));
		}

		return this._data;
	}

	set files(files) {
		let data = this._data || {};
		data.files = files.split('\n').filter((file) => {
			return file;
		});
		data.files.splice(data.files.indexOf('.blankcore'), 1);
		this._data = data;
	}

	set directives(directives) {
		let data = this._data || {};
		data.directives = {};

		if (!directives) {
			this._data = data;
			return;
		}

		directives.split('\n').filter((line) => {
			return line;
		}).forEach((directive) => {
			let [name, value] = directive.split('=');
			data.directives[name.trim()] = value.trim();
		});

		this._data = data;
	}

	filesList() {
		return this.data.files;
	}

	updateCore(data) { //Сохранение закаченного файла конфига в локальный
		this._parseData(data);
		fse.writeFileSync(this.coreFile, data);
	}

	_parseData(data) {
		let parts = data.toString().split('-directives');
		this.files = parts[0];
		this.directives = parts[1];
	}

	directive(name) {
		return this.data.directives[name];
	}
}

let instance;

function configManager(dir) {
	if (!instance) {
		instance = new ConfigManager(dir);
	}
	return instance;
}

export default configManager;