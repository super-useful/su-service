/*

  proxy to pass through version level services

*/
var iter = require('super-iter');
var map = iter.map;

var apiProxy = require('./api');
var cache = new WeakMap;

var proxy_handler = {
  // NOTE: receiver === proxy created in module.exports!!!
  get: function(receiver, property) {

    var versions = cache.get(receiver);

    if (versions[property]) {

      return versions[property];
    }

    throw new ReferenceError(property + ': does not exist');
  },

  set: function(receiver, property) {

    return new Error('su-service: cannot set a property on a service.');
  }
};

module.exports = function (version) {

  var proxy = Proxy.create(proxy_handler);

  cache.set(proxy, map(version, apiProxy));

  return proxy;
};
