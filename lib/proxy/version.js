/*

  proxy to pass through host level services

*/
var co = require('co');
var func = require('super-func');

var cache = new WeakMap;
var apiProxy = require('./api');
var versionProxy;

var proxy_handler = {
  // NOTE: receiver === proxy created in module.exports!!!
  get: function(receiver, property) {

    var services = cache.get(receiver);

    if (services[property]) {
      return services[property];
    }
    else {
      throw new ReferenceError('');
    }

  },
  set: function(receiver, property) {
    return new Error('su-service: cannot set a property on an API.');
  }
};

module.exports = function * (property, services) {

  versionProxy = cache.get(versionProxy);

  if (!versionProxy) {

    versionProxy = Proxy.create(proxy_handler);
    cache.set(versionProxy, services);

  }

  return versionProxy;
};
