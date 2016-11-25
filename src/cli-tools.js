const chalk = require('chalk');

function CliTools () {
    this.format = {
        info: chalk.bgWhite.blue,
        error: chalk.red.bold
    };
    this.chalk = chalk;
}

CliTools.prototype.info = function(message) {
    process.stdout.write(this.format.info(message) + '\n');
};

CliTools.prototype.error = function(message) {
    process.stderr.write(this.format.error(message) + '\n');
};

CliTools.prototype.exec = function(cmd) {
    return require('child_process').execSync(cmd, {stdio:[0,1,2]})
};

module.exports = CliTools;