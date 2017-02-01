var gulp = require("gulp");
var browserify = require("browserify");
var reactify = require("reactify");
var source = require("vinyl-source-stream");

gulp.task('client-css', function() {
  return gulp.src('client/src/styles.css')
    .pipe(gulp.dest('client/dist/static/styles'));
});

gulp.task('client-html', function() {
  return gulp.src('client/src/index.html')
    .pipe(gulp.dest('client/dist'));
});

gulp.task('client-javascript', function() {
  return browserify({
    entries: [
      "./client/src/main.jsx"
    ],
    debug: true
  }).transform(reactify)
    .bundle()
    .pipe(source("main.js"))
    .pipe(gulp.dest("client/dist/static/js"));
});

gulp.task("default",["client-javascript", "client-html", "client-css"],function(){
  console.log("Gulp completed...");
});
