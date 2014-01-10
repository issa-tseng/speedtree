module.exports = (grunt) ->

  # build config
  grunt.initConfig(
    clean:
      all:
        src: 'lib/**/*.js'

    livescript:
      all:
        expand: true
        cwd: 'src/'
        src: '**/*.ls'
        dest: 'lib'
        ext: '.js'

    simplemocha:
      options:
        ui: 'tdd'
        reporter: 'spec'

      all:
        src: 'test/**/*.ls'

  )

  # load plugins
  grunt.loadNpmTasks('grunt-contrib-clean')
  grunt.loadNpmTasks('grunt-contrib-watch')
  grunt.loadNpmTasks('grunt-livescript')

  grunt.loadNpmTasks('grunt-simple-mocha')


  # tasks
  grunt.registerTask('default', [ 'clean:all', 'livescript:all' ])
  grunt.registerTask('test', [ 'default', 'simplemocha:all' ])

