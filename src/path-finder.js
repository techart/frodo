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
			throw new PathFinderError("I'm lost. I don't know where i'am and there is no one who can tell me a path");
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
		let configPath = file.toString().match(/^(path_to_frontend|path_to_mordor)(.*)$/im)[2];
		try {
			return fs.realpathSync(path + '/' + configPath.trim());
		} catch (e) {
			throw new PathFinderError('You told me wrong path (shit in config)');
		}
	}
}

export default PathFinder;
