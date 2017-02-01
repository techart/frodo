import WebpackBuilder from './webpack-builder';
import Installer from './installer';
import BlockGenerator from './block-generator';
import Formatter from './style-formatter';
import fs from 'fs';

class Frontend
{
    constructor(dir) {
        this.dir = dir;
        this._builder = null;
        this._installer = null;
        this._blockGenerator = null;
        this._formatter = null;
    }

    check_dir() {
        try {
            fs.statSync(this.dir + '/user.settings.js');
        } catch(e) {
            throw new Error('Can\'t find settings file [user.settings.js] in current dir.');
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
}

export default Frontend;