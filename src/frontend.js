import WebpackBuilder from './webpack-builder';
import Installer from './installer';
import BlockGenerator from './block-generator';
import Formatter from './style-formatter';
import PathFinder from './path-finder';
import BlankUpdate from './blank-update';
import fs from 'fs';

class Frontend
{
    constructor(dir) {
        this.dir = dir;
        this._builder = null;
        this._installer = null;
        this._blockGenerator = null;
        this._formatter = null;
        this._pathFinder = null;
        this._blankUpdate = null;
    }

    check_dir() {
        let dir = this.pathFinder().pathToGo();
        if (dir !== this.dir) {
            this.dir = dir;
            process.chdir(this.dir);
        }
    }

    builder(hashType) {
        return this._builder ? this._builder : this._builder = new WebpackBuilder(this.dir, hashType);
    }

    installer() {
        return this._installer ? this._installer : this._installer = new Installer(this.dir);
    }

    blockGenerator() {
        return this._blockGenerator ? this._blockGenerator : this._blockGenerator = new BlockGenerator(this.dir);
    }

    formatter() {
        return this._formatter ? this._formatter : this._formatter = new Formatter(this.dir);
    }

    pathFinder() {
        return this._pathFinder ? this._pathFinder : this._pathFinder = new PathFinder(this.dir);
    }

    blankUpdate() {
        return this._blankUpdate ? this._blankUpdate : this._blankUpdate = new BlankUpdate(this.dir);
    }
}

export default Frontend;