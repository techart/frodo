import WebpackBuilder from './webpack-builder';
import Installer from './installer';
import fs from 'fs';

class Frontend
{
    constructor(dir) {
        this.dir = dir;
        this._builder = null;
        this._installer = null;
    }

    check_dir() {
        try {
            fs.statSync(this.dir + '/user.settings.js');
        } catch(e) {
            throw new Error('Can\'t find settings file [user.settings.js] in current dir.');
        }
    }

    builder() {
        return this._builder ? this._builder : this._builder = new WebpackBuilder(this.dir);
    }

    installer() {
        return this._installer ? this._installer : this._installer = new Installer(this.dir);
    }
}

export default Frontend;