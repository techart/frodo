function Frontend(dir) {
    this.dir = dir;
    this._builder = null;
    this._installer = null;
}

Frontend.prototype.check_dir = function() {
    try {
        require('fs').statSync(this.dir + '/user.settings.js');
    } catch(e) {
        throw new Error('Can\'t find settings file [user.settings.js] in current dir.');
    }
};

Frontend.prototype.builder = function() {
    return this._builder ? this._builder : this._builder = new (require('./webpack-builder'))(this.dir);
};

Frontend.prototype.installer = function() {
    return this._installer ? this._installer : this._installer = new (require('./installer'))(this.dir);
};

module.exports = Frontend;