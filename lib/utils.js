(function() {
  var BufferStream, http, q, request, url,
    __slice = [].slice;

  http = require('http');

  url = require('url');

  q = require('q');

  request = require('request');

  BufferStream = require('./BufferStream');

  exports.extend = function() {
    var a, adds, k, old, v, _i, _len;
    old = arguments[0], adds = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    if (old == null) {
      old = {};
    }
    for (_i = 0, _len = adds.length; _i < _len; _i++) {
      a = adds[_i];
      for (k in a) {
        v = a[k];
        old[k] = v;
      }
    }
    return old;
  };

  exports.qserver = function(port, text) {
    var addr_defer, result_defer, server;
    addr_defer = q.defer();
    result_defer = q.defer();
    server = http.createServer(function(req, res) {
      var bs, u;
      u = url.parse(req.url, true);
      if (u.pathname === '/') {
        res.writeHead(200, {
          'Content-Type': 'text/html'
        });
        bs = new BufferStream();
        bs.on('finish', function() {
          result_defer.resolve([u.query, bs.toString('utf8')]);
          return server.close();
        });
        req.pipe(bs);
        res.end(text);
      } else {
        res.writeHead(404);
        res.end();
      }
      return req.connection.destroy();
    });
    server.on('error', function(er) {
      addr_defer.reject(er);
      return server.close();
    });
    server.listen(port, function() {
      var a;
      a = server.address();
      return addr_defer.resolve("http://localhost:" + a.port);
    });
    return [addr_defer.promise, result_defer.promise];
  };

  exports.qrequest = function(options) {
    var cb, d;
    if (options == null) {
      throw new Error("options not optional");
    }
    d = q.defer();
    cb = options.callback;
    if (cb != null) {
      delete options.callback;
      d.promise.nodeify(cb);
    }
    options.json = true;
    request(options, function(er, res, body) {
      if (er != null) {
        return d.reject(er);
      } else if (res.statusCode !== 200) {
        return d.reject(new Error("HTTP error: " + res.statusCode + "\nFrom: " + options.uri + "\n" + (JSON.stringify(body))));
      } else {
        return d.resolve(body);
      }
    });
    return d.promise;
  };

  if (!Array.prototype.find) {
    Object.defineProperty(Array.prototype, "find", {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function(predicate) {
        var i, length, list, thisArg, value;
        if (typeof this === "undefined" || this === null) {
          throw new TypeError("Array.prototype.find called on null or undefined");
        }
        if (typeof predicate !== "function") {
          throw new TypeError("predicate must be a function");
        }
        list = Object(this);
        length = list.length >>> 0;
        thisArg = arguments[1];
        value = void 0;
        i = 0;
        while (i < length) {
          if (i in list) {
            value = list[i];
            if (predicate.call(thisArg, value, i, list)) {
              return value;
            }
          }
          i++;
        }
        return undefined;
      }
    });
  }

}).call(this);
