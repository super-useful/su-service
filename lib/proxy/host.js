/*

  proxy to pass through host level services

*/
var iter = require('super-iter');
var map = iter.map;
var versionProxy = require('./version');

var receiver = require('./receiver');


module.exports = function (services) {

  var proxy = Proxy.create(receiver.handler);

  receiver.cache.set(proxy, map(services, versionProxy));

  return proxy;
};
