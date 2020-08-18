const gulp = require("gulp");
const gulpClean = require("gulp-clean");
const gulpTypescript = require("gulp-typescript");
const merge = require("merge2");
const header = require("gulp-header");
const gulpSass = require("gulp-sass");
const concat = require("gulp-concat");

const headerTemplate = [
  "/**",
  " * <%= pkg.name %> - <%= pkg.description %>",
  " * @version v<%= pkg.version %>",
  " * @link <%= pkg.homepage %>",
  " * @licence <%= pkg.licence %>",
  " */\n",
].join("\n");

const dtsHeaderTemplate = [
  "// Type definitions for <%= pkg.name %> v <%= pkg.version %>",
  "// Project <%= pkg.homepage %>\n",
].join("\n");

const build = (options) => {
  const { tsconfig, package } = options;
  gulp.task("clean", () =>
    gulp.src("dist", { read: false, allowEmpty: true }).pipe(gulpClean())
  );

  gulp.task("esm", () => {
    const ts = gulpTypescript.createProject(tsconfig);
    const tsResult = gulp.src(["src/**/*.ts", "src/**/*.tsx"]).pipe(ts());
    return merge([
      tsResult.dts
        .pipe(header(dtsHeaderTemplate, { pkg: package }))
        .pipe(gulp.dest("./dist/esm")),
      tsResult.js
        .pipe(header(headerTemplate, { pkg: package }))
        .pipe(gulp.dest("./dist/esm")),
    ]);
  });

  gulp.task("sass", () => {
    return (
      gulp
        .src("./src/**/*.scss")
        // .pipe(
        // concat("styles.scss")
        .pipe(gulpSass().on("error", gulpSass.logError))
        // )
        .pipe(concat("styles.css"))
        .pipe(gulp.dest("./dist"))
    );
  });
};

module.exports = { build };
