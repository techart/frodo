const cliTools = new (require('./cli-tools'));
var fse = require('fs-extra');

function Installer (dir) {
    this.dir = dir;
    this.isNeedSudo = this.checkSudo();
}

Installer.prototype.install = function(type) {
    this.installGlobal();
    this.clone(type);
    this.installLocal();
    // TODO: autofill user.settings
    // TODO: change project .gitignore
    // TODO: change project .workspace_config
};

Installer.prototype.checkSudo = function() {
    var out = require('child_process').spawnSync('npm config get prefix', [], {shell: true, encoding: 'utf8'});
    if (out.output) {
        var result = false;
        out.output.forEach((v) => {
            if (v && v.indexOf('home') != -1) {
                result = true;
            }
        });
        return false;
    }
    return false;
};

Installer.prototype.clone = function(type) {
    var branch = type == 'sass' ? type : 'master';
    cliTools.exec(`git clone -b ${branch} git@gitlab.s.intranet:core/frontend-blank.git frontend`);
    fse.removeSync(`${this.dir}/frontend/.git`);
    process.chdir('frontend');
    this.dir += '/frontend';
    return Promise.resolve();
};

Installer.prototype.installGlobal = function() {
    var pkgs = {'bower': 'bower', 'webpack' : 'webpack', 'babel' : 'babel-cli'};
    var spawn = require('child_process').spawnSync;
    Object.keys(pkgs).forEach((name) => {
        var out = spawn(`which ${name}`, [], {shell: true, encoding: 'utf8'});
        if (out.status != 0) {
            cliTools.exec((this.isNeedSudo ? 'sudo ' : '') + `npm i -g ${pkgs[name]}`);
        }
    });
    return Promise.resolve();
};

Installer.prototype.installLocal = function() {
    cliTools.exec('npm i && bower install');
    return Promise.resolve();
};

module.exports = Installer;