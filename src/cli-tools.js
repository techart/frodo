import chalk from 'chalk';
import childProcess from 'child_process';

class CliTools
{
    constructor() {
        this.format = {
            info: chalk.blue.bold,
            error: chalk.red.bold,
            buildError: chalk.bgRed.white.bold,
            buildWarning: chalk.yellow.bold,
            buildSuccess: chalk.green.bold
        };
        this.chalk = chalk;
    }

    info(message) {
        process.stdout.write(this.format.info(message) + '\n');
    }

    error(message) {
        process.stdout.write(this.format.error(message) + '\n'); //TODO: после исправления каши с цветами и отвязки цвета от потока использовать поток ошибок
    }

    simple(message) {
        process.stdout.write(message + '\n');
    }

    buildError(message) {
        process.stdout.write(this.format.buildError(message) + '\n'); //TODO: после исправления каши с цветами и отвязки цвета от потока использовать поток ошибок
    }

    buildWarning(message) {
        process.stdout.write(this.format.buildWarning(message) + '\n');
    }

    buildSuccess(message) {
        process.stdout.write(this.format.buildSuccess(message) + '\n');
    }

    building(percentage) {
        process.stdout.write(this.format.info('Идет сборка...........') + this.format.buildSuccess(percentage + '%'));
    }

    exec(cmd, redirect = true) {
        if (redirect) {
            return childProcess.execSync(cmd, {stdio: [0, 1, 2]})
        }

        return childProcess.execSync(cmd);
    }

    clear() {
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
    }
}

export default CliTools;
