import fse from 'fs-extra';

class BlockGenerator
{
	constructor(dir) {
		this.dir = dir;
	}

	get blocksDir() {
		return this.dir + '/src/block/';
	}

	create(name, options) {
		let {type, files} = options;
		let blockDir = this.createBlockDir(name, type);
		files.forEach((fileType) => {
			this[`create${this._capitalizeFirst(fileType)}`](blockDir, name);
		});
	}

	createBlockDir(name, type) {
		let path = `${this.blocksDir}${type}/${name}`;
		fse.mkdirpSync(path);
		return path;
	}

	createStyle(blockDir, name) {
		let styleType = require(this.dir +  '/user.settings.js').mainStyleType;
		fse.writeFileSync(this.fileName(blockDir, name, styleType), this._styleContent(name));
	}

	createTemplate(blockDir, name) {
		fse.writeFileSync(this.fileName(blockDir, name, 'html.twig'), this._templateContent(name));
	}

	createJs(blockDir, name) {
		fse.writeFileSync(this.fileName(blockDir, name, 'js'), this._scriptContent(name));
	}

	fileName(blockDir, name, extension) {
		return blockDir + '/' + name + '.' + extension;
	}

	_styleContent(name) {
		let result = [];
		result.push('@import "~style";');
		result.push('');
		result.push(`.${this._withPrefix(name)} {`);
		result.push(`}`);
		result.push('');
		return result.join('\n');
	}

	_templateContent(name) {
		let result = [];
		result.push(`<div class="${this._withPrefix(name)}"></div>`);
		return result.join('\n');
	}

	_scriptContent(name) {
		let result = [];
		result.push('import BEM from "tao-bem";');
		result.push('');
		result.push(`class ${this._capitalizeFirst(name)} extends BEM.Block {`);
		result.push('\tstatic get blockName()');
		result.push('\t{');
		result.push(`\t\treturn '${this._withPrefix(name)}';`);
		result.push('\t}');
		result.push('}');
		return result.join('\n');
	}

	_withPrefix(name) {
		return 'b-'+name;
	}

	_capitalizeFirst(str) {
		return str[0].toUpperCase() + str.substring(1);
	}
}

export default BlockGenerator;

