#!/usr/bin/env node
const cliTools = new (require('../lib/cli-tools').default);
const version = require('../package.json').version;
var frontend;
var PathFinderError = require('../lib/errors/path-finder-error').default;
var InstallationError = require('../lib/errors/installation-error').default;
var BuildError = require('../lib/errors/build-error').default;

try {

    frontend = new (require('../lib/frontend').default)(process.cwd());

    const cli = require('commander');
    cli.version(version);

    cli.command('build [env]')
        .description('run setup commands for all envs')
        .option('-f, --force', 'Force build')
        .option('-h, --hash <type>', 'Deprecated. Will be removed in future')
        .action(function(env, options) {
            var force = options.force || false;
            frontend.check_dir();
            env = env || 'dev';

            if (options.hash) {
                cliTools.buildWarning('Hash choice is deprecated, now md5 only. -h flag will be removed');
            }

            cliTools.info('Start building frontend for env: ' + cliTools.chalk.bold(env));
            frontend.builder().build(env, force);
        });

    cli.command('watch')
        .description('build dev environment and start watching for changing files')
        .action(function() {
            frontend.check_dir();
            cliTools.info('Start watching frontend');
            frontend.builder().watch();
        });

    cli.command('hot')
        .description('Run hot server')
        .action(function() {
            frontend.check_dir();
            cliTools.info('Starting hot server');
            frontend.builder().hot();
        });

    cli.command('lock')
        .description('Run tests of different types')
        .action(function() {
            frontend.check_dir();
            cliTools.info('Start locking dependencies version');
            cliTools.exec('npm shrinkwrap --dev && bower i --reset-shrinkwrap');
        });

    cli.command('install [type]')
        .description('Installs different things')
        .action(function(type) {
            var commands = {
                'main': 'sudo npm i -g bower webpack babel-cli',
                'tests': 'sudo npm i -g fs phantomjs-prebuilt phantomcss resemblejs casperjs'
            };
            var cmd = type ? commands[type] : 'npm run pkg';
            if (!cmd) {
                throw new Error('Unknown install type');
            }
            cliTools.exec(cmd);
        });

    cli.command('test [type]')
        .description('Run tests of different types')
        .action(function(type) {
            frontend.check_dir();
            switch (type) {
                case 'comparison':
                    cliTools.exec('casperjs test test/comparison.js --user=`whoami` || true');
                    break;
                default:
                    throw new Error('unknow argument [' + cliTools.chalk.inverse(type) + ']');
            }
        });

    cli.command('init [type]')
        .description('Init frontend of different types')
        .action(function(type) {
            type = type || 'master';

            if (type == 'sass' || type == 'scss') {
                type = 'master';
            }

            switch (type) {
                case 'less':
                case 'webgl':
                case 'master':
                    frontend.installer().install(type);
                    break;
                default:
                    throw new Error('unknow argument [' + cliTools.chalk.inverse(type) + ']');
            }
        });
    cli.command('create <block> <name>')
        .description('Creates block, block argument should be only "block"')
        .option('-s, --add-style', 'Create block style')
        .option('-j, --add-js', 'Create block js')
        .option('-t, --add-template', 'Create block template')
        .option('-S, --no-style', 'Dont create block style')
        .option('-J, --no-js', 'Dont create block js')
        .option('-T, --no-template', 'Dont create block template')
        .option('-f, --force', 'Force creation')
        .action(function(block, name, options) {
            frontend.check_dir();
            if (block != 'block') {
                throw new Error('There should be word - block');
            }
            var blockType = 'common';
            var blockName = name;
            var force = options.force || false;

            var parts = name.split('/');
            if (parts.length > 1) {
                blockType = parts[0];
                blockName = parts[1];
            }

            var files = {
                style: options.addStyle || options.style || false,
                template: options.addTemplate || options.template || false,
                js: options.addJs || false
            };

            frontend.blockGenerator().create(blockName, {namespace: blockType, files: files, force: force});
        });

    cli.command('format')
        .description('Styles to code style')
        .action(function() {
            frontend.check_dir();
            frontend.formatter().format();

        });
    cli.command('path_to_frontend')
        .alias('path_to_mordor')
        .description('Print path to mord... to closest frontend')
        .action(function() {
            var dir = frontend.pathFinder().pathToGo();
            if (dir != process.cwd()) {
                cliTools.info(dir);
            } else {
                cliTools.info("I'm already there")
            }
        });

    cli.command('update')
        .description('Update frontend-blank')
        .option('-f, --force', 'Force update')
        .option('-s, --scripts-upd', 'Update scripts in package.json')
        .option('-v, --version-number <number>', 'Update frontend-blank to specfied version')
        .action(function(option) {
            var force = option.force || false;
            var scriptsUpdate = option.scriptsUpd || false;
            var versionNumber = option.versionNumber || '';
            frontend.check_dir();
            frontend.blankUpdate().update(versionNumber, force, scriptsUpdate);
        });

    cli.command('clean')
        .description('Removes node_modules')
        .action(function() {
            frontend.check_dir();
            cliTools.exec('rm -rf node_modules');
        });

    cli.parse(process.argv);

    if (!cli.args.length) {
        cli.help();
    }

} catch (e) {
    if (e instanceof PathFinderError) {
        cliTools.error('Can\'t find frontend. ' + e.message);
    } else if (e instanceof InstallationError) {
        cliTools.error('Something went wrong while frontend installation: ' + e.message);
    } else if (e instanceof BuildError) {
        e.errorCode == 31 && cliTools.error('Something went wrong while build process: ' + e.message);
    } else {
        cliTools.error('Something went wrong: ' + e.message);
    }

    process.exitCode = e.errorCode || 1;
}
