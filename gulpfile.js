'use strict';

var gulp = require('gulp');
var gutil = require('gulp-util');
var concat = require('gulp-concat');
var stylus = require('gulp-stylus');
var jade = require('gulp-jade');
var vulcanize = require('gulp-vulcanize');
var cheerio = require('cheerio');
// TODO use browserify instead
var browserify = require('gulp-browserify');
var livereload = require('gulp-livereload');
var lr = require('tiny-lr');
var lrServer = lr();
var fs = require('fs');

var app_styl = './app/stylus/**/main.styl';
var elements_jade = './app/elements/**/index.jade';
var elements_styl = './app/elements/**/*.styl';
var elements_js = './app/elements/**/*.js';
var main_jade = './app/index.jade';
var main_html = './app/index.html';

function readDir (dir) {
  // TODO: optimize
  var files = fs.readdirSync(dir);
  return files.filter(function (file) {
    var stats = fs.lstatSync(dir + '/' + file);
    return stats.isDirectory();
  });
}

/**
 * HTML
 */
gulp.task('jade-elements', function () {
  return gulp.src(elements_jade)
    .pipe(jade({
      pretty: true
    }))
    .pipe(gulp.dest('./app/tmp'))
    .pipe(livereload(lrServer));
});

gulp.task('jade-main', function () {
  return gulp.src(main_jade)
    .pipe(jade({
      pretty: true
    }))
    .pipe(gulp.dest('./app'))
    .pipe(livereload(lrServer));
});

gulp.task('add-dep', ['jade-main'], function () {
  // TODO: optimize
  var html = fs.readFileSync('./app/index.html', { encoding: 'utf8' });
  var $ = cheerio.load(html);
  var $head = $('head');
  readDir('./app/elements').forEach(function (component) {
    var path = './tmp/' + component + '/index.html';
    $head.append('<link rel="import" href="' + path + '">');
  });
  fs.writeFileSync('./app/index.html', $.html());
});

gulp.task('vulcanize', ['add-dep', 'jade-elements'], function () {
  gulp.src(main_html)
    .pipe(vulcanize({ dest: './app' }))
    .pipe(gulp.dest('./app'))
    .pipe(livereload(lrServer));
});

/**
 * JS
 */
gulp.task('js-elements-entry', function () {
  // TODO: hacky...
  var elements_js = readDir('./app/elements').map(function (path) {
    return '../elements/' + path + '/component.js';
  });
  var js = elements_js.reduce(function (file, path) {
    return file + 'require(\'' + path + '\');\n';
  }, '');
  fs.writeFileSync('./app/tmp/entry.js', js);
});

gulp.task('js-elements', ['js-elements-entry'], function() {
  gulp.src('./app/tmp/entry.js')
    .pipe(browserify({
      insertGlobals: true,
      debug: !process.env.production,
      shim: {
      }
    }))
    .pipe(concat('./app/app.js'))
    .pipe(gulp.dest('./'));
});

/**
 * CSS
 */
gulp.task('stylus', function () {
  gulp.src(app_styl)
    .pipe(stylus({

    }))
    .pipe(gulp.dest('./app'))
    .pipe(livereload(lrServer));
});

gulp.task('watch', function () {
  lrServer.listen(35729, function (err) {
    if (err) return console.log(err);

    gulp.watch([app_styl], function(event) {
      gutil.log('File ' + event.path + ' was ' + event.type);
      gulp.run('stylus');
    });

    gulp.watch([elements_jade, elements_styl, elements_js, main_jade], function(event) {
      // TODO: run everything for now, but should only reload the necessary tasks
      gutil.log('File ' + event.path + ' was ' + event.type);
      gulp.run('vulcanize', 'js-elements');
    });
  });
});

gulp.task('default', ['stylus', 'vulcanize', 'js-elements']);
