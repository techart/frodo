import fse from 'fs-extra';
import CliTools from './cli-tools';

const cliTools = new CliTools();

const HASH_TYPES = {'GIT': 1, 'MD5': 2};

class HashControl {
	constructor(type, env) {
		this.type = HASH_TYPES[type];
		this.env = env;
	}

	get hashFile() {
		if (this.type == HASH_TYPES.GIT) {
			return `assets/hash.${this.env}.txt`;
		}

		return `assets/sum.${this.env}.md5`;
	}

	get savedHash() {
		return fse.readFileSync(this.hashFile, 'utf8')
	}

	get currentHash() {
		if (this.type == HASH_TYPES.GIT) {
			return cliTools.exec("cd ../;git ls-tree -d HEAD frontend", false).toString().split(' ').pop().split('\t').shift();
		}

		return cliTools.exec("tar cf - ./ --exclude='./node_modules*' --exclude='./assets*' --exclude='./img/sprite/sprite.png' --exclude='./src/style/_sprite.scss'|md5sum", false).toString();
	}

	isChanged() {
		return this.savedHash != this.currentHash;
	}

	save() {
		let type = this.type;
		Object.keys(HASH_TYPES).map((key) => {
			this.type = HASH_TYPES[key];
			fse.writeFile(this.hashFile, this.currentHash);
		});

		this.type = type;
	}
}

class Build {
	constructor(hashType, env = 'dev') {
		this.hashControl = new HashControl(hashType, env);
		this.existStatus = '';
	}

	set env(env) {
		this.hashControl.env = env;
	}

	needRebuild() {
		return !(fse.existsSync(this.hashControl.hashFile) && !this.hashControl.isChanged());
	}

	exists(env, dir) {
		let assetPath = `assets/${env}.json`;
		if (fse.existsSync(assetPath)) {
			let asset = JSON.parse(fse.readFileSync(assetPath).toString());
			let docRoot = require(dir +  '/user.settings.js').docRoot;
			if (!fse.existsSync(docRoot + asset.index.js)) {
				this.existStatus = 'noBuild';
				return false;
			}
			return true;
		} else {
			this.existStatus = 'noAssets';
			return false;
		}
	}

	save() {
		this.hashControl.save();
	}
}

export default Build;