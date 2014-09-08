/*

  proxy to pass through version level services

*/
var iter = require('super-iter');
var map = iter.map;

var request = require('co-request');
var cache = new WeakMap;

var proxy_handler = {
  // NOTE: receiver === proxy created in module.exports!!!
  get: function(receiver, property) {

    var apis = cache.get(receiver);

    if (apis[property]) {

      return apis[property]
    }

    throw new ReferenceError(property + ': does not exist');
  },

  set: function(receiver, property) {

    return new Error('su-service: cannot set a property on a service.');
  }
};




function createRequest (api) {

  return function * (params) {

    return yield request({
      url: api.uri,
      method: api.method.toUpperCase(),
      json: api.type
    });

  }
}


module.exports = function (api) {

  var proxy = Proxy.create(proxy_handler);

  cache.set(proxy, map(api, createRequest));

  return proxy;
};


