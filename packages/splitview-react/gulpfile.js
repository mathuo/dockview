const gulp = require('gulp');
const buildfile = require('../../scripts/build');
const package = require('./package');

buildfile.build({ tsconfig: './tsconfig.build.json', package });

gulp.task('run', gulp.series(['clean', 'esm', 'sass']));
