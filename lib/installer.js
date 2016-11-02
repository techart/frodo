const cliTools = new (require('./cli-tools'));
const path = require('path');
const fse = require('fs-extra');

function Installer (dir) {
    this.dir = dir;
    this.projectDir = this.guessProjectDir();
    this.siteName = this.guessSiteName();
    this.projectType = this.guessProjectType();
    this.isNeedSudo = this.checkSudo();
}

Installer.prototype.install = function(type) {
    this.installGlobal();
    this.clone(type);
    this.installLocal();
    this.writeUserSettings();
    this.writeGitIgnore();
    this.writeWorkspaceConfig();
};

Installer.prototype.guessProjectDir = function() {
    var parts = this.dir.split(path.sep).filter((n) => n);
    parts.unshift(path.sep);
    var result = '';
    while(!result && parts.length) {
        ['.git', '.workspace_config'].forEach((searchItem) => {
            var searchPath = path.join(...parts, searchItem);
            if (fse.existsSync(searchPath)) {
                return result = path.join(...parts);
            }
        });
        parts.pop();
    }
    return result;
};

Installer.prototype.guessSiteName = function() {
    if (this.projectDir) {
        return path.basename(this.projectDir);
    }
    return '';
};

Installer.prototype.guessProjectType = function() {
    if (this.projectDir) {
        if (fse.existsSync(path.join(this.projectDir, 'www', 'bitrix'))) {
            return 'bitrix';
        }
        if (fse.existsSync(path.join(this.projectDir, 'work'))) {
            return 'tao3';
        }
        if (fse.existsSync(path.join(this.projectDir, 'tao'))) {
            return 'tao';
        }
        if (fse.existsSync(path.join(this.projectDir, 'lib-cms'))) {
            return 'lib-cms';
        }
    }
    return '';
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

Installer.prototype._replaceOptionsInConfig = function (name, value, txt) {
    var pattern = `(${name}:\\s*(?:\\"|\\'))([^"']+)(\\"|\\')`;
    return txt.replace(new RegExp(pattern, 'g'), `$1${value}$3`)
};

Installer.prototype._getProjectOptions = function () {
    var buildPath = '../builds';
    var docRoot = this.projectDir;
    switch (this.projectType) {
        case 'tao':
            buildPath = '../www/builds';
            docRoot = path.join(docRoot, 'www');
            break;
        case 'tao3':
            buildPath = '../web/builds';
            docRoot = path.join(docRoot, 'web');
            break;
        case 'bitrix':
            docRoot = path.join(docRoot, 'www');
            break;
    }
    return {'buildPath': buildPath, 'docRoot': docRoot};
};



Installer.prototype.writeUserSettings = function() {
  if (this.siteName && this.projectType) {
      var filePath = path.join(this.dir, 'user.settings.js');
      if (fse.existsSync(filePath)) {
          var result = fse.readFileSync(filePath, 'utf8');

          var {buildPath, docRoot} = this._getProjectOptions();
          docRoot = path.join(path.relative(this.dir, this.projectDir), path.relative(this.projectDir, docRoot));

          // write site
          result = this._replaceOptionsInConfig('site', this.siteName, result);
          // write buildPath
          result = this._replaceOptionsInConfig('buildPath', buildPath, result);
          // write docRoot
          result = this._replaceOptionsInConfig('docRoot', docRoot, result);

          fse.writeFileSync(filePath, result, 'utf8');
      }
  }
};

Installer.prototype.writeGitIgnore = function() {
    if (this.siteName && this.projectType) {
        var filePath = path.join(this.projectDir, '.gitignore');
        if (fse.existsSync(filePath)) {
            var result = fse.readFileSync(filePath, 'utf8');

            var {buildPath} = this._getProjectOptions();
            buildPath = path.relative(this.projectDir, buildPath);
            buildPath = path.join('/', buildPath);
            if (result.indexOf(buildPath) == -1) {
                result += "\n" + buildPath;
                fse.writeFileSync(filePath, result, 'utf8');
            }
        }
    }
};

Installer.prototype.writeWorkspaceConfig = function() {
    if (this.siteName && this.projectType) {
        var filePath = path.join(this.projectDir, '.workspace_config');
        if (fse.existsSync(filePath)) {
            var result = fse.readFileSync(filePath, 'utf8');

            var {buildPath} = this._getProjectOptions();
            buildPath = path.relative(this.projectDir, buildPath);
            buildPath = path.join(buildPath, 'prod');
            var assetsPath = path.join(this.dir, 'assets', 'prod.json');
            assetsPath = path.relative(this.projectDir, assetsPath);
            var thisDir = path.relative(this.projectDir, this.dir);
            var config =
`prepare cd ${thisDir}; frodo build prod
rsync ${buildPath}
rsync ${assetsPath}
`;
            if (result.indexOf('frodo ') == -1) {
                result += "\n" + config;
                fse.writeFileSync(filePath, result, 'utf8');
            }
        }
    }
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