#!/usr/bin/env node

const exec = require('child_process').exec;

function printResult(err, stdout, stderr) {
    if (err) {
        console.warn(err);
    }
    if (stdout) {
        console.log(stdout);
    }
    if (stderr) {
        console.log(stderr);
    }
}

console.log('Pre-built sequence started');
console.log('Formatting styles...');
exec('style-formatter', printResult);
