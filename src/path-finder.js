import fs from 'fs';
import CliTools from './cli-tools';
import PathFinderError from './errors/path-finder-error';

const cliTools = new CliTools();

class PathFinder
{
	constructor(dir) {
		this.dir = dir
	}

	pathToGo() {
		let pathToGo = this.findPath();
		if (this.isFrontendDir(pathToGo)) {
			return pathToGo;
		}

		if (this.isProjectDir(pathToGo)) {
			return this.pathFromConfig(pathToGo);
		}

		return this.dir;
	}

	userSettings(dir) {
		return `${dir}/user.settings.js`;
	}

	workspaceConfig(dir) {
		return `${dir}/.workspace_config`;
	}

	isFrontendDir(dir) {
		return fs.existsSync(this.userSettings(dir));
	}

	isProjectDir(dir) {
		return fs.existsSync(this.workspaceConfig(dir));
	}

	findPath(dir) {
		if (dir === '') {
			throw new PathFinderError("Я потерялся. Не знаю, где я. Вокруг никого, кто может подсказать мне путь ", 10);
		}

		dir = dir || this.dir;

		if (this.isFrontendDir(dir) || this.isProjectDir(dir)) {
			return dir;
		}

		return this.findPath(this.stepBack(dir));
	}

	stepBack(dir) {
		return dir.slice(0, dir.lastIndexOf('/'));
	}

	pathFromConfig(path) {
		let file  = fs.readFileSync(this.workspaceConfig(path));
		let matchResult = file.toString().match(/^(path_to_frontend|path_to_mordor)(.*)$/im);
		let configPath;
		if (matchResult) {
			configPath = matchResult[2].trim();
		}
		try {
			return fs.realpathSync(path + '/' + configPath);
		} catch (e) {
			throw new PathFinderError('Ты указал мне неверный путь. (Ошибка в config)', 11);
		}
	}
}

export default PathFinder;
