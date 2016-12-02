import chalk from 'chalk';
import childProcess from 'child_process';

class CliTools
{
    constructor() {
        this.format = {
            info: chalk.bgWhite.blue,
            error: chalk.red.bold,
            buildError: chalk.bgRed.white.bold,
            buildWarning: chalk.yellow.bold,
            buildSuccess: chalk.bgGreen.white.bold
        };
        this.chalk = chalk;
    }

    info(message) {
        process.stdout.write(this.format.info(message) + '\n');
    }

    error(message) {
        process.stderr.write(this.format.error(message) + '\n');
    }

    simple(message) {
        process.stderr.write(message + '\n');
    }

    buildError(message) {
        process.stderr.write(this.format.buildError(message) + '\n');
    }

    buildWarning(message) {
        process.stderr.write(this.format.buildWarning(message) + '\n');
    }

    buildSuccess(message) {
        process.stderr.write(this.format.buildSuccess(message) + '\n');
    }

    exec(cmd) {
        return childProcess.execSync(cmd, {stdio:[0,1,2]})
    };

}

export default CliTools;
