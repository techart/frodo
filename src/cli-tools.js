import chalk from 'chalk';
import childProcess from 'child_process';

class CliTools
{
    constructor() {
        this.format = {
            info: chalk.bgWhite.blue,
            error: chalk.red.bold
        };
        this.chalk = chalk;
    }

    info(message) {
        process.stdout.write(this.format.info(message) + '\n');
    }

    error(message) {
        process.stderr.write(this.format.error(message) + '\n');
    }

    static exec(cmd) {
        return childProcess.execSync(cmd, {stdio:[0,1,2]})
    };

}

export default CliTools;
