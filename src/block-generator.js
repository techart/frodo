import fse from 'fs-extra';
import CliTools from './cli-tools';

const cliTools = new CliTools();

class BlockGenerator
{
	constructor(dir) {
		this.dir = dir;
	}

	get blocksDir() {
		return this.dir + '/src/block/';
	}

	create(name, options) {
		let {namespace, files, force} = options;
		let blockDir = this.createBlockDir(name, namespace);

		Object.keys(files).forEach((fileType) => {
			if (files[fileType]) {
				this.createFile(blockDir, name, force, fileType, namespace);
			}
		});
	}

	createBlockDir(name, namespace) {
		let namespaceDir = `${this.blocksDir}${namespace}`;
		let path = `${namespaceDir}/${name}`;

		if (!fse.existsSync(namespaceDir)) {
			fse.mkdirpSync(namespaceDir);
			fse.writeFileSync(this.fullFilePath(namespaceDir, this.fileName(namespace, 'js')), this._contextFile());
		}

		fse.mkdirpSync(path);
		return path;
	}

	canCreateFile(path, force, file, name, namespace) {
		if (!force && fse.existsSync(path)) {
			cliTools.error(`Не удается создать ${namespace}/${name}/${file}. Уже существует. Для принудительного создания используйте флаг -f. Я надеюсь, ты осознаешь, что делаешь`);
			return false;
		}

		return true;
	}

	createFile(blockDir, name, force, fileType, namespace) {
		let type = this.type(fileType);
		let fileName = this.fileName(name, type);
		let path = this.fullFilePath(blockDir, fileName);
		if (this.canCreateFile(path, force, fileName, name, namespace)) {
			fse.writeFileSync(path, this.content(fileType, name));
			cliTools.buildSuccess(`Create ${namespace}/${name}/${fileName}`);
		}
	}

	type(fileType) {
		switch (fileType) {
			case 'style':
				return this.styleType();
			case 'template':
				return this.templateType() == 'blade' ? 'blade.php' : 'twig.html';
			default:
				return fileType;
		}
	}

	content(fileType, name) {
		return this["_"+fileType+"Content"](name);
	}

	fullFilePath(blockDir, fileName) {
		return blockDir + '/' + fileName;
	}

	fileName(name, extension) {
		return name + '.' + extension;
	}

	mainStyleType() {
		return require(this.dir +  '/user.settings.js').mainStyleType;
	}

	styleType() {
		return this.mainStyleType() ? this.mainStyleType() : 'scss';
	}

	mainTemplateType() {
		return require(this.dir +  '/user.settings.js').mainTemplateType;
	}

	templateType() {
		return this.mainTemplateType() ? this.mainTemplateType() : 'twig';
	}

	_styleContent(name) {
		let result = [];
		result.push('@import "~style";');
		result.push('');
		result.push(`$block-name: '${this._withPrefix(name)}';`);
		result.push('');
		result.push(`.#{$block-name} {`);
		result.push('\t//');
		result.push(`}`);
		result.push('');
		return result.join('\n');
	}

	_templateContent(name) {
		let result = [];
		if (this.templateType() == 'blade') {
			result.push(`<div class="{{ $block }}"></div>`);
		} else {
			result.push(`<div class="{{ block }}"></div>`);
		}
		return result.join('\n');
	}

	_jsContent(name) {
		let result = [];
		let className = this._toCamelCase(name);
		result.push('import BEM from "tao-bem";');
		result.push('');
		result.push(`class ${className} extends BEM.Block {`);
		result.push('\tstatic get blockName() {');
		result.push(`\t\treturn '${this._withPrefix(name)}';`);
		result.push('\t}');
		result.push('}');
		result.push('');
		result.push(`${className}.register();`);
		result.push('');
		result.push(`export default ${className};`);
		return result.join('\n');
	}

	_contextFile() {
		let result = [];
		result.push('function requireAll(r) {');
		result.push('\tr.keys().map(r);');
		result.push('}');
		result.push('');
		result.push("requireAll(require.context('.', true, " + /^\.\/[^/]+\/[^/.]+\.(js|css|scss|sass|less)$/.toString()+ "));");
		return result.join('\n');
	}

	_withPrefix(name) {
		return 'b-'+name;
	}

	_capitalizeFirst(str) {
		return str[0].toUpperCase() + str.substring(1);
	}

	_toCamelCase(str) {
		let result = str.split('-').map((part) => {
			return this._capitalizeFirst(part);
		});

		return result.join('');
	}
}

export default BlockGenerator;

