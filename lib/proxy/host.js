/*

  proxy to pass through host level services

*/
var versionProxy = require('./version');
var cache = new WeakMap;

var proxy_handler = {
  // NOTE: receiver === proxy created in module.exports!!!
  get: function(receiver, property) {

    var services = cache.get(receiver);

    return services[property] || throw new ReferenceError('');

  },
  set: function(receiver, property) {
    return new Error('su-service: cannot set a property on an API.');
  }
};

module.exports = function * (services) {

  var versions = map(services, function ())

  var proxy = Proxy.create(proxy_handler);

  cache.set(proxy, versions);

  return proxy;
};
