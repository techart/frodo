class PackageUpdate
{
	constructor(packageLocal) {
		this._packageLocal = packageLocal; //Содержимое текущего файла
		this._packageByTag = null; //Содержимое текущего файла на github
		this._packageActual = null;
		this.scriptsUpdate = false; //Флаг, указывающий на необходимость обновлять список скриптов
		this._defaultProps = ['version', 'devDependencies'];
	}

	get tag() { //Номер текущей версии
		return this._packageLocal.version;
	}

	isActual() { //Проверка равенства версий с которой обновляемся и на какую
		return this._packageLocal.version == this._packageActual.version;
	}

	set packageByTag(content) {
		this._packageByTag = JSON.parse(content);
	}

	set packageActual(content) {
		this._packageActual = JSON.parse(content);
	}

	localDependenciesBuffer() {
		return this._objectToBuffer(this._packageLocal.devDependencies);
	}
	tagDependenciesBuffer() {
		return this._objectToBuffer(this._packageByTag.devDependencies);
	}

	mergePackages() {
		let result = this._packageLocal;
		this._propsToUpdate().forEach((prop) => {
			result[prop] = this._packageActual[prop];
		});

		return JSON.stringify(result, null, 2) + '\n';
	}

	_objectToBuffer(obj) {
		return Buffer.from(JSON.stringify(obj));
	}

	_propsToUpdate() {
		if (this.scriptsUpdate) {
			this._defaultProps.push('scripts');
		}
		return this._defaultProps;
	}
}

export default PackageUpdate;