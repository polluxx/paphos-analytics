var gulp = require('gulp'),
    rollup = require('rollup').rollup,
    commonjs = require('rollup-plugin-commonjs'),
    resolve = require('rollup-plugin-node-resolve'),
    watchify = require('watchify'),
    concat = require('gulp-concat'),
    sourcemaps = require('gulp-sourcemaps'),
    connect = require('gulp-connect');

    function build() {
        return rollup({
                entry: "./app/init.js",
                plugins: [
                    resolve({ jsnext: true }),
                    commonjs()
                ]
            })
            .then((bundle) => {
                return bundle.write({
                    format: "es6",
                    dest: "dist/app.js"
                });
        });
    }

    gulp.watch('app/**/*.js', ['build']);

    gulp.task('build', build);

    gulp.task('watch', function () {
        //gulp.watch('./app/views/**/*.html', ['translate']);
      console.log('...rebuild');
        return build();
    });

    gulp.task('connect', ['watch'], function () {
        connect.server({
            port: 4000,
            livereload: true,
        });
    });

    gulp.task('default', ['connect']);