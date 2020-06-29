#!/usr/bin/env node

const cliTools = new (require('../lib/cli-tools').default);
const version = require('../package.json').version;
var frontend;
var PathFinderError = require('../lib/errors/path-finder-error').default;
var InstallationError = require('../lib/errors/installation-error').default;
var BuildError = require('../lib/errors/build-error').default;
const BlockPathParser = require('../lib/block-path-parser').default;

try {

	frontend = new (require('../lib/frontend').default)(process.cwd());

	const cli = require('commander');
	cli.version(version);

	cli.command('build [env]')
		.description('Запускает сборку frontend для указанного окружения (по умолчанию dev)')
		.option('-f, --force', 'Принудительный запуск сборки (без учета хеша)')
		.option('-h, --hash <type>', 'Устарел. В дальнейшем будет удален')
		.action(function (env, options) {
			var force = options.force || false;
			frontend.check_dir();
			env = env || 'dev';

			if (options.hash) {
				cliTools.buildWarning('Выбор типа хэша. Устарел, теперь используется только md5. Флаг -h будет удален');
			}

			cliTools.info('Запущена сборка frontend для окружения (env): ' + cliTools.chalk.bold(env));
			frontend.builder().build(env, force);
		});

	cli.command('watch')
		.description('Запускает dev-окружение и начинает отслеживать изменения файлов')
		.action(function () {
			frontend.check_dir();
			cliTools.info('Запущено отслеживание изменений скриптов и стилей');
			frontend.builder().watch();
		});

	cli.command('hot')
		.description('Запускает hot-режим')
		.action(function () {
			frontend.check_dir();
			cliTools.info('Запущена сборка в режиме hot');
			frontend.builder().hot();
		});

	cli.command('install [type]')
		.description('Устанавливает дополнительные модули')
		.action(function (type) {
			var commands = {
				main: 'sudo npm i -g webpack babel-cli',
				local: 'npm run pkg',
			};
			var cmd = type ? commands[type] : commands.local;
			if (!cmd) {
				throw new Error('Неизвестный тип установки');
			}

			cmd == commands.local && frontend.check_dir();
			cliTools.exec(cmd);
		});

	cli.command('init [type]')
		.description('Устанавливает frontend')
		.action(function (type) {
			type = type || 'master';

			if (type == 'sass' || type == 'scss') {
				type = 'master';
			}

			switch (type) {
				case 'beta':
				case 'webgl':
				case 'master':
					frontend.installer().install(type);
					break;
				default:
					throw new Error('неизвестный аргумент [' + cliTools.chalk.inverse(type) + ']');
			}
		});
	cli.command('create <block> <name>')
		.description('Создает модуль, пока поддерживается только создание модулей типа "block"')
		.option('-s, --add-style', 'Добавляет файл стилей')
		.option('-j, --add-js', 'Добавляет js-скрипт')
		.option('-t, --add-template', 'Добавляет шаблон')
		.option('-S, --no-style', 'Не добавляет файл стилей')
		.option('-J, --no-js', 'Не добавляет js-скрипт')
		.option('-T, --no-template', 'Не добавляет шаблон')
		.option('-f, --force', 'Принудительное добавление (перезапись файлов)')
		.action(function (block, name, options) {
			frontend.check_dir();

			if (block != 'block') {
				throw new Error('Должно присутствовать слово - block');
			}

			let [namespace, blockName] = new BlockPathParser(name).getInfo();

			frontend.blockGenerator().create(blockName, {
				namespace,
				files: {
					style: options.addStyle || options.style || false,
					template: options.addTemplate || options.template || false,
					js: options.addJs || false,
				},
				force: options.force || false,
			});
		});

	cli.command('format')
		.description('Формирует scss-файлы проекта')
		.action(function () {
			frontend.check_dir();
			frontend.formatter().format();

		});
	cli.command('path_to_frontend')
		.alias('path_to_mordor')
		.description('Выводит путь к папке frontend')
		.action(function () {
			var dir = frontend.pathFinder().pathToGo();
			if (dir != process.cwd()) {
				cliTools.info(dir);
			} else {
				cliTools.info('Я уже здесь');
			}
		});

	cli.command('update')
		.description('Обновляет tao-webpack')
		.option('-f, --force', 'Принудительное обновление')
		.option('-s, --scripts-upd', 'Обновление scripts в package.json')
		.option('-v, --version-number <number>', 'Обновление tao-webpack до указанной версии')
		.action(function (option) {
			var force = option.force || false;
			var scriptsUpdate = option.scriptsUpd || false;
			var versionNumber = option.versionNumber || '';
			frontend.check_dir();
			frontend.blankUpdate().update(versionNumber, force, scriptsUpdate);
		});

	cli.command('clean')
		.description('Удаляет папку node_modules')
		.action(function () {
			frontend.check_dir();
			cliTools.exec('rm -rf node_modules');
		});

	cli.parse(process.argv);

	if (!cli.args.length) {
		cli.help();
	}

} catch (e) {
	if (e instanceof PathFinderError) {
		cliTools.error('Не удается найти папку frontend. ' + e.message);
	} else if (e instanceof InstallationError) {
		cliTools.error('С установкой frontend что-то пошло не так: ' + e.message);
	} else if (e instanceof BuildError) {
		e.errorCode == 31 && cliTools.error('С запуском сборки что-то пошло не так: ' + e.message);
	} else {
		cliTools.error('Что-то пошло не так: ' + e.message);
	}

	process.exitCode = e.errorCode || 1;
}
