function Frontend(dir) {
    this.dir = dir;
    this._builder = null;
    try {
        require('fs').statSync(this.dir + '/user.settings.js');
    } catch(e) {
        throw new Error('Can\'t find settings file [user.settings.js] in current dir.');
    }
}

Frontend.prototype.builder = function() {
    return this._builder ? this._builder : this._builder = new (require('./webpack-builder'))(this.dir);
};

module.exports = Frontend;