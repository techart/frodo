#!/usr/bin/env node
const cliTools = new (require('../lib/cli-tools').default);
var frontend;

try {

    frontend = new (require('../lib/frontend').default)(process.cwd());

    const cli = require('commander');
    cli.version('0.0.1');

    cli.command('build [env]')
        .description('run setup commands for all envs')
        .option('-f, --force', 'Force build')
        .action(function(env, options) {
            var force = options.force || false;
            frontend.check_dir();
            env = env || 'dev';
            cliTools.info('Star building frontend for env: ' + cliTools.chalk.bold(env));
            frontend.builder().build(env, force);
        });

    cli.command('watch')
        .description('build dev environment and start watching for changing files')
        .action(function() {
            frontend.check_dir();
            cliTools.info('Star watching frontend');
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
                'tests': 'sudo npm i -g fs phantomcss resemblejs casperjs phantomjs'
            };
            var cmd = type ? commands[type] : 'npm i && bower install';
            if (!cmd) {
                cliTools.error('Unknown install type');
                process.exit(0);
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
                    cliTools.error('unknow argument [' + cliTools.chalk.inverse(type) + ']');
                    process.exit(0);
            }
        });

    cli.command('init [type]')
        .description('Init frontend of different types')
        .action(function(type) {
            type = type || 'master';

            if (type == 'sass') {
                type = 'master';
            }

            switch (type) {
                case 'less':
                case 'webgl':
                case 'master':
                    frontend.installer().install(type);
                    break;
                default:
                    cliTools.error('unknow argument [' + cliTools.chalk.inverse(type) + ']');
                    process.exit(0);
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
                cliTools.error('There should be word - block');
                process.exit(0);
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

            frontend.blockGenerator().create(blockName, {type: blockType, files: files, force: force});
        });

    cli.parse(process.argv);

    if (!cli.args.length) {
        cli.help();
    }

} catch (e) {
    cliTools.error('Can\'t run frontend. ' + e.message + '\nProbably you are running this command not in frontend directory');
    process.exit(0);
}
