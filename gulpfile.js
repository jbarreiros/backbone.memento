var gulp = require('gulp');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var mocha = require('gulp-mocha');
var gutil = require('gulp-util');
var jshint = require('gulp-jshint');

gulp.task('jshint', function() {
  return gulp.src('backbone.memento.js')
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});

gulp.task('minify', function () {
  return gulp.src('./backbone.memento.js')
  .pipe(uglify({
    preserveComments: 'some'
  }))
  .pipe(rename({
    suffix: '.min'
  }))
  .pipe(gulp.dest('./'));
});

gulp.task('mocha', function() {
  return gulp.src(['test/*.js'], {read: false})
    .pipe(mocha({reporter: 'list'}))
    .on('error', gutil.log);
});

gulp.task('default', ['jshint', 'mocha', 'minify']);
