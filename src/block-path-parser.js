const nodePath = require('path');

class BlockPathParser {
	constructor(path) {
		this.path = path;
		this.pathParts = path.split('/');
		this.pathInfo = nodePath.parse(this.path);
	}

	getInfo() {
		let namespace, blockName;

		if (this._containsOneChunk()) {
			[namespace, blockName] = ['common', this.pathParts[0]];
		} else if (this._containsTwoChunks()) {
			[namespace, blockName] = [this.pathParts[0], this.pathParts[1]];
		} else {
			if (this._isFile()) {
				[namespace, blockName] = this._processFile();
			} else {
				[namespace, blockName] = this._processDirectory();
			}
		}

		return [namespace, blockName];
	}

	_processFile() {
		const fileName = this._getFileNameWithoutExtension();
		if (this._getSecondChunkFromTheEnd() !== fileName) {
			throw new Error('Имя файла должно совпадать с именем блока');
		}
		return [this._getThirdChunkFromTheEnd(), fileName];
	}

	_processDirectory() {
		if (this._getThirdChunkFromTheEnd() !== 'block') {
			throw new Error('В пути не указано block, либо превышен максимальный уровень вложенности.');
		}
		return [this._getSecondChunkFromTheEnd(), this._getLastChunk()];
	}

	_containsOneChunk() {
		return this.pathParts.length === 1;
	}

	_containsTwoChunks() {
		return this.pathParts.length === 2;
	}

	_isFile() {
		return !!this.pathInfo.ext;
	}

	_getFileNameWithoutExtension() {
		return this.pathInfo.name.split('.').shift();
	}

	_getLastChunk() {
		return this.pathParts[this.pathParts.length - 1];
	}

	_getSecondChunkFromTheEnd() {
		return this.pathParts[this.pathParts.length - 2];
	}

	_getThirdChunkFromTheEnd() {
		return this.pathParts[this.pathParts.length - 3];
	}
}

export default BlockPathParser;