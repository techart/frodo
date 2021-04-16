import CliTools from './cli-tools';
import path from 'path';
import fse from 'fs-extra';
import childProcess from 'child_process';
import InstallationError from './errors/installation-error';

const cliTools = new CliTools();

class Installer {
	constructor(dir) {
		this.dir = dir;
		this.projectDir = this.guessProjectDir();
		this.siteName = this.guessSiteName();
		this.projectType = this.guessProjectType();
		this.isNeedSudo = this.checkSudo();
	}

	install(type) {
		try {
			this.installGlobal();
			this.clone(type);
			this.installLocal();
			this.writeUserSettings();
			this.writeGitIgnore();
			this.writeWorkspaceConfig();
		} catch (e) {
			throw new InstallationError(e.message, 20);
		}
	}

	guessProjectDir() {
		var parts = this.dir.split(path.sep).filter((n) => n);
		parts.unshift(path.sep);
		var result = '';
		while (!result && parts.length) {
			['.git', '.workspace_config'].forEach((searchItem) => {
				var searchPath = path.join(...parts, searchItem);
				if (fse.existsSync(searchPath)) {
					return result = path.join(...parts);
				}
			});
			parts.pop();
		}
		return result;
	}

	guessSiteName() {
		if (this.projectDir) {
			return path.basename(this.projectDir);
		}
		return '';
	}

	guessProjectType() {
		if (this.projectDir) {
			if (fse.existsSync(path.join(this.projectDir, 'www', 'bitrix'))) {
				return 'bitrix';
			}
			if (fse.existsSync(path.join(this.projectDir, 'work'))) {
				return 'tao3';
			}
			if (fse.existsSync(path.join(this.projectDir, 'tao'))) {
				return 'tao';
			}
			if (fse.existsSync(path.join(this.projectDir, 'lib-cms'))) {
				return 'lib-cms';
			}
		}
		return '';
	}

	checkSudo() {
		var out = childProcess.spawnSync('npm config get prefix', [], {shell: true, encoding: 'utf8'});
		if (out.output) {
			var result = false;
			out.output.forEach((v) => {
				if (v && v.indexOf('home') == -1) {
					result = true;
				}
			});
			return result;
		}
		return true;
	}

	_replaceOptionsInConfig(name, value, txt) {
		var pattern = `(${name}:\\s*(?:\\"|\\'))([^"']+)(\\"|\\')`;
		return txt.replace(new RegExp(pattern, 'g'), `$1${value}$3`);
	}

	_getProjectOptions() {
		var buildPath = '../builds';
		var twigPath = '../twig';
		var docRoot = this.projectDir;
		switch (this.projectType) {
			case 'tao':
				buildPath = '../www/builds';
				docRoot = path.join(docRoot, 'www');
				break;
			case 'tao3':
				buildPath = '../web/builds';
				docRoot = path.join(docRoot, 'web');
				break;
			case 'bitrix':
				docRoot = path.join(docRoot, 'www');
				break;
		}
		return {'buildPath': buildPath, 'twigPath': twigPath, 'docRoot': docRoot};
	}

	writeUserSettings() {
		if (this.siteName && this.projectType) {
			var filePath = path.join(this.dir, 'user.settings.js');
			if (fse.existsSync(filePath)) {
				var result = fse.readFileSync(filePath, 'utf8');

				var {buildPath, docRoot} = this._getProjectOptions();
				docRoot = path.join(path.relative(this.dir, this.projectDir), path.relative(this.projectDir, docRoot));

				// write site
				result = this._replaceOptionsInConfig('site', this.siteName, result);
				// write buildPath
				result = this._replaceOptionsInConfig('buildPath', buildPath, result);
				// write docRoot
				result = this._replaceOptionsInConfig('docRoot', docRoot, result);
				fse.writeFileSync(filePath, result, 'utf8');
			}
		}
	}

	writeGitIgnore() {
		if (this.siteName && this.projectType) {
			var filePath = path.join(this.projectDir, '.gitignore');
			if (fse.existsSync(filePath)) {
				var result = fse.readFileSync(filePath, 'utf8');

				var {buildPath, twigPath} = this._getProjectOptions();
				buildPath = path.relative(this.projectDir, buildPath);
				buildPath = path.join('/', buildPath);
				twigPath = path.relative(this.projectDir, twigPath);
				twigPath = path.join('/', twigPath);
				if (result.indexOf(buildPath) == -1) {
					result += '\n' + buildPath;
					fse.writeFileSync(filePath, result, 'utf8');
				}
				if (result.indexOf(twigPath) == -1) {
					result += '\n' + twigPath;
					fse.writeFileSync(filePath, result, 'utf8');
				}
			}
		}
	}

	writeWorkspaceConfig() {
		if (this.siteName && this.projectType) {
			var filePath = path.join(this.projectDir, '.workspace_config');
			if (fse.existsSync(filePath)) {
				var result = fse.readFileSync(filePath, 'utf8');

				var {buildPath} = this._getProjectOptions();
				buildPath = path.relative(this.projectDir, buildPath);
				buildPath = path.join(buildPath, 'prod');
				var assetsPath = path.join(this.dir, 'assets', 'prod.json');
				assetsPath = path.relative(this.projectDir, assetsPath);
				var thisDir = path.relative(this.projectDir, this.dir);
				var config =
					`
path_to_frontend ${thisDir}
prepare frodo install; frodo build prod
rsync ${buildPath}
rsync ${assetsPath}`;
				if (result.indexOf('frodo ') == -1) {
					result += '\n' + config;
					fse.writeFileSync(filePath, result, 'utf8');
				}
			}
		}
	}

	clone(type) {
		let gitUrl = "https://github.com/techart/frontend-blank5.git";
		if (process.version.startsWith('v8.')) {
			gitUrl = "https://github.com/techart/frontend-blank.git";
		}
		cliTools.exec(`git clone -b ${type} ${gitUrl} frontend`);
		fse.removeSync(`${this.dir}/frontend/.git`);
		process.chdir('frontend');
		this.dir += '/frontend';
		return Promise.resolve();
	}

	installGlobal() {
		var pkgs = {'webpack': 'webpack', 'babel': 'babel-cli'};
		var spawn = childProcess.spawnSync;
		Object.keys(pkgs).forEach((name) => {
			var out = spawn(`which ${name}`, [], {shell: true, encoding: 'utf8'});
			if (out.status != 0) {
				cliTools.exec((this.isNeedSudo ? 'sudo ' : '') + `npm i -g ${pkgs[name]}`);
			}
		});
		return Promise.resolve();
	}

	installLocal() {
		cliTools.exec('npm run pkg');
		return Promise.resolve();
	}
}

export default Installer;