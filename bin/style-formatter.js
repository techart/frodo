#!/usr/bin/env node
require('child_process').exec('find ./src \\( -name "*.scss" -o -name "*.sass" \\) -exec ./node_modules/.bin/stylefmt -c .stylelintrc {} \\;');