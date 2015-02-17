// Generated by CoffeeScript 1.8.0
(function() {
  var BASE_DIR, DEFAULT_BASE_DIR, DEFAULT_COMPILERS, HOST, PORT, VERBOSE, argv, coffee, de_res, express, fs, jade, metaserve, options, server, uglify, url, _;

  fs = require('fs');

  url = require('url');

  coffee = require('coffee-script');

  jade = require('jade');

  uglify = require('uglify-js');

  _ = require('underscore');

  de_res = function(n) {
    return Math.floor(n / 1000) * 1000;
  };

  VERBOSE = process.env.METASERVE_VERBOSE != null;

  DEFAULT_BASE_DIR = './static';

  DEFAULT_COMPILERS = function() {
    return {
      html: require('metaserve-html-jade')(),
      js: require('metaserve-js-coffee')(),
      css: require('metaserve-css-styl')()
    };
  };

  module.exports = metaserve = function(options) {
    if (options == null) {
      options = {};
    }
    if (_.isString(options)) {
      options = {
        base_dir: options
      };
    }
    options.base_dir || (options.base_dir = DEFAULT_BASE_DIR);
    options.compilers || (options.compilers = DEFAULT_COMPILERS());
    return function(req, res, next) {
      var base_dir, compiler, compilers, ext, file_url, filename, filename_stem, matched, url_match, _i, _len, _ref, _ref1;
      file_url = url.parse(req.url).pathname;
      if (file_url.slice(-1)[0] === '/') {
        file_url += 'index.html';
      }
      console.log("[" + req.method + "] " + file_url);
      _ref = options.compilers;
      for (url_match in _ref) {
        compilers = _ref[url_match];
        console.log("Trying " + url_match, compilers);
        if (!url_match.match('\/')) {
          url_match = '\/(.*)\.' + url_match;
          console.log("Now " + url_match);
        }
        if (!_.isArray(compilers)) {
          compilers = [compilers];
        }
        if (matched = file_url.match(new RegExp(url_match))) {
          for (_i = 0, _len = compilers.length; _i < _len; _i++) {
            compiler = compilers[_i];
            _ref1 = compiler.options, base_dir = _ref1.base_dir, ext = _ref1.ext;
            base_dir || (base_dir = options.base_dir);
            filename_stem = matched[1];
            filename = base_dir + '/' + filename_stem + '.' + ext;
            if (fs.existsSync(filename)) {
              if (compiler.shouldCompile != null) {
                if (!compiler.shouldCompile(filename)(req, res, next)) {
                  if (VERBOSE) {
                    console.log("[metaserve] Skipping compiler for " + filename);
                  }
                  continue;
                }
              }
              if (VERBOSE) {
                console.log("[metaserve] Using compiler for " + file_url + " (" + filename + ")");
              }
              return compiler.compile(filename)(req, res, next);
            } else {
              if (VERBOSE) {
                console.log("[metaserve] File not found for " + filename);
              }
            }
          }
        }
      }
      filename = options.base_dir + file_url;
      if (fs.existsSync(filename)) {
        if (VERBOSE) {
          console.log('[normalserve] Falling back with ' + filename);
        }
        return res.sendfile(filename);
      } else {
        return res.send(404, '404, the file is absent.');
      }
    };
  };

  if (require.main === module) {
    express = require('express');
    argv = require('yargs').argv;
    HOST = argv.host || '0.0.0.0';
    PORT = argv.port || 8000;
    BASE_DIR = argv._[0] || './static';
    options = {
      base_dir: BASE_DIR
    };
    server = express().use(metaserve(options));
    server.listen(PORT, HOST, function() {
      return console.log("metaserving on " + HOST + ":" + PORT + "...");
    });
  }

}).call(this);