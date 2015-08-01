var gulp = require('gulp');
var gulIf = require('gulp-if');
var sass = require('gulp-sass');
var watch = require('gulp-watch');
var browserify = require('browserify');
var transform = require('vinyl-transform');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var watchify = require('watchify');
var mergeStream = require('merge-stream');
var _ = require('lodash');
var uglify = require('gulp-uglify');
var reactify = require('reactify');
var rename = require('gulp-rename');

var debug = false;

var sassDirectories = [
    '{project_name}/{project_name}/static/sass/*.scss',
    'bower_components/foundation/scss/*.scss'
];

// output browserified bundles here
var jsOutputDir = './{project_name}/{project_name}/static/js/';

// look for js to make into browserified bundles here
var jsSourceDir = './{project_name}/{project_name}/static/js_modules/';
var standardPackages = ['react', ];

/* Compile  Sass */
gulp.task('sass', function() {
    return gulp.src(sassDirectories)
        .pipe(sass())
        .pipe(gulp.dest('{project_name}/{project_name}/static/css'));
        //.pipe(rename({suffix: '.min'}))
        //.pipe(minifycss())
        //.pipe(gulp.dest('static/stylesheets'))
        //.pipe(gzip(gzip_options))
        //.pipe(gulp.dest('static/stylesheets'))
        //.pipe(livereload());
});

/* Watch Files For Changes */
gulp.task('watch', function() {
    //livereload.listen();
    gulp.watch(sassDirectories, ['sass']);
    /* Trigger a live reload on any Django template changes */
    //gulp.watch('**/templates/*').on('change', livereload.changed);

});

gulp.task('browserify', function() {

    // refer to https://github.com/greypants/gulp-starter/blob/master/gulp/tasks/browserify.js
    // to improve this further to handle shared dependencies and dev vs prod stuff
    var browserifyThis = function(config, plugins) {
        // set some standard settings which are true for every bundle
        _.defaults(config,
                   {paths: [jsSourceDir],
                    debug: debug,
                    cache: {},
                    packageCache: {},
                    fullPaths: false,});
                if(config.outputName !== 'main.js') {
            _.assign(config,
                     {external: _.union(config.external, standardPackages)
                     });
        }

        var b = browserify(config);

         var bundle = function () {
            console.log('bundling');
            return b
                .transform(reactify)
                .bundle()
                .pipe(source(config.outputName))
                .pipe(buffer())
                .pipe(uglify())
                .pipe(gulp.dest(jsOutputDir));
        }
        
                if(plugins) {
            for(var i=0; i<plugins.length; i++) {
                b.plugin(plugins[i].name, plugins[i].conf);
            }
        }
        if(config.external){ b.external(config.external) };
        if(config.require){ b.require(config.require) };
        b = watchify(b);
        b.on('update', bundle);
        bundle();
    };
    
    // configs go here.. could move these to separate config file
    var mainConfig = {
        entries: [
            jsSourceDir + 'main.js'
        ],
        cache: {},
        packageCache: {},
        fullPaths: false,
        outputName: 'main.js',
        debug: debug,
        require: standardPackages
    };
    browserifyThis(mainConfig, []);
    
});

gulp.task('default', ['sass', 'browserify', 'watch']);
