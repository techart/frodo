import CliTools from './cli-tools';
import fse from 'fs-extra';
import PackageUpdate from './package-update';
import VersionManager from './version-manager';
import configManager from './config-manager';
import Resource404error from './errors/resource-404-error';

const cliTools = new CliTools();
const https = require('https');

class BlankUpdate {
	constructor(dir) {
		this.dir = dir;
		this.changedFiles = [];
		this.packageUpdate = new PackageUpdate(require(this.package)); //Управление файлом package.json
		this.versionManager = new VersionManager();
		this.configManager = configManager(dir);
	}

	get package() {
		return this.dir + '/package.json';
	}

	get core() {
		return this.configManager.coreFile;
	}

	get tagsRequestOptions() { //Опции для api
		return {
			host: 'api.github.com',
			path: '/repos/techart/frontend-blank/tags',
			headers: {
				'User-Agent': 'Techart',
			},
		};
	}

	requestOptions(fileName, tag) { //Опции для закачки содержимого
		return {
			host: 'raw.githubusercontent.com',
			path: `/techart/frontend-blank/${tag}/${fileName}`,
		};
	}

	update(version, force, scriptsUpdate) {
		this.packageUpdate.scriptsUpdate = scriptsUpdate;
		if (version) {
			this.versionManager.targetVersion = version; //Переключение на явно указанную ветку
		}

		this.checkTargetVersion() // Вычисление необходимой версии исходя из переданных параметров
			.then(this.checkActual.bind(this))
			.then(isActual => {
				if (!force && isActual) {//Защита от обновление на саму себя
					cliTools.buildSuccess('Версия пакета актуальна. Используйте флаг -f для принудительного обновления');
					return;
				}

				this.updateCore() //Обновление только файла конфигов
					.then(this.checkCurrentVersion.bind(this))
					.then(this.updateFiles.bind(this))
					.then(() => {
						cliTools.buildSuccess('Обновление завершено');
						cliTools.exec('npm run pkg');
					})
					.catch(this.onError);
			}).catch(this.onError);
	}

	checkTargetVersion() {
		return this._requestTags().then(data => { //Получение списка версий
			this.versionManager.tags = data;

			if (!this.versionManager.sameMajor(this.packageUpdate.tag)) { //Если явно указныннй (или последний доступный) отличается от текущего мажора
				return Promise.reject(`Не получится обновиться от одной мажорной версии к мажорной. Для обновления в пределах мажорной версии запустите команду 'frodo update -v ${this.packageUpdate.tag.split('.')[0]}'`);
			}

			if (!this.versionManager.tagExist()) { //Проверка наличия устсанавливаемой версии
				return Promise.reject('Запрошенная версия не найдена');
			}

			return Promise.resolve();
		});
	}

	checkActual() { //Проверка на равенство старой и новой версии
		return this.requestFile('package.json').then((data) => {
			this.packageUpdate.packageActual = data; //Получение данных package.json из новой версии
			return this.packageUpdate.isActual();
		});
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
			if (file == 'package.json') { //Проверка наличия изменний и бекап изменений
				promises.push(this.checkPackageJson(file, tag));
			} else {
				promises.push(this.checkFile(file, tag));
			}
		});
		return Promise.all(promises).then(() => {
			if (this.changedFiles.length) {
				cliTools.error('Следующие библиотечные файлы были изменены пользователем. Объедините их самостоятельно и удалите все *.back-файлы');
				this.changedFiles.forEach((file) => {
					cliTools.buildWarning(file);
				});
			} else {
				cliTools.buildSuccess('С локальными файлами все OK');
			}
		});
	}

	updateFiles() {
		cliTools.info('Обновление файлов');
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
			cliTools.simple(`✅ ${file}`);
		});
	}

	checkFile(file, tag) {
		const fileExist = fse.existsSync(this.filePath(file));
		return this.requestFile(file, tag).then((remoteContent) => {
			if (fileExist && !this.isEqual(this.getFileContent(file), remoteContent)) {
				this.backupFile(file, '');
			}
		}).catch(error => {
			if (error.name !== 'resource404') { //Перехватываем только ошибку отсутствия ресурса на удаленном сервере
				throw(error);
			}
			if (fileExist) {
				this.requestFile(file).then((newContent) => {
					if (!this.isEqual(this.getFileContent(file), newContent)) {
						this.backupFile(file, 'Появился в пакете позже текущей версии, но присутствует локально и отличается от новой');
					}
				});
			}
		});
	}

	checkPackageJson(file, tag) {
		return this.requestFile(file, tag).then((remoteContent) => {
			this.packageUpdate.packageByTag = remoteContent;
			if (!this.isEqual(this.packageUpdate.localDependenciesBuffer(), this.packageUpdate.tagDependenciesBuffer())) {
				this.backupFile(file, 'Проект имеет изменённые devDependencies');
			}
		});
	}

	isEqual(fileContent, content) { //Сравнивает объекты типа Buffer
		return fileContent.compare(content) == 0;
	}

	requestFile(file, tag = 'master') { //Запрос файла с ервера
		if (tag == 'master') { //Если не указана версия, то берем из this.versionManager.targetVersion
			tag = tag == this.versionManager.targetVersion ? tag : this.versionManager.targetVersion; //WTF
		}

		return this._makeRequest(this.requestOptions(file, tag));
	}

	getFileContent(file) {
		return fse.readFileSync(this.dir + '/' + file);
	}

	filePath(fileName) {
		return `${this.dir}/${fileName}`;
	}

	_requestTags() {
		return this._makeRequest(this.tagsRequestOptions);
	}

	_makeRequest(options) { //Выполняет запрос к серверу с указанными опциями
		return new Promise((resolve, reject) => {
			let request = https.get(options, (response) => {
				if (response.statusCode == 404) {
					reject(new Resource404error(options.host, options.path));
				}
				let data = ''; //Данные могут приходить по кускам
				response.on('data', (chunk) => data += chunk);
				response.on('end', () => resolve(Buffer.from(data)));
			});

			request.on('error', reject);
		});
	}

	onError(error) {
		cliTools.error('Ошибка обновления: ' + error);
		process.exitCode = 21;
	}

	backupFile(file, reason) {
		const backFile = `${file}.back`;
		const backPath = this.filePath(backFile);
		if (fse.existsSync(backPath)) { //TODO: перенести проверку наличия бекапов до запуска обновления
			throw(`Обнаружены back-файлы от предыдущего запуска обновления (${backFile}), так продожаться больше не может`);
		}
		this.changedFiles.push(`${file} => ${file}.back ${reason}`);
		fse.renameSync(this.filePath(file), backPath); //TODO: делать бекап только после закачки всех новых фафлов
	}
}

export default BlankUpdate;