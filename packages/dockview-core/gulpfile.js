const gulp = require('gulp');
const gulpSass = require('gulp-sass')(require('sass'));
const concat = require('gulp-concat');

gulp.task('sass', () => {
    return gulp
        .src('./src/**/*.scss')
        .pipe(gulpSass({ charset: false }).on('error', gulpSass.logError))
        .pipe(concat('dockview.css'))
        .pipe(gulp.dest('./dist/styles/'));
});

gulp.task('run', gulp.series(['sass']));
