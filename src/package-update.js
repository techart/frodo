class PackageUpdate
{
	constructor(packageLocal) {
		this._packageLocal = packageLocal;
		this._packageByTag = null;
		this._packageActual = null;
		this.scriptsUpdate = false;
		this._defaultProps = ['version', 'devDependencies'];
	}

	get tag() {
		return this._packageLocal.version;
	}

	isActual() {
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