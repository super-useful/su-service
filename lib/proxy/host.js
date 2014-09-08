/*

  proxy to pass through host level services

*/
var iter = require('super-iter');
var map = iter.map;
var versionProxy = require('./version');
var cache = new WeakMap;

var proxy_handler = {
  // NOTE: receiver === proxy created in module.exports!!!
  get: function(receiver, property) {

    var services = cache.get(receiver);

    if (services[property]) {

      return services[property];
    }

    throw new ReferenceError(property + ': does not exist');
  },

  set: function(receiver, property) {

    return new Error('su-service: cannot set a property on a service.');
  }
};

module.exports = function (services) {

  var proxy = Proxy.create(proxy_handler);

  cache.set(proxy, map(services, versionProxy));

  return proxy;
};
