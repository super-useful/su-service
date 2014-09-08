/*

  proxy to pass through version level services

*/
var iter = require('super-iter');
var map = iter.map;

var request = require('co-request');

var receiver = require('./receiver');


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

  var proxy = Proxy.create(receiver.handler);

  receiver.cache.set(proxy, map(api, createRequest));

  return proxy;
};


