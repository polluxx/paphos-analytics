var gulp = require('gulp'),
  commonjs = require('rollup-plugin-commonjs'),
  resolve = require('rollup-plugin-node-resolve'),
  concat = require('gulp-concat'),
  rollup     = require('gulp-rollup'),
  sourcemaps = require('gulp-sourcemaps'),
  connect = require('gulp-connect'),
  babel = require('gulp-babel'),
  ngAnnotate = require('gulp-ng-annotate'),
  uglify = require('gulp-uglify');

function build() {
  return gulp.src("./app/init.js", {read: false})
    .pipe(rollup({
      sourceMap: true,
      plugins: [ resolve({jsnext: true}), commonjs() ]
    }))
    .pipe(babel({ presets: ['es2015'] }))
    .pipe(ngAnnotate())
    //.pipe(sourcemaps.write("."))
    .pipe(gulp.dest('dist'));
}

gulp.task('compress', ['build'], function() {
  return gulp.src('./dist/init.js')
    .pipe(uglify())
    .pipe(gulp.dest('dist'));
});

gulp.task('build', build);

gulp.task('watch', function () {
  gulp.watch('app/**/*.js', ['build']);
});

gulp.task('connect', ['watch'], function () {
  connect.server({
    port: 4000,
    livereload: true
  });
});

gulp.task('default', ['connect']);