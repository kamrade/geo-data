'use strict';

var source = require('vinyl-source-stream');
var gulp = require('gulp');
var gutil = require('gulp-util');
var browserify = require('browserify');
var babelify = require('babelify');
var watchify = require('watchify');
var notify = require('gulp-notify');

var sass = require('gulp-sass');
var cleanCSS = require('gulp-clean-css');
var autoPrefixer = require('gulp-autoprefixer');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var buffer = require('vinyl-buffer');
var jade = require('gulp-jade');

var browserSync = require('browser-sync');
var reload = browserSync.reload;
var historyApiFallback = require('connect-history-api-fallback')


gulp.task('img', function(){
	return gulp.src('./img/**/*')
				.pipe(gulp.dest('./assets/css/img'))
				.pipe(reload({stream:true}));
});

gulp.task('fonts', function(){
	return gulp.src('./fonts/**/*')
				.pipe(gulp.dest('./assets/css/fonts'))
				.pipe(reload({stream:true}));
});


gulp.task('jade', function(){
	return gulp.src('./src/jade/**/index.jade')
				.pipe(jade({ pretty:true }))
				.pipe(gulp.dest('./'))
				.pipe(reload({stream:true}));
});

gulp.task('reload', function(){
	return gulp.src('./data/*.json')
				.pipe( reload({stream:true}) );
});


// Styles

gulp.task('styles', function(){
	// move all fonts
	gulp.src('src/fonts/**.*')
		.pipe(gulp.dest('assets/css/fonts'))
	// compile css
	gulp.src('src/sass/main.sass')
		.pipe(sass())
		.pipe(autoPrefixer({
			browsers: ['last 2 versions', '> 1%', 'IE 8'],
			cascade: false
		}))
		.pipe(cleanCSS({compatibility: 'ie8'}))
		.pipe(rename('style.css'))
		.pipe(gulp.dest('./assets/css'))
		.pipe(reload({stream:true}));

});

// gulp.task('img',function(){
//   gulp.src('src/img/**')
//     .pipe(gulp.dest('./assets/img'))
// });

// Browser sync
gulp.task('browser-sync', function(){
	browserSync({
		server: {},
		middleware : [ historyApiFallback() ],
		ghostMode: false
	});
});

function handleErrors() {
	var args = Array.prototype.slice.call(arguments);
	notify.onError({
		title: 'Compile Error',
		message: '<%= error.message %>'
	}).apply(this, args);
	this.emit('end');  // keep gulp from handing on this task
}

function buildScript(file, watch) {
	var props = {
		entries: ['./src/js/' + file],
		debug: true,
		cache: {},
		packageCache: {},
		transform:  [babelify.configure({stage : 0 })]
	};

	// watchify() if watch requested, otherwise run browserify() once
	var bundler = watch ? watchify(browserify(props)) : browserify(props);

	function rebundle() {
		var stream = bundler.bundle();
		return stream
			.on('error', handleErrors)
			.pipe(source(file))
			.pipe(gulp.dest('./assets/'))
			// if you also want to uglify it
			// .pipe(buffer())
			// .pipe(uglify())
			// .pipe(rename('app.min.js'))
			// .pipe(gulp.dest('./assets/'))
			.pipe(reload({stream:true}))
	}

	// listen for an update and run rebundle
	bundler.on('update', function(){
		rebundle();
		gutil.log('Rebundle...');
	});

	// run it once the first time buildScript is called
	return rebundle();
}



gulp.task('scripts', function(){
	return buildScript('main.js', false); // this will once run once because we set watch to false
});

// run scripts task first, then watch for future changes
gulp.task('default', ['fonts', 'img', 'jade', 'styles', 'scripts', 'browser-sync'], function(){
	gulp.watch('./src/sass/**/*', ['styles']); //
	gulp.watch('./src/jade/**/*', ['jade']);
	gulp.watch('./img/**/*', ['img']);
	gulp.watch('./fonts/**/*', ['fonts']);
	gulp.watch('./data/**/*.json', ['reload']);
	return buildScript('main.js', true); // browserify watch for JS changes
});
