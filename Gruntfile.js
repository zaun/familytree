module.exports = function (grunt) {
  'use strict';

  grunt.initConfig({
    'package': grunt.file.readJSON('package.json'),

    'bower-install-simple': {
      install: {
        options: {
          install: true,
          production: false,
          interactive: false,
          directory: 'bower_components'
        }
      }
    },

    'clean': {
      'deploy': ['build', 'bower_components', 'temp', 'tree-files'],
      'all': ['build', 'bower_components', 'node_modules']
    },

    'copy': {
      client: {
        files: [{
          cwd: 'client/static',
          src: ['**/*'],
          dest: 'build/static/',
          expand: true
        }]
      }
    },

    'jade': {
      options: {
        pretty: true
      },
      client: {
        files: [{
          expand: true,
          cwd: 'client/jade',
          src: [ '**/*.jade' ],
          dest: 'build/static/html',
          ext: '.html'
        }]
      }
    },

    'jshint': {
      files: ['Gruntfile.js', 'client/**/*.js'],
      options: {
        jshintrc: true
      }
    },

    'jscs': {
      files: ['Gruntfile.js', 'client/**/*.js'],
      options: {
        config: '.jscsrc'
      }
    },

    'stylus': {
      options: {
        paths: [
          'client/stylus'
        ],
        urlfunc: 'embedurl',
        banner: '/*! <%= package.name %> <%= grunt.template.today("isoUtcDateTime") %> <%= grunt.config("gitinfo.shortSHA") %> */\n'
      },
      client: {
        files: {
          'build/static/css/site.css': [
            'client/stylus/*.styl'
          ]
        }
      }
    },

    'uglify': {
      options: {
        mangle: false,
        preserveComments: false,
        beautify: true,
        banner: '/*! <%= package.name %> <%= grunt.template.today("isoUtcDateTime") %> <%= grunt.config("gitinfo.shortSHA") %> */\n'
      },
      client: {
        files: {
          'build/static/js/<%= package.name %>.min.js': [
            'bower_components/angular-ui-router/release/angular-ui-router.js',
            'bower_components/angular-extend-promises/angular-extend-promises-without-lodash.min.js',
            'bower_components/angular-local-storage/dist/angular-local-storage.min.js',
            'bower_components/blueimp-md5/js/md5.js',
            'bower_components/lodash/lodash.js',
            'bower_components/ng-file-upload/ng-file-upload.js',
            'bower_components/underscore.string/lib/underscore.string.js',
            'client/js/**/*.js'
          ]
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-bower-install-simple');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-jade');
  grunt.loadNpmTasks('grunt-contrib-stylus');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-npm-install');
  grunt.loadNpmTasks('grunt-jscs');

  grunt.registerTask('bower', ['bower-install-simple']);
  grunt.registerTask('test', ['jshint', 'jscs']);
  grunt.registerTask('deploy', ['clean:deploy', 'default']);
  grunt.registerTask('default', ['bower', 'test', 'jade', 'stylus', 'copy', 'uglify']);
};