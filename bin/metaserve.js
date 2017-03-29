#!/usr/bin/env node
// Generated by CoffeeScript 1.8.0
(function() {
  var BASE_DIR, CONFIG_FILE, CSS_COMPILER, DEFAULT_BASE_DIR, DEFAULT_COMPILERS, HOST, HTML_COMPILER, JS_COMPILER, PORT, VERBOSE, app, argv, compilers, config, de_res, defaults, e, express, file_path, fs, isArray, isString, metaserve_compile, metaserve_middleware, url, util;

  fs = require('fs');

  url = require('url');

  util = require('util');

  de_res = function(n) {
    return Math.floor(n / 1000) * 1000;
  };

  isArray = function(a) {
    return Array.isArray(a);
  };

  isString = function(s) {
    return typeof s === 'string';
  };

  defaults = function(o, d) {
    var k, o_, v;
    o_ = {};
    for (k in o) {
      v = o[k];
      o_[k] = v;
    }
    for (k in d) {
      v = d[k];
      if (o[k] == null) {
        o_[k] = v;
      }
    }
    return o_;
  };

  VERBOSE = process.env.METASERVE_VERBOSE != null;

  DEFAULT_BASE_DIR = '.';

  DEFAULT_COMPILERS = function() {
    return {
      html: require('metaserve-html-jade'),
      js: require('metaserve-js-coffee-reactify'),
      css: require('metaserve-css-styl')
    };
  };

  module.exports = metaserve_middleware = function(config, compilers) {
    if (config == null) {
      config = {};
    }
    if (isString(config)) {
      config = {
        base_dir: config
      };
    }
    compilers || (compilers = DEFAULT_COMPILERS());
    config.base_dir || (config.base_dir = DEFAULT_BASE_DIR);
    return function(req, res, next) {
      var file_path;
      file_path = url.parse(req.url).pathname;
      if (file_path.slice(-1)[0] === '/') {
        file_path += 'index.html';
      }
      return metaserve_compile(compilers, file_path, config, {
        req: req
      }, function(err, response) {
        var filename;
        if (err) {
          return res.send(500, err);
        } else if (typeof response === 'string') {
          if (file_path.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
          } else if (file_path.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css');
          } else if (file_path.endsWith('.html')) {
            res.setHeader('Content-Type', 'text/html');
          }
          return res.end(response);
        } else if (response != null ? response.compiled : void 0) {
          if (response.content_type) {
            res.setHeader('Content-Type', response.content_type);
          }
          return res.end(response.compiled);
        } else {
          filename = config.base_dir + file_path;
          if (fs.existsSync(filename)) {
            if (VERBOSE) {
              console.log('[normalserve] Falling back with ' + filename);
            }
            return res.sendfile(filename);
          } else {
            if (VERBOSE) {
              console.log('[normalserve] Could not find ' + filename);
            }
            return next();
          }
        }
      });
    };
  };

  metaserve_compile = function(all_compilers, file_path, config, context, cb) {
    var base_dir, compiler, compiler_config, compilers, ext, filename, filename_stem, matched, path_match, _i, _len;
    if (VERBOSE) {
      console.log('[metaserve_compile] file_path=', file_path, 'config=', config);
    }
    for (path_match in all_compilers) {
      compilers = all_compilers[path_match];
      if (!path_match.match('\/')) {
        path_match = '\/(.*)\.' + path_match;
      }
      path_match = new RegExp(path_match);
      if (!isArray(compilers)) {
        compilers = [compilers];
      }
      compilers = compilers.filter(function(c) {
        return c != null;
      });
      if (matched = file_path.match(path_match)) {
        for (_i = 0, _len = compilers.length; _i < _len; _i++) {
          compiler = compilers[_i];
          ext = compiler.ext;
          base_dir = config.base_dir || '.';
          filename_stem = matched[1];
          filename = base_dir + '/' + filename_stem + '.' + ext;
          if (fs.existsSync(filename)) {
            compiler_config = defaults(config[ext] || {}, compiler.default_config);
            compiler_config.base_dir = base_dir;
            if (compiler.shouldCompile != null) {
              if (!compiler.shouldCompile(filename)) {
                if (VERBOSE) {
                  console.log("[metaserve] Skipping compiler for " + filename);
                }
                continue;
              }
            }
            if (VERBOSE) {
              console.log("[metaserve] Using compiler for " + file_path + " (" + filename + ")");
            }
            context = Object.assign({}, config.globals, context);
            return compiler.compile(filename, compiler_config, context, cb);
          } else {
            if (VERBOSE) {
              console.log("[metaserve] File not found for " + filename);
            }
          }
        }
      }
    }
    return cb(null);
  };

  if (require.main === module) {
    express = require('express');
    argv = require('minimist')(process.argv);
    HOST = argv.host || process.env.METASERVE_HOST || '0.0.0.0';
    PORT = argv.port || process.env.METASERVE_PORT || 8000;
    CONFIG_FILE = argv.c || argv.config;
    BASE_DIR = argv['base-dir'] || process.env.METASERVE_BASE_DIR || '.';
    if (CONFIG_FILE != null) {
      try {
        config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
        if (VERBOSE) {
          console.log("Using config:", util.inspect(config, {
            depth: null,
            colors: true
          }));
        }
      } catch (_error) {
        e = _error;
        console.log("Could not read config: " + CONFIG_FILE);
        process.exit(1);
      }
    } else {
      config = {};
    }
    HTML_COMPILER = argv.html || 'jade';
    JS_COMPILER = argv.js || 'coffee-reactify';
    CSS_COMPILER = argv.css || 'styl';
    compilers = {
      html: require("metaserve-html-" + HTML_COMPILER),
      js: require("metaserve-js-" + JS_COMPILER),
      css: require("metaserve-css-" + CSS_COMPILER)
    };
    if (file_path = argv.bounce) {
      if (!file_path.startsWith('/')) {
        file_path = '/' + file_path;
      }
      metaserve_compile(compilers, file_path, config, {}, function(err, response) {
        var bounced_filename;
        if ((response != null ? response.compiled : void 0) != null) {
          if (typeof argv.out === 'boolean') {
            return console.log(response.compiled);
          } else {
            bounced_filename = argv.out || BASE_DIR + filename + '.bounced';
            fs.writeFileSync(bounced_filename, response.compiled);
            return console.log("[metaserve] Bounced to " + bounced_filename);
          }
        } else if (err != null) {
          return console.log("[metaserve] Bouncing failed", err);
        } else {
          return console.log("[metaserve] Bouncing failed, make sure path " + file_path + " exists");
        }
      });
    } else {
      app = express();
      app.use(function(req, res, next) {
        console.log("[" + req.method + "] " + req.path);
        return next();
      });
      app.use(metaserve_middleware(config, compilers));
      app.listen(PORT, HOST, function() {
        return console.log("Metaserving on http://" + HOST + ":" + PORT + "/");
      });
    }
  }

}).call(this);
