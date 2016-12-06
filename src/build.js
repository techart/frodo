import fse from 'fs-extra';
import CliTools from './cli-tools';

const cliTools = new CliTools();

class Build {
	static needRebuild() {
		return !(fse.existsSync(Build.sumFile) && !Build.sumChanged());
	}

	static get sumFile() {
		return `assets/sum.${Build.env}.md5`;
	}


	static get md5sum() {
		return cliTools.exec("tar cf - ./ --exclude='./node_modules*' --exclude='./assets*' --exclude='./img/sprite/sprite.png' --exclude='./src/style/_sprite.scss'|md5sum", false);
	}

	static get sum() {
		return fse.readFileSync(Build.sumFile, 'utf8')
	}

	static save() {
		fse.writeFile(Build.sumFile, Build.md5sum);
	}

	static sumChanged() {
		return Build.sum != Build.md5sum.toString();
	}

	static exists(env, dir) {
		let assetPath = `assets/${env}.json`;
		if (fse.existsSync(assetPath)) {
			let asset = JSON.parse(fse.readFileSync(assetPath).toString());
			let docRoot = require(dir +  '/user.settings.js').docRoot;
			if (!fse.existsSync(docRoot + asset.index.js)) {
				Build.noExists = 'noBuild';
				return false;
			}
			return true;
		} else {
			Build.noExists = 'noAssets';
			return false;
		}
	}
}

Build.noExists = '';
Build.env = 'dev';

export default Build;