import fse from 'fs-extra';
import CliTools from './cli-tools';

const cliTools = new CliTools();

class HashControl {
	constructor(env) {
		this.env = env;
	}

	get hashFile() {
		return `assets/sum.${this.env}.md5`;
	}

	get savedHash() {
		return fse.readFileSync(this.hashFile, 'utf8');
	}

	get currentHash() {
		return cliTools.exec('tar cf - --mtime="2017-01-01" --exclude="./node_modules*" --exclude="./assets*" --exclude="./img/sprite/sprite.png" --exclude="./src/style/_sprite.scss" --exclude="*.twig" ./|md5sum', false).toString();
	}

	isChanged() {
		return this.savedHash != this.currentHash;
	}

	save() {
		fse.writeFile(this.hashFile, this.currentHash);
	}
}

class Build {
	constructor(env = 'dev') {
		this.hashControl = new HashControl(env);
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
			let docRoot = require(dir + '/user.settings.js').docRoot;
			if (!fse.existsSync(docRoot + asset[Object.keys(asset)[0]].js)) {
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