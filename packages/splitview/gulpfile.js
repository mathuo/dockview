const gulp = require('gulp');
const buildfile = require('../../scripts/build');

buildfile.init();

gulp.task('run', gulp.series(['sass']));
