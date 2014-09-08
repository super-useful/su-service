/*

  proxy to pass through version level services

*/
var iter = require('super-iter');
var map = iter.map;
var apiProxy = require('./api');

var receiver = require('./receiver');

module.exports = function (version) {

  var proxy = Proxy.create(receiver.handler);

  receiver.cache.set(proxy, map(version, apiProxy));

  return proxy;
};
