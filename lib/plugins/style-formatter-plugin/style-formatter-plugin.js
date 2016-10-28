module.exports = function StyleFormatterPlugin() {
    return {
        apply: function(compiler) {
            compiler.plugin('run', function (compilation, done) {
                require('child_process').execSync('find ./src \\( -name "*.scss" -o -name "*.sass" \\) -exec ./node_modules/.bin/stylefmt -c .stylelintrc {} \\;');
                console.log('Custom Watch Finish');
                done();
            });
        }
    };
};
