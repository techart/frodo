function Frontend(dir) {
    this.dir = dir;
    this.builder = null;
    try {
        require('fs').statSync(this.dir + '/user.settings.js');
    } catch(e) {
        throw new Error('Can\'t find settings file [user.settings.js] in current dir.');
    }
}

Frontend.prototype.builder = function() {
    return this.builder ? this.builder : this.builder = new (require('./webpack-builder'))(this.dir);
};

module.exports = Frontend;