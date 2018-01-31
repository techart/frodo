import CliTools from './cli-tools';
import fse from 'fs-extra';
import PackageUpdate from './package-update';
import VersionManager from './version-manager';
import configManager from './config-manager';

const cliTools = new CliTools();
const https = require('https');

class BlankUpdate {
	constructor(dir) {
		this.dir = dir;
		this.changedFiles = [];
		this.packageUpdate = new PackageUpdate(require(this.package));
		this.versionManager = new VersionManager();
		this.configManager = configManager(dir);
	}

	get package() {
		return this.dir + '/package.json';
	}

	get core() {
		return this.configManager.coreFile;
	}

	get tagsRequestOptions() {
		return {
			host: 'api.github.com',
			path: '/repos/techart/frontend-blank/tags',
			headers: {
				"User-Agent": "Techart"
			}
		}
	}


	requestOptions(fileName, tag) {
		return {
			host: 'raw.githubusercontent.com',
			path: `/techart/frontend-blank/${tag}/${fileName}`
		}
	}

	update(version, force, scriptsUpdate) {
		this.packageUpdate.scriptsUpdate = scriptsUpdate;
		if (version) {
			this.versionManager.targetVersion = version;
		}

		this.checkTargetVersion()
			.then(this.checkActual.bind(this))
			.then(isActual => {
				if (!force && isActual) {
					cliTools.buildSuccess('Версия пакета актуальна. Используйте флаг -f для принудительного обновления');
					return;
				}

				this.updateCore()
					.then(this.checkCurrentVersion.bind(this))
					.then(this.updateFiles.bind(this))
					.then(() => {
						cliTools.buildSuccess('Обновление завершено');
						cliTools.exec('npm run pkg');
					})
					.catch(this.onError);
			}).catch(this.onError)
	}

	checkTargetVersion() {
		return this._requestTags().then(data => {
			this.versionManager.tags = data;

			if (!this.versionManager.sameMajor(this.packageUpdate.tag)) {
				return Promise.reject(`Не получится обновиться от одной мажорной версии к мажорной. Для обновления в пределах мажорной версии запустите команду 'frodo update -v ${this.packageUpdate.tag.split('.')[0]}'`);
			}

			if (!this.versionManager.tagExist()) {
				return Promise.reject('Запрошенная версия не найдена');
			}

			return Promise.resolve();
		});
	}

	checkActual() {
		return this.requestFile('package.json').then((data) => {
			this.packageUpdate.packageActual = data;
			return this.packageUpdate.isActual();
		})
	}

	updateCore() {
		return this.requestFile('.blankcore').then((data) => {
			this.configManager.updateCore(data);
		});
	}

	checkCurrentVersion() {
		cliTools.info('Проверка локальных файлов');
		let tag = this.packageUpdate.tag;
		let promises = [];
		this.configManager.filesList().forEach((file) => {
			if (file == 'package.json') {
				promises.push(this.checkPackageJson(file, tag));
			} else {
				promises.push(this.checkFile(file, tag));
			}
		});
		return Promise.all(promises).then(() => {
			if (this.changedFiles.length) {
				cliTools.error('Следующие библиотечные файлы были изменены пользователем (они перемещены в копии с другим именем). Объедините их самостоятельно');
				this.changedFiles.forEach((file) => {
					cliTools.simple(`${file} -> back.${file}`);
				})
			} else {
				cliTools.buildSuccess('С локальными файлами все OK');
			}
		});
	}

	updateFiles() {
		cliTools.info('Обновление');
		let promises = [];
		this.configManager.filesList().forEach((file) => {
			promises.push(this.updateFile(file));
		});

		return Promise.all(promises);
	}

	updateFile(file) {
		return this.requestFile(file).then((remoteContent) => {
			if (file == 'package.json') {
				remoteContent = this.packageUpdate.mergePackages();
			}
			fse.writeFileSync(this.filePath(file), remoteContent);
			cliTools.simple(file + '-> обновлен');
		})
	}

	checkFile(file, tag) {
		return this.requestFile(file, tag).then((remoteContent) => {
			if (!this.isEqual(this.getFileContent(file), remoteContent)) {
				fse.renameSync(this.filePath(file), this.filePath(file, 'back.'));
				this.changedFiles.push(file);
			}
			return;
		})
	}

	checkPackageJson(file, tag) {
		return this.requestFile(file, tag).then((remoteContent) => {
			this.packageUpdate.packageByTag = remoteContent;
			if (!this.isEqual(this.packageUpdate.localDependenciesBuffer(), this.packageUpdate.tagDependenciesBuffer())) {
				fse.renameSync(this.filePath(file), this.filePath(file, 'back.'));
				this.changedFiles.push(file);
			}
			return;
		})
	}

	isEqual(fileContent, content) {
		return fileContent.compare(content) == 0;
	}

	requestFile(file, tag = 'master') {
		if (tag == 'master') {
			tag = tag == this.versionManager.targetVersion ? tag : this.versionManager.targetVersion;
		}

		return this._makeRequest(this.requestOptions(file, tag));
	}

	getFileContent(file) {
		return fse.readFileSync(this.dir + '/' + file);
	}

	filePath(fileName, prefix = '') {
		return `${this.dir}/${prefix}${fileName}`;
	}

	_requestTags() {
		return this._makeRequest(this.tagsRequestOptions);
	}

	_makeRequest(options) {
		return new Promise((resolve, reject) => {
			let request = https.get(options, (response) => {
				if (response.statusCode == 404) {
					reject(new Error(`Не найдено по адресу ${options.host}${options.path}`));
				}
				let data = '';
				response.on('data', (chunk) => data += chunk);
				response.on('end', () => resolve(Buffer.from(data)));
			});

			request.on('error', reject);
		})
	}

	onError(error) {
		cliTools.error('Ошибка обновления: ' + error);
		process.exitCode = 21;
	}
}

export default BlankUpdate;