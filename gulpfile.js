'use strict';

var gulp = require('gulp');
var gutil = require('gulp-util');
var browserify = require('gulp-browserify');
var uglify = require('gulp-uglify');
var gulpif = require('gulp-if');
var sass = require('gulp-sass');
var bourbon = require('node-bourbon').includePaths;
var watch = require('gulp-watch');
var nodemon = require('gulp-nodemon');
var jshint = require('gulp-jshint');
var mocha = require('gulp-mocha');

gutil.log('Environment', gutil.colors.blue(gutil.env.production ? 'Production' : 'Development'));

gulp.task('scripts', function() {
    return gulp.src('./client/js/app.js', {
        read: false
    })
        .pipe(browserify({
            insertGlobals: false,
            transform: ['hbsfy'],
            extensions: ['.hbs'],
            debug: !gutil.env.production
        }))
        .pipe(gulpif(gutil.env.production, uglify({
            mangle: {
                except: ['require', 'export', '$super']
            }
        })))
        .pipe(gulp.dest('./dist/js'));
});

gulp.task('styles', function() {
    return gulp.src('./client/scss/main.scss')
        .pipe(sass({
            outputStyle: gutil.env.production ? 'compressed' : 'expanded',
            includePaths: ['./client/scss'].concat(bourbon),
            errLogToConsole: gutil.env.watch
        }))
        .pipe(gulp.dest('./dist/css'));
});

gulp.task('html', function() {
    return gulp.src('./client/**/*.html')
        .pipe(gulp.dest('./dist'));
});

gulp.task('lint', function() {
    gulp.src(['client/**/*.js', 'server/**/*.js'])
        .pipe(jshint('.jshintrc'))
        .pipe(jshint.reporter('jshint-stylish'));
});

gulp.task('watch', function() {
    gutil.env.watch = true;

    gulp.watch('./client/**/*.html', ['html']);
    gulp.watch(['./client/js/**', './client/hbs/**'], ['scripts']);
    gulp.watch('client/scss/**', ['styles']);
});

gulp.task('test', function() {
    gulp.src('./test/**/*.js')
        .pipe(mocha({
            reporter: 'list'
        }));
});

gulp.task('server', function() {
    nodemon({
        script: 'server/server.js',
        ext: 'js'
    });
});

gulp.task('build', ['lint', 'styles', 'scripts', 'html']);

gulp.task('default', ['build']);