const gulp = require('gulp');
const gulpSass = require('gulp-dart-sass');
const concat = require('gulp-concat');

const init = () => {
    gulp.task('sass', () => {
        return gulp
            .src('./src/**/*.scss')
            .pipe(gulpSass().on('error', gulpSass.logError))
            .pipe(concat('dockview.css'))
            .pipe(gulp.dest('./dist/styles/'));
    });
};

module.exports = { init };
